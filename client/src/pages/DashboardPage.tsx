import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import type { AnalysisResult } from '@shared/types'
import { HealthScore } from '../components/HealthScore'
import { StatsCards } from '../components/StatsCards'
import { RiskChart } from '../components/RiskChart'
import { DependencyTable } from '../components/DependencyTable'
import { AiRecommendations } from '../components/AiRecommendations'

interface DashboardLocationState {
  analysis: AnalysisResult
}

export function DashboardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as DashboardLocationState | null

  if (!state?.analysis) {
    return <Navigate to="/" replace />
  }

  const { analysis } = state

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-gray-50">
              Dep<span className="text-emerald-400">Scan</span>
            </h1>
            <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs text-gray-400">
              Dashboard
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-gray-100"
          >
            Analyze Another
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Top row: Health Score + Risk Chart + AI */}
        <div className="grid gap-6 md:grid-cols-3">
          <HealthScore score={analysis.overallScore} grade={analysis.grade} />
          <RiskChart riskCounts={analysis.riskCounts} />
          <AiRecommendations recommendation={analysis.aiRecommendation} />
        </div>

        {/* Stats cards row */}
        <StatsCards
          analyzedCount={analysis.analyzedCount}
          totalDependencies={analysis.totalDependencies}
          wasTruncated={analysis.wasTruncated}
          riskCounts={analysis.riskCounts}
        />

        {/* Dependency table */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-200">
            Dependencies
          </h2>
          <DependencyTable dependencies={analysis.dependencies} />
        </div>
      </main>
    </div>
  )
}
