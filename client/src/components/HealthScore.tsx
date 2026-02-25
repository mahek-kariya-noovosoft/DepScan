import type { Grade } from '@shared/types'

const gradeConfig: Record<Grade, { stroke: string; text: string; glow: string }> = {
  A: { stroke: 'stroke-emerald-500', text: 'text-emerald-400', glow: 'drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]' },
  B: { stroke: 'stroke-lime-500', text: 'text-lime-400', glow: 'drop-shadow-[0_0_12px_rgba(132,204,22,0.4)]' },
  C: { stroke: 'stroke-yellow-500', text: 'text-yellow-400', glow: 'drop-shadow-[0_0_12px_rgba(234,179,8,0.4)]' },
  D: { stroke: 'stroke-orange-500', text: 'text-orange-400', glow: 'drop-shadow-[0_0_12px_rgba(249,115,22,0.4)]' },
  F: { stroke: 'stroke-red-500', text: 'text-red-400', glow: 'drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]' },
}

interface HealthScoreProps {
  score: number
  grade: Grade
}

export function HealthScore({ score, grade }: HealthScoreProps) {
  const config = gradeConfig[grade]
  // Health = inverse of risk. A score of 0 risk = 100% health ring.
  const healthPercent = Math.max(0, Math.min(100, 100 - score))
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (healthPercent / 100) * circumference

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-6">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-gray-400">
        Health Score
      </h3>
      <div className="flex items-center justify-center">
        <div className={`relative ${config.glow}`}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            {/* Background ring */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-700/50"
            />
            {/* Score ring */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={config.stroke}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 90 90)"
              style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${config.text}`}>
              {Math.round(score)}
            </span>
            <span className={`text-2xl font-bold ${config.text} -mt-1`}>
              {grade}
            </span>
            <span className="text-xs text-gray-500 mt-1">risk score</span>
          </div>
        </div>
      </div>
    </div>
  )
}
