import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ReposPage } from './ReposPage'

// ── Mocks ──────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../api/repos', () => ({
  fetchRepos: vi.fn(),
  scanRepo: vi.fn(),
}))

import * as reposApi from '../api/repos'
const mockFetchRepos = vi.mocked(reposApi.fetchRepos)

function makeRepo(overrides = {}) {
  return {
    id: 'repo-1',
    userId: 'user-1',
    githubRepoId: 1,
    name: 'my-repo',
    fullName: 'user/my-repo',
    defaultBranch: 'main',
    language: 'TypeScript',
    stars: 10,
    lastScannedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ReposPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Loading state ──────────────────────────────────────────────────────

describe('ReposPage loading', () => {
  it('should show loading skeletons while fetching', () => {
    mockFetchRepos.mockImplementation(() => new Promise(() => {})) // never resolves
    renderPage()
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})

// ── Success state ──────────────────────────────────────────────────────

describe('ReposPage success', () => {
  it('should render a list of RepoCards', async () => {
    mockFetchRepos.mockResolvedValueOnce({ success: true, data: [makeRepo()] })

    renderPage()
    await waitFor(() => {
      expect(screen.getByText('my-repo')).toBeInTheDocument()
    })
  })

  it('should show empty state when no repos found', async () => {
    mockFetchRepos.mockResolvedValueOnce({ success: true, data: [] })

    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/No repos found/)).toBeInTheDocument()
    })
  })

  it('should show pagination when more than 20 repos', async () => {
    const repos = Array.from({ length: 25 }, (_, i) =>
      makeRepo({ id: `repo-${i}`, githubRepoId: i, name: `repo-${i}`, fullName: `user/repo-${i}` }),
    )
    mockFetchRepos.mockResolvedValueOnce({ success: true, data: repos })

    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument()
    })
  })

  it('should navigate pages with pagination controls', async () => {
    const repos = Array.from({ length: 25 }, (_, i) =>
      makeRepo({ id: `repo-${i}`, githubRepoId: i, name: `repo-${i}`, fullName: `user/repo-${i}` }),
    )
    mockFetchRepos.mockResolvedValueOnce({ success: true, data: repos })

    renderPage()
    await waitFor(() => screen.getByText(/Page 1 of 2/))

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument()
  })

  it('should not show pagination when 20 or fewer repos', async () => {
    const repos = Array.from({ length: 5 }, (_, i) =>
      makeRepo({ id: `repo-${i}`, githubRepoId: i, name: `repo-${i}`, fullName: `user/repo-${i}` }),
    )
    mockFetchRepos.mockResolvedValueOnce({ success: true, data: repos })

    renderPage()
    await waitFor(() => screen.getByText('repo-0'))
    expect(screen.queryByText(/Page/)).not.toBeInTheDocument()
  })
})

// ── Error state ────────────────────────────────────────────────────────

describe('ReposPage error', () => {
  it('should show error message when fetch fails', async () => {
    mockFetchRepos.mockResolvedValueOnce({ success: false, error: 'Service unavailable' })

    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/Failed to load repos/)).toBeInTheDocument()
    })
  })

  it('should redirect to / on 401 unauthorized error', async () => {
    mockFetchRepos.mockResolvedValueOnce({ success: false, error: 'Server error: 401' })

    renderPage()
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })
})