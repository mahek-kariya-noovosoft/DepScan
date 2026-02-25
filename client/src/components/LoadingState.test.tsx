import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LoadingState } from './LoadingState'

describe('LoadingState', () => {
  it('renders all three loading steps', () => {
    render(<LoadingState />)
    expect(screen.getByText('Parsing dependencies...')).toBeInTheDocument()
    expect(screen.getByText('Fetching package data...')).toBeInTheDocument()
    expect(screen.getByText('Calculating risk scores...')).toBeInTheDocument()
  })

  it('shows the first step as active initially', () => {
    const { container } = render(<LoadingState />)
    // The active step has a spinner (animate-spin class)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders exactly 3 steps', () => {
    render(<LoadingState />)
    const steps = screen.getAllByText(/\.\.\.$/)
    expect(steps).toHaveLength(3)
  })
})
