import type { ServiceResult, GithubRepo } from '@shared/types/index.js'
import type { Repo, ScanResult } from '../generated/prisma/client.js'
import { upsertRepos, getRepoById, saveScanResult } from './db.service.js'
import { analyzeDependencies } from '../orchestrator/analyzer.js'

const GITHUB_API = 'https://api.github.com'
const TIMEOUT = 10_000

interface RawGithubRepo {
  id: number
  name: string
  full_name: string
  default_branch: string
  language: string | null
  stargazers_count: number
  updated_at: string
}

function mapGithubRepo(raw: RawGithubRepo): GithubRepo {
  return {
    id: raw.id,
    name: raw.name,
    fullName: raw.full_name,
    defaultBranch: raw.default_branch,
    language: raw.language,
    stars: raw.stargazers_count,
    updatedAt: raw.updated_at,
  }
}

// ── fetchUserRepos ────────────────────────────────────────────────────

async function fetchReposPage(
  accessToken: string,
  page: number,
): Promise<ServiceResult<{ repos: GithubRepo[]; hasNext: boolean }>> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT)
  try {
    const response = await fetch(`${GITHUB_API}/user/repos?per_page=100&page=${page}&sort=updated`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github.v3+json' },
      signal: controller.signal,
    })
    if (!response.ok) {
      return { success: false, error: `GitHub API error: ${response.status}`, status: 502 }
    }
    const data = (await response.json()) as RawGithubRepo[]
    const linkHeader = response.headers.get('Link')
    return { success: true, data: { repos: data.map(mapGithubRepo), hasNext: linkHeader?.includes('rel="next"') ?? false } }
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchUserRepos(accessToken: string): Promise<ServiceResult<GithubRepo[]>> {
  try {
    const repos: GithubRepo[] = []
    let page = 1
    let hasMore = true
    while (hasMore) {
      const pageResult = await fetchReposPage(accessToken, page)
      if (!pageResult.success) return pageResult
      repos.push(...pageResult.data.repos)
      hasMore = pageResult.data.hasNext
      page++
    }
    return { success: true, data: repos }
  } catch (error) {
    return { success: false, error: String(error), status: 500 }
  }
}

// ── syncReposToDb ─────────────────────────────────────────────────────

export async function syncReposToDb(userId: string, repos: GithubRepo[]): Promise<ServiceResult<Repo[]>> {
  return upsertRepos(
    userId,
    repos.map((repo) => ({
      githubRepoId: repo.id,
      name: repo.name,
      fullName: repo.fullName,
      defaultBranch: repo.defaultBranch,
      language: repo.language,
      stars: repo.stars,
    })),
  )
}

// ── getRepoPackageJson ────────────────────────────────────────────────

export async function getRepoPackageJson(
  owner: string,
  repo: string,
  accessToken: string,
): Promise<ServiceResult<string>> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT)
    try {
      const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/package.json`, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github.v3+json' },
        signal: controller.signal,
      })
      if (response.status === 404) {
        return { success: false, error: 'No package.json found in this repository', status: 404 }
      }
      if (!response.ok) {
        return { success: false, error: `GitHub API error: ${response.status}`, status: 502 }
      }
      const data = (await response.json()) as { content: string; encoding: string }
      if (data.encoding !== 'base64') {
        return { success: false, error: 'Unexpected encoding for package.json', status: 500 }
      }
      return { success: true, data: Buffer.from(data.content, 'base64').toString('utf-8') }
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    return { success: false, error: String(error), status: 500 }
  }
}

// ── scanRepo ──────────────────────────────────────────────────────────

export async function scanRepo(repoId: string, accessToken: string): Promise<ServiceResult<ScanResult>> {
  const repoResult = await getRepoById(repoId)
  if (!repoResult.success) return repoResult

  const [owner, repoName] = repoResult.data.fullName.split('/')
  const packageJsonResult = await getRepoPackageJson(owner, repoName, accessToken)
  if (!packageJsonResult.success) return packageJsonResult

  try {
    const analysisResult = await analyzeDependencies(packageJsonResult.data)
    return saveScanResult(repoId, analysisResult)
  } catch (error) {
    return { success: false, error: String(error), status: 500 }
  }
}
