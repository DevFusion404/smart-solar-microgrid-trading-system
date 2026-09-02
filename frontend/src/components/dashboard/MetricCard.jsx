import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BatteryCharging, CalendarDays, Clock3, Cpu, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { Panel } from '../common/Panel'

const icons = { energy: BatteryCharging, users: Users, nodes: Cpu, calendar: CalendarDays, clock: Clock3, alert: AlertTriangle }
const iconStyles = {
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
}

export function MetricCard({ metric, index }) {
  const Icon = icons[metric.icon] || Activity
  const isPositive = metric.trend === 'up'

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: index * 0.07 }}>
      <Panel className="h-full p-5">
        <div className="flex items-start justify-between">
          <div className={clsx('flex h-10 w-10 items-center justify-center rounded-xl', iconStyles[metric.accent])}>
            <Icon className="h-5 w-5" />
          </div>
          <span className={clsx('inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-medium', isPositive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300')}>
            {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {metric.change}
          </span>
        </div>
        <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">{metric.label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
          {metric.value} <span className="text-sm font-medium text-slate-400">{metric.unit}</span>
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">vs. last 30 days</p>
      </Panel>
    </motion.div>
  )
}
