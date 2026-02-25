import { useState, useMemo } from 'react'
import type { DependencyResult, SignalScore } from '@shared/types'
import { RiskBadge } from './RiskBadge'

type SortField = 'name' | 'type' | 'version' | 'lastUpdated' | 'downloads' | 'vulns' | 'riskScore'
type SortDirection = 'asc' | 'desc'

interface DependencyTableProps {
  dependencies: DependencyResult[]
}

function getLastUpdated(dep: DependencyResult): string {
  const date = dep.metadata.npmData?.lastPublishDate
  if (!date) return 'N/A'
  return formatRelativeDate(date)
}

function formatRelativeDate(isoDate: string): string {
  const now = new Date()
  const then = new Date(isoDate)
  const diffMs = now.getTime() - then.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (days < 1) return 'Today'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  const years = (days / 365).toFixed(1)
  return `${years}y ago`
}

function formatDownloads(count: number | undefined): string {
  if (count === undefined) return 'N/A'
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return String(count)
}

function getSortValue(dep: DependencyResult, field: SortField): string | number {
  switch (field) {
    case 'name':
      return dep.name.toLowerCase()
    case 'type':
      return dep.type
    case 'version':
      return dep.version
    case 'lastUpdated':
      return dep.metadata.npmData?.lastPublishDate ?? ''
    case 'downloads':
      return dep.metadata.npmData?.weeklyDownloads ?? -1
    case 'vulns':
      return dep.metadata.osvData?.vulnerabilities.length ?? 0
    case 'riskScore':
      return dep.riskScore
  }
}

function SignalBar({ signal }: { signal: SignalScore }) {
  const barWidth = Math.max(0, Math.min(100, signal.score))
  const barColor = signal.score >= 75
    ? 'bg-red-500'
    : signal.score >= 50
      ? 'bg-orange-500'
      : signal.score >= 25
        ? 'bg-yellow-500'
        : 'bg-green-500'

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-28 shrink-0 text-xs text-gray-400 capitalize">
        {signal.signal}
      </span>
      <div className="flex-1">
        <div className="h-2 w-full rounded-full bg-gray-700">
          <div
            className={`h-2 rounded-full ${barColor} transition-all`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
      <span className="w-10 text-right text-xs font-mono text-gray-300">
        {Math.round(signal.score)}
      </span>
      <span className="w-12 text-right text-xs text-gray-500">
        x{signal.weight.toFixed(2)}
      </span>
      {!signal.available && (
        <span className="text-xs text-gray-600" title="Signal data unavailable">
          N/A
        </span>
      )}
    </div>
  )
}

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  if (!active) {
    return (
      <svg className="ml-1 inline h-3 w-3 text-gray-600" viewBox="0 0 10 14" fill="currentColor">
        <path d="M5 0L9.33 5H0.67L5 0Z" />
        <path d="M5 14L0.67 9H9.33L5 14Z" />
      </svg>
    )
  }
  return (
    <svg className="ml-1 inline h-3 w-3 text-blue-400" viewBox="0 0 10 8" fill="currentColor">
      {direction === 'asc'
        ? <path d="M5 0L9.33 8H0.67L5 0Z" />
        : <path d="M5 8L0.67 0H9.33L5 8Z" />
      }
    </svg>
  )
}

