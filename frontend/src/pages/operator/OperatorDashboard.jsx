import {
  Activity,
  BatteryCharging,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Cpu,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../../context/AuthContext'
import { nodeAssignmentService, slotService, transactionService } from '../../services'

function Status({ children, tone = 'green' }) {
  return (
    <span
      className={
        tone === 'amber'
          ? 'rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-400/10 dark:text-amber-300'
          : 'rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
      }
    >
      {children}
    </span>
  )
}

function computeHourlyActivity(transfers) {
  const buckets = [
    { time: '08:00', bookings: 0 },
    { time: '10:00', bookings: 0 },
    { time: '12:00', bookings: 0 },
    { time: '14:00', bookings: 0 },
    { time: '16:00', bookings: 0 },
    { time: '18:00', bookings: 0 },
    { time: '20:00', bookings: 0 },
  ]

  ;(transfers || []).forEach((t) => {
    let hour = 12
    if (t.slotTime && t.slotTime.includes(':')) {
      const parsedHour = parseInt(t.slotTime.split(':')[0], 10)
      if (!isNaN(parsedHour)) hour = parsedHour
    } else if (t.transactionDate) {
      hour = new Date(t.transactionDate).getHours()
    }

    if (hour < 9) buckets[0].bookings += 1
    else if (hour < 11) buckets[1].bookings += 1
    else if (hour < 13) buckets[2].bookings += 1
    else if (hour < 15) buckets[3].bookings += 1
    else if (hour < 17) buckets[4].bookings += 1
    else if (hour < 19) buckets[5].bookings += 1
    else buckets[6].bookings += 1
  })

  return buckets
}

export function OperatorDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [assignedNodes, setAssignedNodes] = useState([])
  const [dashboardData, setDashboardData] = useState(null)
  const [slotStats, setSlotStats] = useState({ available: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const opId = user?.id || user?.username
      if (!opId) {
        setAssignedNodes([])
        setDashboardData(null)
        setSlotStats({ available: 0, total: 0 })
        return
      }

      // 1. Fetch stations strictly assigned to this Grid Operator
      const nodes = await nodeAssignmentService.getNodesByOperator(opId)
      const safeNodes = Array.isArray(nodes) ? nodes : []
      setAssignedNodes(safeNodes)

      if (safeNodes.length === 0) {
        setDashboardData(null)
        setSlotStats({ available: 0, total: 0 })
        return
      }

      const assignedNodeIds = new Set(safeNodes.map((n) => n.stationId).filter(Boolean))

      // 2. Fetch operator transfers and slots for assigned stations in parallel
      const [opDashboardRes, ...slotsResults] = await Promise.allSettled([
        transactionService.getOperatorDashboard(),
        ...safeNodes.map((node) => slotService.getSlotsByStation(node.stationId).catch(() => [])),
      ])

      if (opDashboardRes.status === 'fulfilled' && opDashboardRes.value) {
        setDashboardData(opDashboardRes.value)
      } else {
        setDashboardData(null)
      }

      let totalSlots = 0
      let availableSlots = 0
      slotsResults.forEach((res) => {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          totalSlots += res.value.length
          availableSlots += res.value.filter((s) => s.status === 'Available').length
        }
      })
      setSlotStats({ available: availableSlots, total: totalSlots })
    } catch (err) {
      console.error('Failed to load Grid Operator dashboard:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id, user?.username])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  // Filter transfers to only those that match the operator's assigned stations
  const assignedStationIds = useMemo(
    () => new Set(assignedNodes.map((n) => n.stationId).filter(Boolean)),
    [assignedNodes],
  )

  const todayTransfers = useMemo(() => {
    if (!dashboardData?.todayTransfers) return []
    return dashboardData.todayTransfers.filter(
      (t) => !t.stationId || assignedStationIds.has(t.stationId),
    )
  }, [dashboardData, assignedStationIds])

  const pendingTransfers = useMemo(() => {
    if (!dashboardData?.pendingTransfers) return []
    return dashboardData.pendingTransfers.filter(
      (t) => !t.stationId || assignedStationIds.has(t.stationId),
    )
  }, [dashboardData, assignedStationIds])

  const totalCap = useMemo(
    () => assignedNodes.reduce((acc, n) => acc + (n.energyCapacity || 0), 0),
    [assignedNodes],
  )
  const totalBattery = useMemo(
    () => assignedNodes.reduce((acc, n) => acc + (n.batteryStorageCapacity || 0), 0),
    [assignedNodes],
  )
  const activeCount = useMemo(
    () => assignedNodes.filter((n) => n.status === 'Active').length,
    [assignedNodes],
  )

  const activityData = useMemo(() => computeHourlyActivity(todayTransfers), [todayTransfers])

  const stats = [
    [
      "Today's transfers",
      `${todayTransfers.length}`,
      CalendarClock,
      `${pendingTransfers.length} pending verification`,
      'amber',
      '/operator/transfers',
    ],
    [
      'Available energy slots',
      `${slotStats.available}`,
      BatteryCharging,
      `${slotStats.total} total slots across your nodes`,
      'blue',
      '/operator/energy-slots',
    ],
    [
      'Assigned microgrid nodes',
      `${assignedNodes.length}`,
      Cpu,
      `${activeCount} online now`,
      'violet',
      '/operator/nodes',
    ],
    [
      'Total assigned capacity',
      `${totalCap.toLocaleString()} kW`,
      Zap,
      `${totalBattery.toLocaleString()} kWh battery storage`,
      'emerald',
      '/operator/nodes',
    ],
  ]

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Operator'

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Welcome back, {firstName}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Operator Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor your assigned microgrid network, manage energy slots, and verify transfers.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          title="Refresh dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, Icon, detail, color, to], index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            whileHover={{ y: -3 }}
            onClick={() => to && navigate(to)}
            className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-400/50 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">
                  {loading ? '…' : value}
                </p>
              </div>
              <span
                className={`rounded-xl p-2.5 ${
                  color === 'amber'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400'
                    : color === 'blue'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400'
                    : color === 'violet'
                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-400'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Booking Activity */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">Booking Activity</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Transfers scheduled today across your assigned nodes
              </p>
            </div>
            <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="operatorFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="bookings" stroke="#f59e0b" fill="url(#operatorFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Assigned Nodes */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">Assigned Nodes</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your assigned microgrid stations</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/operator/nodes')}
              className="text-xs font-semibold text-amber-600 hover:underline dark:text-amber-400"
            >
              View all
            </button>
          </div>

          <div className="space-y-4">
            {assignedNodes.length > 0 ? (
              assignedNodes.slice(0, 4).map((node) => (
                <div
                  key={node.id || node.stationId}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800 cursor-pointer hover:opacity-80"
                  onClick={() => navigate(`/operator/energy-slots?stationId=${node.stationId}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {node.stationName || node.stationId}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {node.energyCapacity || 0} kW • {node.stationId}
                    </p>
                  </div>
                  <Status tone={node.status === 'Active' ? 'green' : 'amber'}>
                    {node.status || 'Active'}
                  </Status>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                <Cpu className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No microgrid nodes assigned to your account yet.</p>
                <p className="mt-1 text-[11px] text-slate-500">Contact Backoffice to assign nodes.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Upcoming Bookings / Transfers */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-950 dark:text-white">Upcoming Bookings & Transfers</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Energy transfers awaiting verification at your assigned stations
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/operator/transfers')}
            className="text-sm font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400"
          >
            View all
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
              <tr>
                <th className="px-3 py-3">Transfer / Reservation</th>
                <th className="px-3 py-3">Prosumer</th>
                <th className="px-3 py-3">Node</th>
                <th className="px-3 py-3">Slot Time & Energy</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingTransfers.length > 0 || todayTransfers.length > 0 ? (
                [...pendingTransfers, ...todayTransfers]
                  .slice(0, 5)
                  .map((t) => (
                    <tr
                      key={t.transactionId || t.reservationId}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      onClick={() => navigate(`/operator/transfers`)}
                    >
                      <td className="px-3 py-4 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {t.transactionId || t.reservationId}
                      </td>
                      <td className="px-3 py-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {t.prosumerName || t.prosumerNIC || 'Prosumer'}
                        </p>
                        {t.prosumerNIC && (
                          <p className="font-mono text-[11px] text-slate-400">{t.prosumerNIC}</p>
                        )}
                      </td>
                      <td className="px-3 py-4 text-slate-600 dark:text-slate-400">
                        <p className="font-medium">{t.stationName || t.stationId}</p>
                        <p className="font-mono text-[11px] text-slate-400">{t.stationId}</p>
                      </td>
                      <td className="px-3 py-4 text-slate-600 dark:text-slate-400">
                        <p className="text-xs">{t.slotTime || 'Scheduled'}</p>
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                          {t.reservedEnergy || 0} kWh
                        </p>
                      </td>
                      <td className="px-3 py-4">
                        <Status tone={t.status === 'Pending' ? 'amber' : 'green'}>
                          {t.status || 'Pending'}
                        </Status>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                    {assignedNodes.length === 0
                      ? 'No microgrid stations assigned to your account. Contact Backoffice to assign stations.'
                      : 'No upcoming transfers scheduled for your assigned nodes today.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        {assignedNodes.length > 0 ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Microgrid services operating normally</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{assignedNodes.length} node(s) under your active monitoring</span>
          </>
        ) : (
          <>
            <CircleAlert className="h-4 w-4 text-amber-500" />
            <span>No nodes currently assigned. Contact Backoffice to assign stations to your account.</span>
          </>
        )}
      </div>
    </div>
  )
}
