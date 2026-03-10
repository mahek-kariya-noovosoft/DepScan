import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { createElement } from 'react'
import { useRepos } from './useRepos'

// ── Mocks ──────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../api/repos', () => ({
  fetchRepos: vi.fn(),
}))

import * as reposApi from '../api/repos'
const mockFetchRepos = vi.mocked(reposApi.fetchRepos)

function makeRepo(i: number) {
  return {
    id: `repo-${i}`,
    userId: 'user-1',
    githubRepoId: i,
    name: `repo-${i}`,
    fullName: `user/repo-${i}`,
    defaultBranch: 'main',
    language: 'TypeScript',
    stars: 0,
    lastScannedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }
}

const wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(MemoryRouter, null, children)

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Tests ──────────────────────────────────────────────────────────────

describe('useRepos', () => {
  it('should start in loading state', () => {
    mockFetchRepos.mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useRepos(), { wrapper })
    expect(result.current.state).toBe('loading')
    expect(result.current.repos).toHaveLength(0)
  })

  it('should set success state and repos after successful fetch', async () => {
    mockFetchRepos.mockResolvedValueOnce({ success: true, data: [makeRepo(1), makeRepo(2)] })

    const { result } = renderHook(() => useRepos(), { wrapper })
    await waitFor(() => expect(result.current.state).toBe('success'))

    expect(result.current.repos).toHaveLength(2)
    expect(result.current.errorMessage).toBeNull()
  })

  it('should set error state when fetch fails', async () => {
    mockFetchRepos.mockResolvedValueOnce({ success: false, error: 'Service unavailable' })

    const { result } = renderHook(() => useRepos(), { wrapper })
    await waitFor(() => expect(result.current.state).toBe('error'))

    expect(result.current.errorMessage).toBe('Service unavailable')
  })

  it('should navigate to / when error includes 401', async () => {
    mockFetchRepos.mockResolvedValueOnce({ success: false, error: 'Server error: 401' })

    renderHook(() => useRepos(), { wrapper })
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
  })

  it('should navigate to / when error includes unauthorized', async () => {
    mockFetchRepos.mockResolvedValueOnce({ success: false, error: 'Unauthorized' })

    renderHook(() => useRepos(), { wrapper })
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
  })

  it('should calculate correct totalPages for more than 20 repos', async () => {
    const repos = Array.from({ length: 25 }, (_, i) => makeRepo(i))
    mockFetchRepos.mockResolvedValueOnce({ success: true, data: repos })

    const { result } = renderHook(() => useRepos(), { wrapper })
    await waitFor(() => expect(result.current.state).toBe('success'))

    expect(result.current.totalPages).toBe(2)
    expect(result.current.pagedRepos).toHaveLength(20)
  })

  it('should return 1 total page when 20 or fewer repos', async () => {
    const repos = Array.from({ length: 10 }, (_, i) => makeRepo(i))
    mockFetchRepos.mockResolvedValueOnce({ success: true, data: repos })

    const { result } = renderHook(() => useRepos(), { wrapper })
    await waitFor(() => expect(result.current.state).toBe('success'))

    expect(result.current.totalPages).toBe(1)
    expect(result.current.pagedRepos).toHaveLength(10)
  })

  it('should update pagedRepos when setPage is called', async () => {
    const repos = Array.from({ length: 25 }, (_, i) => makeRepo(i))
    mockFetchRepos.mockResolvedValueOnce({ success: true, data: repos })

    const { result } = renderHook(() => useRepos(), { wrapper })
    await waitFor(() => expect(result.current.state).toBe('success'))

    act(() => result.current.setPage(2))

    expect(result.current.page).toBe(2)
    expect(result.current.pagedRepos).toHaveLength(5)
    expect(result.current.pagedRepos[0].name).toBe('repo-20')
  })
})