export function DependencyTable({ dependencies }: DependencyTableProps) {
  const [sortField, setSortField] = useState<SortField>('riskScore')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const sorted = useMemo(() => {
    return [...dependencies].sort((depA, depB) => {
      const valueA = getSortValue(depA, sortField)
      const valueB = getSortValue(depB, sortField)

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA)
      }

      const numA = valueA as number
      const numB = valueB as number
      return sortDirection === 'asc' ? numA - numB : numB - numA
    })
  }, [dependencies, sortField, sortDirection])

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection(field === 'name' ? 'asc' : 'desc')
    }
  }

  function toggleRow(name: string) {
    setExpandedRow((prev) => (prev === name ? null : name))
  }

  const columns: { field: SortField; label: string; className?: string }[] = [
    { field: 'name', label: 'Name', className: 'text-left' },
    { field: 'type', label: 'Type', className: 'text-left' },
    { field: 'version', label: 'Version', className: 'text-left' },
    { field: 'lastUpdated', label: 'Last Updated', className: 'text-right' },
    { field: 'downloads', label: 'Downloads', className: 'text-right' },
    { field: 'vulns', label: 'Vulns', className: 'text-right' },
    { field: 'riskScore', label: 'Risk Score', className: 'text-right' },
  ]

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700/50 bg-gray-900/50">
              {columns.map((col) => (
                <th
                  key={col.field}
                  className={`cursor-pointer select-none whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 hover:text-gray-200 ${col.className ?? ''}`}
                  onClick={() => handleSort(col.field)}
                >
                  {col.label}
                  <SortIcon active={sortField === col.field} direction={sortDirection} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {sorted.map((dep) => {
              const isExpanded = expandedRow === dep.name
              const vulnCount = dep.metadata.osvData?.vulnerabilities.length ?? 0

              return (
                <tr key={dep.name} className="group">
                  <td colSpan={7} className="p-0">
                    {/* Main row */}
                    <button
                      type="button"
                      className="flex w-full items-center hover:bg-gray-700/20 transition-colors"
                      onClick={() => toggleRow(dep.name)}
                    >
                      <span className="flex-none w-[22%] min-w-0 px-4 py-3 text-left">
                        <span className="flex items-center gap-2">
                          <svg
                            className={`h-3 w-3 shrink-0 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            viewBox="0 0 6 10"
                            fill="currentColor"
                          >
                            <path d="M0 0L6 5L0 10V0Z" />
                          </svg>
                          <span className="truncate font-medium text-gray-200">
                            {dep.name}
                          </span>
                          {dep.hasPartialData && (
                            <span title="Partial data — some API calls failed" className="shrink-0 text-yellow-500">
                              &#9888;
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="flex-none w-[10%] px-4 py-3 text-left">
                        <span
                          className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${
                            dep.type === 'dependency'
                              ? 'bg-blue-500/15 text-blue-400'
                              : 'bg-gray-600/30 text-gray-400'
                          }`}
                        >
                          {dep.type === 'dependency' ? 'dep' : 'devDep'}
                        </span>
                      </span>
                      <span className="flex-none w-[10%] px-4 py-3 text-left font-mono text-xs text-gray-400">
                        {dep.version}
                      </span>
                      <span className="flex-none w-[14%] px-4 py-3 text-right text-gray-400">
                        {getLastUpdated(dep)}
                      </span>
                      <span className="flex-none w-[14%] px-4 py-3 text-right text-gray-400">
                        {formatDownloads(dep.metadata.npmData?.weeklyDownloads)}
                      </span>
                      <span className="flex-none w-[10%] px-4 py-3 text-right">
                        {vulnCount > 0 ? (
                          <span className="font-medium text-red-400">{vulnCount}</span>
                        ) : (
                          <span className="text-gray-500">0</span>
                        )}
                      </span>
                      <span className="flex-none w-[20%] px-4 py-3 text-right">
                        <RiskBadge level={dep.riskLevel} />
                        <span className="ml-2 font-mono text-xs text-gray-400">
                          {Math.round(dep.riskScore)}
                        </span>
                      </span>
                    </button>

                    {/* Expanded signal breakdown */}
                    {isExpanded && (
                      <div className="border-t border-gray-700/30 bg-gray-900/40 px-6 py-4">
                        <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                          Signal Breakdown
                        </h4>
                        <div className="space-y-1">
                          {dep.signals.map((signal) => (
                            <div key={signal.signal}>
                              <SignalBar signal={signal} />
                              {signal.detail && (
                                <p className="ml-[7.75rem] text-xs text-gray-500 -mt-0.5 mb-1">
                                  {signal.detail}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex justify-end border-t border-gray-700/30 pt-3">
                          <span className="text-xs text-gray-500">
                            Weighted Total:{' '}
                            <span className="font-mono font-medium text-gray-300">
                              {Math.round(dep.riskScore)}
                            </span>
                          </span>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
