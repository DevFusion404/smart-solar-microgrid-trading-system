import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Panel, SectionHeading } from '../common/Panel'
import { RefreshCw } from 'lucide-react'

export function ReservationStatus({ reservations = [], loading = false }) {
  const approvedCount = reservations.filter(
    (r) => r.status === 'Approved' || r.status === 'Confirmed',
  ).length
  const pendingCount = reservations.filter((r) => r.status === 'Pending').length
  const cancelledCount = reservations.filter((r) => r.status === 'Cancelled').length
  const total = reservations.length

  const chartData =
    total > 0
      ? [
          { name: 'Approved', value: approvedCount, color: '#10b981' },
          { name: 'Pending', value: pendingCount, color: '#3b82f6' },
          { name: 'Cancelled', value: cancelledCount, color: '#f87171' },
        ].filter((item) => item.value > 0)
      : [{ name: 'No data', value: 1, color: '#e2e8f0' }]

  const fitPercent = total > 0 ? Math.round((approvedCount / total) * 100) : 0

  return (
    <Panel className="p-5 md:p-6">
      <SectionHeading
        title="Reservation status"
        description="Current reservation approval pipeline"
      />
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">
          <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin opacity-50" />
          Loading pipeline status…
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
            <div className="mx-auto h-40 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={total > 0 ? 3 : 0}
                    startAngle={90}
                    endAngle={-270}
                    stroke="transparent"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Approved / Confirmed
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {approvedCount} <span className="text-xs text-slate-400">({total > 0 ? Math.round((approvedCount / total) * 100) : 0}%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  Pending
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {pendingCount} <span className="text-xs text-slate-400">({total > 0 ? Math.round((pendingCount / total) * 100) : 0}%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  Cancelled
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {cancelledCount} <span className="text-xs text-slate-400">({total > 0 ? Math.round((cancelledCount / total) * 100) : 0}%)</span>
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-center dark:bg-slate-800/70">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Approval Rate</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{fitPercent}%</p>
          </div>
        </>
      )}
    </Panel>
  )
}
