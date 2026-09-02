import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { reservationStatus } from '../../data/dashboardMockData'
import { Panel, SectionHeading } from '../common/Panel'

export function ReservationStatus() {
  const total = reservationStatus.reduce((sum, item) => sum + item.value, 0)

  return (
    <Panel className="p-5 md:p-6">
      <SectionHeading title="Reservation status" description="Current approval pipeline" />
      <div className="mt-5 grid gap-4 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
        <div className="mx-auto h-40 w-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={reservationStatus} dataKey="value" innerRadius={52} outerRadius={72} paddingAngle={3} startAngle={90} endAngle={-270} stroke="transparent">
                {reservationStatus.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          {reservationStatus.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{entry.value}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-center dark:bg-slate-800/70">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">Overall fit</p>
        <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{Math.round((reservationStatus[0].value / total) * 100)}%</p>
      </div>
    </Panel>
  )
}
