import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeDependencies } from './analyzer.js'

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock('../parsers/packageJson.parser.js', () => ({
  parsePackageJson: vi.fn(),
}))

vi.mock('../services/npm.service.js', () => ({
  fetchNpmData: vi.fn(),
}))

vi.mock('../services/github.service.js', () => ({
  fetchGithubData: vi.fn(),
}))

vi.mock('../services/osv.service.js', () => ({
  fetchOsvData: vi.fn(),
}))

vi.mock('../services/ai.service.js', () => ({
  getAiRecommendation: vi.fn(),
}))

import * as parser from '../parsers/packageJson.parser.js'
import * as npmService from '../services/npm.service.js'
import * as githubService from '../services/github.service.js'
import * as osvService from '../services/osv.service.js'
import * as aiService from '../services/ai.service.js'

const mockParsePackageJson = vi.mocked(parser.parsePackageJson)
const mockFetchNpmData = vi.mocked(npmService.fetchNpmData)
const mockFetchGithubData = vi.mocked(githubService.fetchGithubData)
const mockFetchOsvData = vi.mocked(osvService.fetchOsvData)
const mockGetAiRecommendation = vi.mocked(aiService.getAiRecommendation)

const npmData = {
  lastPublishDate: '2024-01-01T00:00:00Z',
  weeklyDownloads: 500_000,
  license: 'MIT',
  latestVersion: '4.18.2',
  description: 'Fast web framework',
  repositoryUrl: 'https://github.com/expressjs/express',
}

const githubData = {
  contributorCount: 20,
  openIssueCount: 50,
  closedIssueCount: 500,
  stars: 10_000,
  lastCommitDate: '2024-01-01T00:00:00Z',
  repoUrl: 'https://github.com/expressjs/express',
}

const osvData = { vulnerabilities: [] }

beforeEach(() => {
  vi.clearAllMocks()
  mockGetAiRecommendation.mockResolvedValue('AI recommendation text')
})

// ── analyzeDependencies ────────────────────────────────────────────────

