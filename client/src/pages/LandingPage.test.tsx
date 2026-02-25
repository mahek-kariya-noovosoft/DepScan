import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LandingPage } from './LandingPage'

// Mock the analyze API
vi.mock('../api/analyze', () => ({
  analyzePackageJson: vi.fn(),
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import { analyzePackageJson } from '../api/analyze'

const validJson = JSON.stringify({
  name: 'test',
  dependencies: { lodash: '^4.17.21' },
})

function renderLandingPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  )
}

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the hero text', () => {
    renderLandingPage()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('DepScan')
    expect(screen.getByText('Know Your Dependency Risk')).toBeInTheDocument()
  })

  it('renders the input area and scan button', () => {
    renderLandingPage()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /scan dependencies/i })).toBeInTheDocument()
  })

  it('renders the description text', () => {
    renderLandingPage()
    expect(screen.getByText(/paste your/i)).toBeInTheDocument()
  })

  it('textarea accepts input', () => {
    renderLandingPage()
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: validJson } })
    expect(textarea).toHaveValue(validJson)
  })

  it('shows error for invalid JSON', () => {
    renderLandingPage()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '{ bad json' } })
    expect(screen.getByText(/invalid json/i)).toBeInTheDocument()
  })

  it('scan button is disabled when textarea is empty', () => {
    renderLandingPage()
    expect(screen.getByRole('button', { name: /scan dependencies/i })).toBeDisabled()
  })

  it('shows loading state when analyzing', async () => {
    // Make analyzePackageJson hang (never resolve)
    vi.mocked(analyzePackageJson).mockReturnValue(new Promise(() => {}))
    renderLandingPage()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: validJson } })
    fireEvent.click(screen.getByRole('button', { name: /scan dependencies/i }))

    await waitFor(() => {
      expect(screen.getByText('Parsing dependencies...')).toBeInTheDocument()
    })
  })

  it('navigates to dashboard on successful analysis', async () => {
    const mockData = { success: true, data: { overallScore: 10 } }
    vi.mocked(analyzePackageJson).mockResolvedValue(mockData as never)
    renderLandingPage()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: validJson } })
    fireEvent.click(screen.getByRole('button', { name: /scan dependencies/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {
        state: { analysis: mockData.data },
      })
    })
  })

  it('shows error message on failed analysis', async () => {
    vi.mocked(analyzePackageJson).mockResolvedValue({
      success: false,
      error: 'Server error: 500',
    })
    renderLandingPage()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: validJson } })
    fireEvent.click(screen.getByRole('button', { name: /scan dependencies/i }))

    await waitFor(() => {
      expect(screen.getByText('Server error: 500')).toBeInTheDocument()
    })
  })

  it('shows "Try again" button on error and resets to idle', async () => {
    vi.mocked(analyzePackageJson).mockResolvedValue({
      success: false,
      error: 'Network error',
    })
    renderLandingPage()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: validJson } })
    fireEvent.click(screen.getByRole('button', { name: /scan dependencies/i }))

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Try again'))
    expect(screen.queryByText('Network error')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders footer hint about 50 dependency limit', () => {
    renderLandingPage()
    expect(screen.getByText(/analyzes up to 50 dependencies/i)).toBeInTheDocument()
  })
})
