import { BarChart3, Download } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { reservationActivity } from '../../data/dashboardMockData'
import { IconButton } from '../common/IconButton'
import { Panel, SectionHeading } from '../common/Panel'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-xs font-semibold text-slate-800 dark:text-slate-100">
          <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

export function ReservationActivityChart() {
  return (
    <Panel className="p-5 md:p-6">
      <SectionHeading
        title="Reservation activity"
        description="Approved, pending, and cancelled requests"
        action={
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300 sm:flex">
              <BarChart3 className="h-3.5 w-3.5" /> Weekly view
            </div>
            <IconButton label="Download reservation activity report"><Download className="h-4 w-4" /></IconButton>
          </div>
        }
      />
      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Approved</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Pending</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> Cancelled</span>
      </div>
      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={reservationActivity} barGap={8} margin={{ top: 12, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip />} />
            <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Bar dataKey="pending" name="Pending" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Bar dataKey="cancelled" name="Cancelled" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}
