import type { ApiRepo, ApiScanResult } from '@shared/types'

interface ReposResponse {
  success: boolean
  data?: ApiRepo[]
  error?: string
}

interface ScanResponse {
  success: boolean
  data?: ApiScanResult
  error?: string
}

interface ResultsResponse {
  success: boolean
  data?: ApiScanResult[]
  error?: string
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.error ?? `Server error: ${response.status}`)
    }
    return (await response.json()) as T
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchRepos(): Promise<ReposResponse> {
  try {
    return await apiFetch<ReposResponse>('/api/repos')
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch repos' }
  }
}

export async function scanRepo(id: string): Promise<ScanResponse> {
  try {
    return await apiFetch<ScanResponse>(`/api/repos/${id}/scan`, { method: 'POST' })
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Scan failed' }
  }
}

export async function getRepoResults(id: string): Promise<ResultsResponse> {
  try {
    return await apiFetch<ResultsResponse>(`/api/repos/${id}/results`)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch results' }
  }
}