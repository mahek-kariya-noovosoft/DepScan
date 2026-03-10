import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ApiRepo, AnalysisResult, DependencyResult, Grade } from '@shared/types'
import { scanRepo } from '../api/repos'

interface RepoCardProps {
  repo: ApiRepo
}

function toAnalysisResult(scan: { overallScore: number; grade: string; riskCounts: string; dependencies: string }): AnalysisResult {
  const deps = JSON.parse(scan.dependencies) as DependencyResult[]
  return {
    overallScore: scan.overallScore,
    grade: scan.grade as Grade,
    totalDependencies: deps.length,
    analyzedCount: deps.length,
    wasTruncated: false,
    riskCounts: JSON.parse(scan.riskCounts) as AnalysisResult['riskCounts'],
    dependencies: deps,
    aiRecommendation: 'AI-powered recommendations coming soon...',
  }
}

export function RepoCard({ repo }: RepoCardProps) {
  const navigate = useNavigate()
  const [scanning, setScanning] = useState(false)
  const [noPackageJson, setNoPackageJson] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  const lastScanned = repo.lastScannedAt
    ? new Date(repo.lastScannedAt).toLocaleDateString()
    : null

  const handleScan = async () => {
    setScanning(true)
    setNoPackageJson(false)
    setScanError(null)

    const result = await scanRepo(repo.id)

    if (result.success && result.data) {
      navigate('/dashboard', { state: { analysis: toAnalysisResult(result.data) } })
      return
    }

    setScanning(false)
    if (result.error?.includes('No package.json')) {
      setNoPackageJson(true)
    } else {
      setScanError(result.error ?? 'Scan failed')
    }
  }

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-gray-100 font-semibold text-sm truncate">{repo.name}</h3>
          <p className="text-gray-500 text-xs mt-0.5 truncate">{repo.fullName}</p>
        </div>
        <div className="flex items-center gap-1 text-yellow-400 text-xs shrink-0">
          <span>★</span>
          <span>{repo.stars.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500">
        {repo.language && <span className="bg-gray-700 px-2 py-0.5 rounded">{repo.language}</span>}
        {lastScanned && <span>Scanned {lastScanned}</span>}
      </div>

      {noPackageJson && (
        <p className="text-xs text-amber-400">No package.json found in this repository</p>
      )}
      {scanError && <p className="text-xs text-red-400">{scanError}</p>}

      <button
        onClick={handleScan}
        disabled={scanning}
        className="mt-auto w-full py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {scanning ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Scanning…
          </>
        ) : (
          'Scan'
        )}
      </button>
    </div>
  )
}