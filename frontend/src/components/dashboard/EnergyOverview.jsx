import { BarChart3, ChevronDown, Download } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { energyOverview } from '../../data/dashboardMockData'
import { IconButton } from '../common/IconButton'
import { Panel, SectionHeading } from '../common/Panel'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-xs font-semibold text-slate-800 dark:text-slate-100">
          <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: {entry.value.toLocaleString()} kWh
        </p>
      ))}
    </div>
  )
}

export function EnergyOverview() {
  return (
    <Panel className="p-5 md:p-6">
      <SectionHeading
        title="Energy overview"
        description="Generated and consumed energy over the past week"
        action={
          <div className="flex items-center gap-1">
            <button type="button" className="hidden items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:flex dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              This week <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <IconButton label="Download energy report">
              <Download className="h-4 w-4" />
            </IconButton>
          </div>
        }
      />
      <div className="mt-6 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />Generated</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" />Consumed</span>
        <span className="ml-auto hidden items-center gap-1 text-emerald-600 sm:flex dark:text-emerald-400"><BarChart3 className="h-3.5 w-3.5" /> 14.6% this week</span>
      </div>
      <div className="mt-3 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={energyOverview} barGap={5} margin={{ top: 12, right: 0, left: -22, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={9} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(value) => `${value / 1000}k`} />
            <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip />} />
            <Bar dataKey="generated" name="Generated" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Bar dataKey="consumed" name="Consumed" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}
