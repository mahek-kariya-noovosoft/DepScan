import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RepoCard } from './RepoCard'

// ── Mocks ──────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../api/repos', () => ({
  scanRepo: vi.fn(),
}))

import * as reposApi from '../api/repos'
const mockScanRepo = vi.mocked(reposApi.scanRepo)

const repo = {
  id: 'repo-1',
  userId: 'user-1',
  githubRepoId: 42,
  name: 'my-repo',
  fullName: 'user/my-repo',
  defaultBranch: 'main',
  language: 'TypeScript',
  stars: 100,
  lastScannedAt: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

function renderCard(overrides = {}) {
  return render(
    <MemoryRouter>
      <RepoCard repo={{ ...repo, ...overrides }} />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Rendering ──────────────────────────────────────────────────────────

describe('RepoCard rendering', () => {
  it('should render repo name and full name', () => {
    renderCard()
    expect(screen.getByText('my-repo')).toBeInTheDocument()
    expect(screen.getByText('user/my-repo')).toBeInTheDocument()
  })

  it('should render language badge when language is set', () => {
    renderCard()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('should not render language badge when language is null', () => {
    renderCard({ language: null })
    expect(screen.queryByText('TypeScript')).not.toBeInTheDocument()
  })

  it('should render star count', () => {
    renderCard()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('should render last scanned date when available', () => {
    renderCard({ lastScannedAt: '2024-06-15T00:00:00Z' })
    expect(screen.getByText(/Scanned/)).toBeInTheDocument()
  })

  it('should not render last scanned date when null', () => {
    renderCard()
    expect(screen.queryByText(/Scanned/)).not.toBeInTheDocument()
  })

  it('should render Scan button', () => {
    renderCard()
    expect(screen.getByRole('button', { name: 'Scan' })).toBeInTheDocument()
  })
})

// ── Scan button behavior ───────────────────────────────────────────────

describe('Scan button', () => {
  it('should show loading spinner while scanning', async () => {
    mockScanRepo.mockImplementation(() => new Promise(() => {})) // never resolves

    renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'Scan' }))

    await waitFor(() => {
      expect(screen.getByText(/Scanning/)).toBeInTheDocument()
    })
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should navigate to dashboard with analysis result on successful scan', async () => {
    mockScanRepo.mockResolvedValueOnce({
      success: true,
      data: {
        id: 'scan-1',
        repoId: 'repo-1',
        overallScore: 40,
        grade: 'B',
        riskCounts: '{"critical":0,"high":1,"medium":1,"low":0}',
        dependencies: '[]',
        scannedAt: '2024-01-01T00:00:00Z',
      },
    })

    renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'Scan' }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', expect.objectContaining({ state: expect.anything() }))
    })
  })

  it('should show "No package.json" message when scan returns 404 error', async () => {
    mockScanRepo.mockResolvedValueOnce({
      success: false,
      error: 'No package.json found in this repository',
    })

    renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'Scan' }))

    await waitFor(() => {
      expect(screen.getByText(/No package.json/)).toBeInTheDocument()
    })
  })

  it('should show generic error message when scan fails for other reason', async () => {
    mockScanRepo.mockResolvedValueOnce({ success: false, error: 'GitHub API error: 403' })

    renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'Scan' }))

    await waitFor(() => {
      expect(screen.getByText('GitHub API error: 403')).toBeInTheDocument()
    })
  })
})