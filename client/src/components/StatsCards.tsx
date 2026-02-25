interface StatsCardsProps {
  analyzedCount: number
  totalDependencies: number
  wasTruncated: boolean
  riskCounts: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

interface StatCard {
  label: string
  value: string | number
  color: string
  bgColor: string
  borderColor: string
}

export function StatsCards({
  analyzedCount,
  totalDependencies,
  wasTruncated,
  riskCounts,
}: StatsCardsProps) {
  const cards: StatCard[] = [
    {
      label: 'Total Dependencies',
      value: wasTruncated ? `${analyzedCount} / ${totalDependencies}` : analyzedCount,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      label: 'Critical',
      value: riskCounts.critical,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
    },
    {
      label: 'High',
      value: riskCounts.high,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
    },
    {
      label: 'Medium',
      value: riskCounts.medium,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
    },
    {
      label: 'Low',
      value: riskCounts.low,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border ${card.borderColor} ${card.bgColor} p-4`}
        >
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            {card.label}
          </p>
          <p className={`mt-2 text-2xl font-bold ${card.color}`}>
            {card.value}
          </p>
          {card.label === 'Total Dependencies' && wasTruncated && (
            <p className="mt-1 text-xs text-gray-500">
              Showing top {analyzedCount} of {totalDependencies}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
