import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatsCards } from './StatsCards'
import { healthyProject, nightmareProject, mixedProject } from '../__fixtures__/testData'

describe('StatsCards', () => {
  it('renders all 5 stat cards', () => {
    render(
      <StatsCards
        analyzedCount={healthyProject.analyzedCount}
        totalDependencies={healthyProject.totalDependencies}
        wasTruncated={healthyProject.wasTruncated}
        riskCounts={healthyProject.riskCounts}
      />,
    )
    expect(screen.getByText('Total Dependencies')).toBeInTheDocument()
    expect(screen.getByText('Critical')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText('Low')).toBeInTheDocument()
  })

  it('shows correct counts for healthy project', () => {
    render(
      <StatsCards
        analyzedCount={healthyProject.analyzedCount}
        totalDependencies={healthyProject.totalDependencies}
        wasTruncated={healthyProject.wasTruncated}
        riskCounts={healthyProject.riskCounts}
      />,
    )
    // total deps = 7, low = 7, so "7" appears twice
    expect(screen.getAllByText('7')).toHaveLength(2)
    expect(screen.getAllByText('0')).toHaveLength(3) // critical, high, medium = 0
  })

  it('shows correct counts for nightmare project', () => {
    render(
      <StatsCards
        analyzedCount={nightmareProject.analyzedCount}
        totalDependencies={nightmareProject.totalDependencies}
        wasTruncated={nightmareProject.wasTruncated}
        riskCounts={nightmareProject.riskCounts}
      />,
    )
    expect(screen.getByText('7')).toBeInTheDocument() // total deps
    // critical=3, high=3, so "3" appears twice
    expect(screen.getAllByText('3')).toHaveLength(2)
  })

  it('shows truncation warning when wasTruncated is true', () => {
    render(
      <StatsCards
        analyzedCount={mixedProject.analyzedCount}
        totalDependencies={mixedProject.totalDependencies}
        wasTruncated={mixedProject.wasTruncated}
        riskCounts={mixedProject.riskCounts}
      />,
    )
    expect(screen.getByText(/Showing top 12 of 55/)).toBeInTheDocument()
    // Total deps shows "12 / 55" format
    expect(screen.getByText('12 / 55')).toBeInTheDocument()
  })

  it('does not show truncation warning when wasTruncated is false', () => {
    render(
      <StatsCards
        analyzedCount={healthyProject.analyzedCount}
        totalDependencies={healthyProject.totalDependencies}
        wasTruncated={healthyProject.wasTruncated}
        riskCounts={healthyProject.riskCounts}
      />,
    )
    expect(screen.queryByText(/Showing top/)).not.toBeInTheDocument()
  })

  it('handles all-zero risk counts', () => {
    render(
      <StatsCards
        analyzedCount={0}
        totalDependencies={0}
        wasTruncated={false}
        riskCounts={{ critical: 0, high: 0, medium: 0, low: 0 }}
      />,
    )
    expect(screen.getAllByText('0')).toHaveLength(5) // all counts are 0
  })
})