describe('analyzeDependencies', () => {
  it('should return full analysis result for a single dependency', async () => {
    mockParsePackageJson.mockReturnValue({
      dependencies: [{ name: 'express', version: '^4.18.2', type: 'dependency' }],
      totalCount: 1,
      wasTruncated: false,
    })
    mockFetchNpmData.mockResolvedValue(npmData)
    mockFetchGithubData.mockResolvedValue(githubData)
    mockFetchOsvData.mockResolvedValue(osvData)

    const result = await analyzeDependencies('{"dependencies":{"express":"^4.18.2"}}')

    expect(result.analyzedCount).toBe(1)
    expect(result.totalDependencies).toBe(1)
    expect(result.wasTruncated).toBe(false)
    expect(result.dependencies).toHaveLength(1)
    expect(result.dependencies[0].name).toBe('express')
    expect(result.dependencies[0].riskScore).toBeGreaterThanOrEqual(0)
    expect(result.dependencies[0].riskScore).toBeLessThanOrEqual(100)
    expect(result.aiRecommendation).toBe('AI recommendation text')
  })

  it('should return zero score and empty deps when no dependencies', async () => {
    mockParsePackageJson.mockReturnValue({ dependencies: [], totalCount: 0, wasTruncated: false })

    const result = await analyzeDependencies('{"dependencies":{}}')

    expect(result.analyzedCount).toBe(0)
    expect(result.overallScore).toBe(0)
    expect(result.dependencies).toHaveLength(0)
  })

  it('should mark hasPartialData when npm service returns null', async () => {
    mockParsePackageJson.mockReturnValue({
      dependencies: [{ name: 'pkg', version: '^1.0.0', type: 'dependency' }],
      totalCount: 1,
      wasTruncated: false,
    })
    mockFetchNpmData.mockResolvedValue(null)
    mockFetchGithubData.mockResolvedValue(githubData)
    mockFetchOsvData.mockResolvedValue(osvData)

    const result = await analyzeDependencies('{}')

    expect(result.dependencies[0].hasPartialData).toBe(true)
  })

  it('should mark hasPartialData when github service returns null', async () => {
    mockParsePackageJson.mockReturnValue({
      dependencies: [{ name: 'pkg', version: '^1.0.0', type: 'dependency' }],
      totalCount: 1,
      wasTruncated: false,
    })
    mockFetchNpmData.mockResolvedValue(npmData)
    mockFetchGithubData.mockResolvedValue(null)
    mockFetchOsvData.mockResolvedValue(osvData)

    const result = await analyzeDependencies('{}')

    expect(result.dependencies[0].hasPartialData).toBe(true)
  })

  it('should sort dependencies by risk score descending', async () => {
    mockParsePackageJson.mockReturnValue({
      dependencies: [
        { name: 'safe-pkg', version: '1.0.0', type: 'dependency' },
        { name: 'risky-pkg', version: '*', type: 'dependency' },
      ],
      totalCount: 2,
      wasTruncated: false,
    })
    mockFetchNpmData
      .mockResolvedValueOnce({ ...npmData, weeklyDownloads: 2_000_000 })
      .mockResolvedValueOnce({ ...npmData, weeklyDownloads: 50, lastPublishDate: '2019-01-01T00:00:00Z' })
    mockFetchGithubData.mockResolvedValue(githubData)
    mockFetchOsvData.mockResolvedValue(osvData)

    const result = await analyzeDependencies('{}')

    expect(result.dependencies[0].riskScore).toBeGreaterThanOrEqual(result.dependencies[1].riskScore)
  })

  it('should set wasTruncated true when package.json exceeds 50 deps', async () => {
    mockParsePackageJson.mockReturnValue({
      dependencies: [],
      totalCount: 75,
      wasTruncated: true,
    })

    const result = await analyzeDependencies('{"dependencies":{}}')

    expect(result.wasTruncated).toBe(true)
    expect(result.totalDependencies).toBe(75)
  })

  it('should count risk levels summing to analyzedCount', async () => {
    mockParsePackageJson.mockReturnValue({
      dependencies: [
        { name: 'pkg-a', version: '^1.0.0', type: 'dependency' },
        { name: 'pkg-b', version: '^2.0.0', type: 'dependency' },
      ],
      totalCount: 2,
      wasTruncated: false,
    })
    mockFetchNpmData.mockResolvedValue(npmData)
    mockFetchGithubData.mockResolvedValue(githubData)
    mockFetchOsvData.mockResolvedValue(osvData)

    const result = await analyzeDependencies('{}')

    const totalCounted = result.riskCounts.critical + result.riskCounts.high + result.riskCounts.medium + result.riskCounts.low
    expect(totalCounted).toBe(result.analyzedCount)
  })

  it('should include all 7 signal scores per dependency', async () => {
    mockParsePackageJson.mockReturnValue({
      dependencies: [{ name: 'pkg', version: '^1.0.0', type: 'dependency' }],
      totalCount: 1,
      wasTruncated: false,
    })
    mockFetchNpmData.mockResolvedValue(npmData)
    mockFetchGithubData.mockResolvedValue(githubData)
    mockFetchOsvData.mockResolvedValue(osvData)

    const result = await analyzeDependencies('{}')

    expect(result.dependencies[0].signals).toHaveLength(7)
  })

  it('should return a valid grade based on overall score', async () => {
    mockParsePackageJson.mockReturnValue({
      dependencies: [{ name: 'pkg', version: '^1.0.0', type: 'dependency' }],
      totalCount: 1,
      wasTruncated: false,
    })
    mockFetchNpmData.mockResolvedValue(npmData)
    mockFetchGithubData.mockResolvedValue(githubData)
    mockFetchOsvData.mockResolvedValue(osvData)

    const result = await analyzeDependencies('{}')

    expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade)
  })
})
