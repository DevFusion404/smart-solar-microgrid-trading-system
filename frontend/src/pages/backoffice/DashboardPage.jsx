import { ArrowRight, CalendarDays, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { dashboardMetrics } from '../../data/dashboardMockData'
import { MetricCard } from '../../components/dashboard/MetricCard'
import { NodeOverview } from '../../components/dashboard/NodeStatus'
import { PendingProsumerActions } from '../../components/dashboard/PendingProsumerActions'
import { QuickActions } from '../../components/dashboard/QuickActions'
import { RecentReservations } from '../../components/dashboard/RecentTransactions'
import { ReservationActivityChart } from '../../components/dashboard/ReservationActivityChart'
import { ReservationStatus } from '../../components/dashboard/ReservationStatus'

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400"><Sparkles className="h-3.5 w-3.5" /> Good morning, Jordan</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl dark:text-white">Here&apos;s your network overview.</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Monitor energy flow, prosumer activity, and reservation health at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"><CalendarDays className="h-4 w-4 text-slate-400" /> Jun 10 – Jun 16, 2024</button>
          <Link to="/backoffice/energy-slots" className="hidden items-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:inline-flex dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300">Create slot <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {dashboardMetrics.map((metric, index) => <MetricCard key={metric.label} metric={metric} index={index} />)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_370px]">
        <div className="space-y-6">
          <PendingProsumerActions />
          <ReservationActivityChart />
          <RecentReservations />
        </div>
        <div className="space-y-6">
          <ReservationStatus />
          <NodeOverview />
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
