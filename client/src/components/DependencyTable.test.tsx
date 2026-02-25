import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DependencyTable } from './DependencyTable'
import { healthyProject, nightmareProject } from '../__fixtures__/testData'

describe('DependencyTable', () => {
  it('renders all dependency names from the fixture', () => {
    render(<DependencyTable dependencies={healthyProject.dependencies} />)
    for (const dep of healthyProject.dependencies) {
      expect(screen.getByText(dep.name)).toBeInTheDocument()
    }
  })

  it('renders column headers', () => {
    render(<DependencyTable dependencies={healthyProject.dependencies} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Version')).toBeInTheDocument()
    expect(screen.getByText('Last Updated')).toBeInTheDocument()
    expect(screen.getByText('Downloads')).toBeInTheDocument()
    expect(screen.getByText('Vulns')).toBeInTheDocument()
    expect(screen.getByText('Risk Score')).toBeInTheDocument()
  })

  it('default sort is risk score descending (highest first)', () => {
    render(<DependencyTable dependencies={healthyProject.dependencies} />)
    const rows = screen.getAllByRole('button')
    // First row button should contain the highest risk dep
    const sortedByRisk = [...healthyProject.dependencies].sort(
      (depA, depB) => depB.riskScore - depA.riskScore,
    )
    expect(within(rows[0]).getByText(sortedByRisk[0].name)).toBeInTheDocument()
  })

  it('clicking name column header sorts by name', () => {
    render(<DependencyTable dependencies={healthyProject.dependencies} />)
    fireEvent.click(screen.getByText('Name'))
    const rows = screen.getAllByRole('button')
    const sortedByName = [...healthyProject.dependencies].sort((depA, depB) =>
      depA.name.localeCompare(depB.name),
    )
    expect(within(rows[0]).getByText(sortedByName[0].name)).toBeInTheDocument()
  })

  it('clicking same column header toggles sort direction', () => {
    render(<DependencyTable dependencies={healthyProject.dependencies} />)
    // Click Risk Score to ensure desc (already default), then click again for asc
    fireEvent.click(screen.getByText('Risk Score'))
    const rows = screen.getAllByRole('button')
    const sortedAsc = [...healthyProject.dependencies].sort(
      (depA, depB) => depA.riskScore - depB.riskScore,
    )
    expect(within(rows[0]).getByText(sortedAsc[0].name)).toBeInTheDocument()
  })

  it('clicking a row expands to show signal breakdown', () => {
    render(<DependencyTable dependencies={healthyProject.dependencies} />)
    const firstRow = screen.getByText(healthyProject.dependencies[0].name).closest('button')!
    fireEvent.click(firstRow)
    expect(screen.getByText('Signal Breakdown')).toBeInTheDocument()
    expect(screen.getByText('Weighted Total:')).toBeInTheDocument()
  })

  it('clicking an expanded row collapses it', () => {
    render(<DependencyTable dependencies={healthyProject.dependencies} />)
    const firstRow = screen.getByText(healthyProject.dependencies[0].name).closest('button')!
    fireEvent.click(firstRow)
    expect(screen.getByText('Signal Breakdown')).toBeInTheDocument()
    fireEvent.click(firstRow)
    expect(screen.queryByText('Signal Breakdown')).not.toBeInTheDocument()
  })

  it('shows signal details in expanded row', () => {
    render(<DependencyTable dependencies={healthyProject.dependencies} />)
    const dep = healthyProject.dependencies[0]
    const row = screen.getByText(dep.name).closest('button')!
    fireEvent.click(row)
    // Check that signal names appear
    expect(screen.getByText('staleness')).toBeInTheDocument()
    expect(screen.getByText('vulnerabilities')).toBeInTheDocument()
    expect(screen.getByText('busFactor')).toBeInTheDocument()
  })

  it('shows partial data warning icon when hasPartialData is true', () => {
    render(<DependencyTable dependencies={nightmareProject.dependencies} />)
    // nomnom and node-uuid have hasPartialData: true
    const warnings = screen.getAllByTitle('Partial data — some API calls failed')
    expect(warnings.length).toBeGreaterThanOrEqual(1)
  })

  it('shows dep/devDep type badges correctly', () => {
    render(<DependencyTable dependencies={healthyProject.dependencies} />)
    // healthyProject has 4 deps and 3 devDeps
    expect(screen.getAllByText('dep')).toHaveLength(4)
    expect(screen.getAllByText('devDep')).toHaveLength(3)
  })

  it('shows vulnerability count for deps with vulns', () => {
    render(<DependencyTable dependencies={nightmareProject.dependencies} />)
    // moment has 3 vulns (highest count in nightmareProject)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows 0 for deps with no vulnerabilities', () => {
    render(<DependencyTable dependencies={healthyProject.dependencies} />)
    // All 7 healthy deps have 0 vulns
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(7)
  })

  it('renders risk badges with correct levels', () => {
    render(<DependencyTable dependencies={nightmareProject.dependencies} />)
    expect(screen.getAllByText('critical').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('high').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('low').length).toBeGreaterThanOrEqual(1)
  })
})
