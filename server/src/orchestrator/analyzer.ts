import pLimit from 'p-limit'
import type {
  ParsedDependency,
  DependencyResult,
  DependencyMetadata,
  AnalysisResult,
  SignalScore,
} from '@shared/types/index'
import { parsePackageJson } from '../parsers/packageJson.parser.js'
import { fetchNpmData } from '../services/npm.service.js'
import { fetchGithubData } from '../services/github.service.js'
import { fetchOsvData } from '../services/osv.service.js'
import {
  scoreStaleness,
  scoreVulnerabilities,
  scoreBusFactor,
  scoreOpenIssues,
  scoreDownloadTrend,
  scoreLicense,
  scoreVersionPinning,
} from '../scoring/signals.js'
import { calculateRiskScore, calculateGrade, calculateOverallScore, getRiskLevel } from '../scoring/aggregate.js'
import { getAiRecommendation } from '../services/ai.service.js'

const CONCURRENCY = 5

async function analyzeSingleDependency(dep: ParsedDependency): Promise<DependencyResult> {
  // Fetch npm and osv data in parallel
  const [npmResult, osvResult] = await Promise.allSettled([
    fetchNpmData(dep.name),
    fetchOsvData(dep.name, dep.version),
  ])

  const npmData = npmResult.status === 'fulfilled' ? npmResult.value : null
  const osvData = osvResult.status === 'fulfilled' ? osvResult.value : null

  // Fetch GitHub data using repo URL discovered from npm registry
  let githubData = null
  try {
    githubData = await fetchGithubData(dep.name, npmData?.repositoryUrl)
  } catch {
    // GitHub fetch failed — mark as partial data
  }

  const metadata: DependencyMetadata = {}
  let hasPartialData = false

  if (npmData) {
    metadata.npmData = {
      lastPublishDate: npmData.lastPublishDate,
      weeklyDownloads: npmData.weeklyDownloads,
      license: npmData.license,
      latestVersion: npmData.latestVersion,
      description: npmData.description,
    }
  } else {
    hasPartialData = true
  }

  if (githubData) {
    metadata.githubData = githubData
  } else {
    hasPartialData = true
  }

  if (osvData) {
    metadata.osvData = osvData
  } else {
    hasPartialData = true
  }

  // Score all 7 signals
  const signals: SignalScore[] = [
    scoreStaleness(npmData?.lastPublishDate),
    scoreVulnerabilities(osvData?.vulnerabilities),
    scoreBusFactor(githubData?.contributorCount),
    scoreOpenIssues(githubData?.openIssueCount, githubData?.closedIssueCount),
    scoreDownloadTrend(npmData?.weeklyDownloads),
    scoreLicense(npmData?.license),
    scoreVersionPinning(dep.version),
  ]

  const riskScore = calculateRiskScore(signals)
  const riskLevel = getRiskLevel(riskScore)

  return {
    name: dep.name,
    version: dep.version,
    type: dep.type,
    riskScore,
    riskLevel,
    signals,
    metadata,
    hasPartialData,
  }
}

export async function analyzeDependencies(content: string): Promise<AnalysisResult> {
  const { dependencies, totalCount, wasTruncated } = parsePackageJson(content)

  const limit = pLimit(CONCURRENCY)
  const results = await Promise.all(
    dependencies.map((dep) => limit(() => analyzeSingleDependency(dep))),
  )

  // Sort by risk score descending (highest risk first)
  results.sort((depA, depB) => depB.riskScore - depA.riskScore)

  const riskCounts = { critical: 0, high: 0, medium: 0, low: 0 }
  for (const dep of results) {
    riskCounts[dep.riskLevel]++
  }

  let overallScore = 0
  if (results.length > 0) {
    const average = results.reduce((sum, dep) => sum + dep.riskScore, 0) / results.length
    const maxScore = results[0].riskScore
    const highAndCriticalCount = riskCounts.critical + riskCounts.high
    overallScore = calculateOverallScore(average, maxScore, highAndCriticalCount)
  }

  const grade = calculateGrade(overallScore)

  const aiRecommendation = await getAiRecommendation(results)

  return {
    overallScore,
    grade,
    totalDependencies: totalCount,
    analyzedCount: results.length,
    wasTruncated,
    riskCounts,
    dependencies: results,
    aiRecommendation,
  }
}
