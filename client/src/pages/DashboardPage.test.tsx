import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { DashboardPage } from './DashboardPage'
import { healthyProject, nightmareProject, mixedProject } from '../__fixtures__/testData'

// Mock recharts to avoid SVG rendering issues in tests
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
}))

function renderDashboard(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/dashboard', state }]}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/" element={<div data-testid="landing-page">Landing</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  it('redirects to / when no data in location state', () => {
    renderDashboard(null)
    expect(screen.getByTestId('landing-page')).toBeInTheDocument()
  })

  it('redirects to / when state has no analysis key', () => {
    renderDashboard({ something: 'else' })
    expect(screen.getByTestId('landing-page')).toBeInTheDocument()
  })

  it('renders all sections with healthy-project fixture', () => {
    renderDashboard({ analysis: healthyProject })
    // Header
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('DepScan')
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    // Health score — score may appear multiple times (health ring + table), use getAllBy
    expect(screen.getByText('Health Score')).toBeInTheDocument()
    expect(screen.getAllByText(String(Math.round(healthyProject.overallScore))).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(healthyProject.grade)).toBeInTheDocument()
    // Risk distribution chart
    expect(screen.getByText('Risk Distribution')).toBeInTheDocument()
    // Stats cards
    expect(screen.getByText('Total Dependencies')).toBeInTheDocument()
    // Dependency table
    expect(screen.getByText('Dependencies')).toBeInTheDocument()
    for (const dep of healthyProject.dependencies) {
      expect(screen.getByText(dep.name)).toBeInTheDocument()
    }
    // AI recommendations
    expect(screen.getByText('AI Recommendations')).toBeInTheDocument()
  })

  it('renders correctly with risky-project fixture', () => {
    renderDashboard({ analysis: nightmareProject })
    expect(screen.getByText(String(Math.round(nightmareProject.overallScore)))).toBeInTheDocument()
    expect(screen.getByText(nightmareProject.grade)).toBeInTheDocument()
    // Should show critical and high risk badges
    expect(screen.getAllByText('critical').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('high').length).toBeGreaterThanOrEqual(1)
  })

  it('shows "Analyze Another" button', () => {
    renderDashboard({ analysis: healthyProject })
    expect(screen.getByRole('button', { name: /analyze another/i })).toBeInTheDocument()
  })

  it('shows truncation info with mixed-project fixture', () => {
    renderDashboard({ analysis: mixedProject })
    expect(screen.getByText(/Showing top 12 of 55/)).toBeInTheDocument()
  })

  it('shows AI recommendation text when available', () => {
    renderDashboard({ analysis: mixedProject })
    expect(screen.getByText(/Consider replacing moment/)).toBeInTheDocument()
  })

  it('shows "Coming Soon" when no AI recommendation', () => {
    renderDashboard({ analysis: healthyProject })
    expect(screen.getByText('Coming Soon')).toBeInTheDocument()
  })

  it('renders all dependency names from risky project', () => {
    renderDashboard({ analysis: nightmareProject })
    for (const dep of nightmareProject.dependencies) {
      expect(screen.getByText(dep.name)).toBeInTheDocument()
    }
  })
})
