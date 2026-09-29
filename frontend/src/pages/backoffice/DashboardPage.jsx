import { ArrowRight, CalendarDays, RefreshCw, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MetricCard } from '../../components/dashboard/MetricCard'
import { NodeOverview } from '../../components/dashboard/NodeStatus'
import { PendingProsumerActions } from '../../components/dashboard/PendingProsumerActions'
import { QuickActions } from '../../components/dashboard/QuickActions'
import { RecentReservations } from '../../components/dashboard/RecentTransactions'
import { ReservationActivityChart } from '../../components/dashboard/ReservationActivityChart'
import { ReservationStatus } from '../../components/dashboard/ReservationStatus'
import { useAuth } from '../../context/AuthContext'
import {
  prosumerService,
  reservationService,
  stationService,
  transactionService,
} from '../../services'

// Greeting for the logged-in officer based on the local time of day
function greetingFor(name) {
  const hour = new Date().getHours()
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = (name || '').trim().split(' ')[0]
  return firstName ? `${part}, ${firstName}` : part
}

export function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [summary, setSummary] = useState(null)
  const [stations, setStations] = useState([])
  const [reservations, setReservations] = useState([])
  const [prosumerStats, setProsumerStats] = useState({ active: 0, total: 0, pending: 0 })

  const loadDashboardData = useCallback(async () => {
    try {
      const [
        summaryRes,
        stationsRes,
        reservationsRes,
        activeProsRes,
        allProsRes,
        pendingProsRes,
        deactProsRes,
      ] = await Promise.allSettled([
        transactionService.getDashboardSummary(),
        stationService.getAllStations(),
        reservationService.listBackofficeReservations(),
        prosumerService.listProsumers({ pageSize: 1, status: 'Active' }),
        prosumerService.listProsumers({ pageSize: 1 }),
        prosumerService.listPendingActivations({ pageSize: 1 }),
        prosumerService.listDeactivationRequests({ pageSize: 1 }),
      ])

      if (summaryRes.status === 'fulfilled' && summaryRes.value) {
        setSummary(summaryRes.value)
      }
      if (stationsRes.status === 'fulfilled' && Array.isArray(stationsRes.value)) {
        setStations(stationsRes.value)
      }
      if (reservationsRes.status === 'fulfilled' && Array.isArray(reservationsRes.value)) {
        setReservations(reservationsRes.value)
      }

      const activeCount =
        activeProsRes.status === 'fulfilled'
          ? activeProsRes.value?.totalCount ?? (activeProsRes.value?.items || []).length
          : 0
      const totalCount =
        allProsRes.status === 'fulfilled'
          ? allProsRes.value?.totalCount ?? (allProsRes.value?.items || []).length
          : 0
      const pendingCount =
        (pendingProsRes.status === 'fulfilled'
          ? pendingProsRes.value?.totalCount ?? (pendingProsRes.value?.items || []).length
          : 0) +
        (deactProsRes.status === 'fulfilled'
          ? deactProsRes.value?.totalCount ?? (deactProsRes.value?.items || []).length
          : 0)

      setProsumerStats({
        active: activeCount,
        total: totalCount,
        pending: pendingCount,
      })
    } catch (err) {
      console.error('Failed to load dashboard live data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleRefresh = () => {
    setRefreshing(true)
    loadDashboardData()
  }

  // Aggregate metrics computed from real live API data
  const metrics = useMemo(() => {
    const activeStations = stations.filter((s) => s.status === 'Active').length
    const totalCapacity = stations.reduce((acc, s) => acc + (s.energyCapacity || 0), 0)
    const approvedRes = reservations.filter(
      (r) => r.status === 'Approved' || r.status === 'Confirmed',
    ).length
    const pendingRes = reservations.filter((r) => r.status === 'Pending').length
    const totalPendingActions = prosumerStats.pending + pendingRes

    return [
      {
        label: 'Total energy traded',
        value: Number(summary?.totalEnergyTransferred || 0).toLocaleString(undefined, {
          maximumFractionDigits: 1,
        }),
        unit: 'kWh',
        change: `${summary?.completedTransfers || 0} completed`,
        trend: 'up',
        icon: 'energy',
        accent: 'amber',
        subtitle: 'Delivered by transfers',
      },
      {
        label: 'Active prosumers',
        value: (prosumerStats.active || 0).toLocaleString(),
        unit: '',
        change: `${prosumerStats.total || 0} registered`,
        trend: 'up',
        icon: 'users',
        accent: 'blue',
        subtitle: 'Verified prosumers',
      },
      {
        label: 'Nodes online',
        value: `${activeStations}`,
        unit: `/ ${stations.length}`,
        change: `${totalCapacity.toLocaleString()} kW cap.`,
        trend: activeStations > 0 ? 'up' : 'down',
        icon: 'nodes',
        accent: 'violet',
        subtitle: 'Active microgrid nodes',
      },
      {
        label: 'Reservations',
        value: `${reservations.length}`,
        unit: '',
        change: `${approvedRes} approved`,
        trend: 'up',
        icon: 'calendar',
        accent: 'emerald',
        subtitle: `${pendingRes} awaiting review`,
      },
      {
        label: "Today's transfers",
        value: `${summary?.todayTransfers ?? 0}`,
        unit: '',
        change: `${summary?.pendingTransfers ?? 0} pending`,
        trend: (summary?.todayTransfers || 0) > 0 ? 'up' : 'down',
        icon: 'clock',
        accent: 'rose',
        subtitle: 'Current day transfers',
      },
      {
        label: 'Pending actions',
        value: `${totalPendingActions}`,
        unit: '',
        change: `${prosumerStats.pending} pros. · ${pendingRes} res.`,
        trend: totalPendingActions > 0 ? 'down' : 'up',
        icon: 'alert',
        accent: 'slate',
        subtitle: 'Officer action required',
      },
    ]
  }, [summary, stations, reservations, prosumerStats])

  const pendingReservationsCount = useMemo(
    () => reservations.filter((r) => r.status === 'Pending').length,
    [reservations],
  )
  const activeStationsCount = useMemo(
    () => stations.filter((s) => s.status === 'Active').length,
    [stations],
  )

  const currentDateDisplay = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date())
  }, [])

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
      >
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Sparkles className="h-3.5 w-3.5" /> {greetingFor(user?.fullName || user?.username)}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl dark:text-white">
            Here&apos;s your network overview.
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Real-time telemetry, energy trading flow, and active prosumer reservations across the grid.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh dashboard metrics"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
            <span>{currentDateDisplay}</span>
          </button>
          <Link
            to="/backoffice/energy-slots/manage"
            className="hidden items-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:inline-flex dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
          >
            Create slot <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.label} metric={metric} index={index} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_370px]">
        <div className="space-y-6">
          <PendingProsumerActions />
          <ReservationActivityChart reservations={reservations} loading={loading} />
          <RecentReservations reservations={reservations} loading={loading} />
        </div>
        <div className="space-y-6">
          <ReservationStatus reservations={reservations} loading={loading} />
          <NodeOverview stations={stations} loading={loading} />
          <QuickActions
            pendingProsumerCount={prosumerStats.pending}
            pendingReservationsCount={pendingReservationsCount}
            activeNodesCount={activeStationsCount}
          />
        </div>
      </div>
    </div>
  )
}
