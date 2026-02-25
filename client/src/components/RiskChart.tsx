import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface RiskChartProps {
  riskCounts: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

const RISK_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
}

interface ChartEntry {
  name: string
  value: number
}

export function RiskChart({ riskCounts }: RiskChartProps) {
  const data: ChartEntry[] = [
    { name: 'Critical', value: riskCounts.critical },
    { name: 'High', value: riskCounts.high },
    { name: 'Medium', value: riskCounts.medium },
    { name: 'Low', value: riskCounts.low },
  ].filter((entry) => entry.value > 0)

  const total = riskCounts.critical + riskCounts.high + riskCounts.medium + riskCounts.low

  if (total === 0) {
    return (
      <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-6">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-gray-400">
          Risk Distribution
        </h3>
        <p className="text-center text-gray-500 py-8">No dependencies to chart</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-6">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-gray-400">
        Risk Distribution
      </h3>
      <div className="relative h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={RISK_COLORS[entry.name]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                color: '#d1d5db',
                fontSize: '0.875rem',
              }}
              formatter={(value: number, name: string) => [
                `${value} (${Math.round((value / total) * 100)}%)`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-200">{total}</span>
          <span className="text-xs text-gray-500">total</span>
        </div>
      </div>
      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: RISK_COLORS[entry.name] }}
            />
            <span className="text-xs text-gray-400">
              {entry.name} ({entry.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
