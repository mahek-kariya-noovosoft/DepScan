import type { AnalyzeRequest, AnalyzeResponse } from '@shared/types'

export async function analyzePackageJson(content: string): Promise<AnalyzeResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60_000)

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content } satisfies AnalyzeRequest),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      return {
        success: false,
        error: errorData?.error ?? `Server error: ${response.status}`,
      }
    }

    return (await response.json()) as AnalyzeResponse
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { success: false, error: 'Request timed out. Please try again.' }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  } finally {
    clearTimeout(timeout)
  }
}
