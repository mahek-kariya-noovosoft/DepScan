import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RiskChart } from './RiskChart'

describe('RiskChart', () => {
  it('renders without crashing with valid data', () => {
    render(<RiskChart riskCounts={{ critical: 2, high: 3, medium: 4, low: 5 }} />)
    expect(screen.getByText('Risk Distribution')).toBeInTheDocument()
  })

  it('shows the total count in the center', () => {
    render(<RiskChart riskCounts={{ critical: 1, high: 2, medium: 3, low: 4 }} />)
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('total')).toBeInTheDocument()
  })

  it('renders legend entries for non-zero counts', () => {
    render(<RiskChart riskCounts={{ critical: 2, high: 0, medium: 3, low: 5 }} />)
    expect(screen.getByText(/Critical \(2\)/)).toBeInTheDocument()
    expect(screen.getByText(/Medium \(3\)/)).toBeInTheDocument()
    expect(screen.getByText(/Low \(5\)/)).toBeInTheDocument()
    expect(screen.queryByText(/High/)).not.toBeInTheDocument()
  })

  it('renders empty state message when all counts are zero', () => {
    render(<RiskChart riskCounts={{ critical: 0, high: 0, medium: 0, low: 0 }} />)
    expect(screen.getByText('No dependencies to chart')).toBeInTheDocument()
  })

  it('renders with only one risk level having counts', () => {
    render(<RiskChart riskCounts={{ critical: 0, high: 0, medium: 0, low: 7 }} />)
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText(/Low \(7\)/)).toBeInTheDocument()
  })
})
