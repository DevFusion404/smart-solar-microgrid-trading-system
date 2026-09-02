import { AlertCircle, ArrowRight, CheckCircle2, Info, UserRound, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dashboardActivity, dashboardAlerts } from '../../data/dashboardMockData'
import { Panel, SectionHeading } from '../common/Panel'

const alertIcons = { warning: AlertCircle, info: Info }
const activityIcons = { user: UserRound, check: CheckCircle2, bolt: Zap }

export function DashboardAside() {
  return (
    <div className="space-y-6">
      <Panel className="p-5">
        <SectionHeading title="Needs attention" description="Items that may need your review" />
        <div className="mt-4 space-y-3">
          {dashboardAlerts.map((alert) => {
            const Icon = alertIcons[alert.type] || Info
            return (
              <div key={alert.title} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex gap-3"><Icon className={`mt-0.5 h-4 w-4 shrink-0 ${alert.type === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} /><div><p className="text-sm font-medium text-slate-800 dark:text-slate-100">{alert.title}</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{alert.detail}</p></div></div>
                <Link to={alert.to} className="mt-2.5 flex items-center gap-1 pl-7 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">{alert.action} <ArrowRight className="h-3 w-3" /></Link>
              </div>
            )
          })}
        </div>
      </Panel>
      <Panel className="p-5">
        <SectionHeading title="Recent activity" action={<Link to="/backoffice/users" className="text-xs font-semibold text-blue-600 dark:text-blue-400">View all</Link>} />
        <div className="mt-5 space-y-5">
          {dashboardActivity.map((activity) => {
            const Icon = activityIcons[activity.icon] || Info
            return <div key={activity.title} className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="text-sm font-medium text-slate-800 dark:text-slate-100">{activity.title}</p><p className="truncate text-xs text-slate-500 dark:text-slate-400">{activity.detail}</p><p className="mt-1 text-[11px] text-slate-400">{activity.time}</p></div></div>
          })}
        </div>
      </Panel>
    </div>
  )
}
