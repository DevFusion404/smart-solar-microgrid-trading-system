import { ArrowRight, CalendarPlus, Check, Download, Plus, Radio, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { quickActions } from '../../data/dashboardMockData'
import { Panel, SectionHeading } from '../common/Panel'

const iconMap = {
  user: UserPlus,
  plus: Plus,
  calendar: CalendarPlus,
  check: Check,
  download: Download,
}

export function QuickActions() {
  return (
    <Panel className="p-5">
      <SectionHeading title="Quick actions" description="Common tasks for your workspace" />
      <div className="mt-5 space-y-2">
        {quickActions.map(({ label, detail, icon, to, color }) => {
          const Icon = iconMap[icon] || Plus

          return (
            <Link key={label} to={to} className="group flex items-center gap-3 rounded-xl border border-transparent p-2 transition hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/70">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}><Icon className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{label}</span><span className="block truncate text-xs text-slate-500 dark:text-slate-400">{detail}</span></span>
              <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
            </Link>
          )
        })}
      </div>
      <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-400/10">
        <Radio className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Network operating normally</span>
      </div>
    </Panel>
  )
}
