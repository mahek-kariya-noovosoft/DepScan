import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RiskBadge } from './RiskBadge'
import type { RiskLevel } from '@shared/types'

describe('RiskBadge', () => {
  const levels: RiskLevel[] = ['critical', 'high', 'medium', 'low']

  it.each(levels)('renders the %s risk level text', (level) => {
    render(<RiskBadge level={level} />)
    expect(screen.getByText(level)).toBeInTheDocument()
  })

  it('renders red styling for critical', () => {
    render(<RiskBadge level="critical" />)
    const badge = screen.getByText('critical')
    expect(badge.className).toContain('red')
  })

  it('renders orange styling for high', () => {
    render(<RiskBadge level="high" />)
    const badge = screen.getByText('high')
    expect(badge.className).toContain('orange')
  })

  it('renders yellow styling for medium', () => {
    render(<RiskBadge level="medium" />)
    const badge = screen.getByText('medium')
    expect(badge.className).toContain('yellow')
  })

  it('renders green styling for low', () => {
    render(<RiskBadge level="low" />)
    const badge = screen.getByText('low')
    expect(badge.className).toContain('green')
  })
})
