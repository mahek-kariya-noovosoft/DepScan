import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AiRecommendations } from './AiRecommendations'

describe('AiRecommendations', () => {
  it('renders the "Coming Soon" placeholder when no recommendation', () => {
    render(<AiRecommendations />)
    expect(screen.getByText('Coming Soon')).toBeInTheDocument()
    expect(screen.getByText('AI-powered recommendations coming soon')).toBeInTheDocument()
  })

  it('renders the "Coming Soon" placeholder for empty string', () => {
    render(<AiRecommendations recommendation="" />)
    expect(screen.getByText('Coming Soon')).toBeInTheDocument()
  })

  it('renders the "Coming Soon" placeholder for whitespace-only string', () => {
    render(<AiRecommendations recommendation="   " />)
    expect(screen.getByText('Coming Soon')).toBeInTheDocument()
  })

  it('renders actual recommendation text when provided', () => {
    const text = 'Consider replacing moment with date-fns for smaller bundle size.'
    render(<AiRecommendations recommendation={text} />)
    expect(screen.getByText(text)).toBeInTheDocument()
    expect(screen.queryByText('Coming Soon')).not.toBeInTheDocument()
  })

  it('renders the heading', () => {
    render(<AiRecommendations />)
    expect(screen.getByText('AI Recommendations')).toBeInTheDocument()
  })

  it('shows API key hint in placeholder state', () => {
    render(<AiRecommendations />)
    expect(screen.getByText('Requires Anthropic API key')).toBeInTheDocument()
  })
})
