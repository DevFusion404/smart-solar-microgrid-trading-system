import { ArrowRight, CalendarPlus, Check, Radio, UserCheck, Users, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Panel, SectionHeading } from '../common/Panel'

export function QuickActions({
  pendingProsumerCount = 0,
  pendingReservationsCount = 0,
  activeNodesCount = 0,
}) {
  const actions = [
    {
      label: 'Review prosumer requests',
      detail: `${pendingProsumerCount} pending action${pendingProsumerCount === 1 ? '' : 's'} waiting`,
      icon: UserCheck,
      to: '/backoffice/prosumers/requests',
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
    },
    {
      label: 'Approve reservations',
      detail: `${pendingReservationsCount} waiting for review`,
      icon: Check,
      to: '/backoffice/energy-slots/reservations',
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
    },
    {
      label: 'Manage energy slots',
      detail: 'Publish or adjust capacity',
      icon: CalendarPlus,
      to: '/backoffice/energy-slots/manage',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
    },
    {
      label: 'Microgrid stations',
      detail: `${activeNodesCount} active station${activeNodesCount === 1 ? '' : 's'} registered`,
      icon: Zap,
      to: '/backoffice/nodes',
      color: 'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
    },
    {
      label: 'Prosumer directory',
      detail: 'Accounts, status & history',
      icon: Users,
      to: '/backoffice/prosumers',
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    },
  ]

  return (
    <Panel className="p-5">
      <SectionHeading title="Quick actions" description="Direct operations on the network" />
      <div className="mt-5 space-y-2">
        {actions.map(({ label, detail, icon: Icon, to, color }) => (
          <Link
            key={label}
            to={to}
            className="group flex items-center gap-3 rounded-xl border border-transparent p-2 transition hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/70"
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{label}</span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{detail}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
          </Link>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-400/10">
        <Radio className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
          Network live · {activeNodesCount} online node{activeNodesCount === 1 ? '' : 's'}
        </span>
      </div>
    </Panel>
  )
}
