import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HealthScore } from './HealthScore'
import type { Grade } from '@shared/types'

describe('HealthScore', () => {
  it('renders the score number', () => {
    render(<HealthScore score={42} grade="C" />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders the letter grade', () => {
    render(<HealthScore score={42} grade="C" />)
    expect(screen.getByText('C')).toBeInTheDocument()
  })

  it('renders "risk score" label', () => {
    render(<HealthScore score={10} grade="A" />)
    expect(screen.getByText('risk score')).toBeInTheDocument()
  })

  it('shows emerald/green styling for grade A', () => {
    const { container } = render(<HealthScore score={12} grade="A" />)
    const scoreText = screen.getByText('12')
    expect(scoreText.className).toContain('emerald')
    const circle = container.querySelector('circle.stroke-emerald-500')
    expect(circle).toBeInTheDocument()
  })

  it('shows red styling for grade F', () => {
    const { container } = render(<HealthScore score={90} grade="F" />)
    const scoreText = screen.getByText('90')
    expect(scoreText.className).toContain('red')
    const circle = container.querySelector('circle.stroke-red-500')
    expect(circle).toBeInTheDocument()
  })

  it.each<[Grade, string]>([
    ['A', 'emerald'],
    ['B', 'lime'],
    ['C', 'yellow'],
    ['D', 'orange'],
    ['F', 'red'],
  ])('renders correct color theme for grade %s', (grade, color) => {
    render(<HealthScore score={50} grade={grade} />)
    const gradeText = screen.getByText(grade)
    expect(gradeText.className).toContain(color)
  })

  it('rounds decimal scores to nearest integer', () => {
    render(<HealthScore score={14.7} grade="A" />)
    expect(screen.getByText('15')).toBeInTheDocument()
  })
})
