/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : EnergySlotDashboard.jsx
Description   : Dashboard overview for energy slot operations and station capacity
Author        : Sithmaka
=====================================================
*/

import {
  ArrowRight,
  BatteryCharging,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Cpu,
  MapPin,
  Plus,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Panel, SectionHeading } from '../../components/common/Panel'
import { StatusBadge } from '../../components/common/StatusBadge'
import { slotService, stationService } from '../../services'

export function EnergySlotDashboard() {
  const [stations, setStations] = useState([])
  const [recentSlots, setRecentSlots] = useState([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const stationData = await stationService.getAllStations()
      const stns = stationData || []
      setStations(stns)

      // Fetch sample slots from active stations
      const activeStns = stns.filter((s) => s.status === 'Active')
      const slotsAccumulator = []

      for (const stn of activeStns.slice(0, 4)) {
        try {
          const stnSlots = await slotService.getSlotsByStation(stn.stationId)
          if (stnSlots && stnSlots.length > 0) {
            slotsAccumulator.push(
              ...stnSlots.map((slot) => ({
                ...slot,
                stationName: stn.stationName,
              }))
            )
          }
        } catch {
          // Continue if single station fails
        }
      }

      setRecentSlots(slotsAccumulator)
    } catch (err) {
      console.error('Error loading dashboard data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // KPI calculations
  const totalStations = stations.length
  const activeStations = stations.filter((s) => s.status === 'Active').length
  const totalSlotsCount = recentSlots.length
  const availableSlotsCount = recentSlots.filter((s) => s.status === 'Available').length
  const totalCapacityKwh = recentSlots.reduce((acc, s) => acc + (s.totalCapacity || 0), 0)
  const availableCapacityKwh = recentSlots.reduce((acc, s) => acc + (s.availableCapacity || 0), 0)
  const totalBatteryKwh = stations.reduce((acc, s) => acc + (s.batteryStorageCapacity || 0), 0)

  const summaryCards = [
    {
      label: 'Active Microgrid Nodes',
      value: `${activeStations}`,
      note: `${totalStations} total nodes registered`,
      icon: Cpu,
      accent: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
    },
    {
      label: 'Published Energy Slots',
      value: `${totalSlotsCount}`,
      note: `${availableSlotsCount} slots currently bookable`,
      icon: BatteryCharging,
      accent: 'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
    },
    {
      label: 'Available Energy Capacity',
      value: `${availableCapacityKwh.toLocaleString()} kWh`,
      note: `Out of ${totalCapacityKwh.toLocaleString()} kWh published`,
      icon: Zap,
      accent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
    },
    {
      label: 'Battery Buffer Storage',
      value: `${totalBatteryKwh.toLocaleString()} kWh`,
      note: 'Grid-wide reserve capacity',
      icon: CalendarCheck2,
      accent: 'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
    },
  ]

  const todayStr = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Zap className="h-3.5 w-3.5" /> Component 2: Microgrid Node & Energy Slot Management
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl dark:text-white">
            Energy Slot Operations Dashboard
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Keep microgrid availability visible, publish booking windows, and coordinate real-time node generation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <CalendarDays className="h-4 w-4 text-slate-400" /> {todayStr}
          </span>
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Panel key={card.label} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Live API</span>
              </div>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{card.value}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{card.note}</p>
            </Panel>
          )
        })}
      </div>

      {/* Recent Published Slots Table */}
      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 md:px-6 dark:border-slate-800">
          <SectionHeading
            title="Recent Microgrid Energy Slots"
            description="Active booking slots available across solar nodes."
          />
          <Link
            to="/backoffice/energy-slots/manage"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Manage All Slots <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5 md:px-6">Slot ID</th>
                <th className="px-3 py-3.5">Microgrid Node</th>
                <th className="px-3 py-3.5">Scheduled Date</th>
                <th className="px-3 py-3.5">Time Window</th>
                <th className="px-3 py-3.5">Total Cap</th>
                <th className="px-3 py-3.5">Available Cap</th>
                <th className="px-3 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentSlots.length > 0 ? (
                recentSlots.slice(0, 6).map((slot) => (
                  <tr key={slot.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-4 font-mono font-semibold text-amber-600 md:px-6 dark:text-amber-400">
                      {slot.slotId}
                    </td>
                    <td className="px-3 py-4 font-medium text-slate-800 dark:text-slate-200">
                      {slot.stationName || slot.stationId}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                      {slot.date ? new Date(slot.date).toLocaleDateString('en-GB') : 'N/A'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap font-mono text-xs text-slate-500 dark:text-slate-400">
                      {slot.startTime} - {slot.endTime}
                    </td>
                    <td className="px-3 py-4 text-slate-800 dark:text-slate-200">
                      {slot.totalCapacity} kWh
                    </td>
                    <td className="px-3 py-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      {slot.availableCapacity} kWh
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge status={slot.status || 'Available'} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-14 text-center">
                    <Zap className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {loading ? 'Fetching slots...' : 'No energy slots published yet.'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Navigate to Manage Energy Slots to publish slots for your stations.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Bottom Grid: Registered Nodes Summary & Quick Actions */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
        <Panel className="p-5 md:p-6">
          <SectionHeading
            title="Active Microgrid Stations"
            description="Operational nodes supplying green energy to the peer trading grid."
            action={
              <Link
                to="/backoffice/nodes"
                className="text-xs font-semibold text-amber-600 hover:underline dark:text-amber-400"
              >
                View all nodes
              </Link>
            }
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {stations.slice(0, 4).map((station) => (
              <div
                key={station.id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5 dark:border-slate-800"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-500">
                  <Cpu className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {station.stationName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {station.address}
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {station.energyCapacity} kWh
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-5 md:p-6">
          <SectionHeading title="Quick Actions" description="Fast-track your microgrid workflows." />
          <div className="mt-4 space-y-3">
            <Link
              to="/backoffice/nodes/new"
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50/70 dark:border-slate-800 dark:text-slate-200 dark:hover:border-amber-400/40 dark:hover:bg-amber-400/5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                <Plus className="h-4 w-4" />
              </span>
              <span className="flex-1">Add New Microgrid Node</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>

            <Link
              to="/backoffice/nodes/schedules"
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50/70 dark:border-slate-800 dark:text-slate-200 dark:hover:border-amber-400/40 dark:hover:bg-amber-400/5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                <Clock3 className="h-4 w-4" />
              </span>
              <span className="flex-1">Update Node Schedules</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>

            <Link
              to="/backoffice/energy-slots/manage"
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50/70 dark:border-slate-800 dark:text-slate-200 dark:hover:border-amber-400/40 dark:hover:bg-amber-400/5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                <BatteryCharging className="h-4 w-4" />
              </span>
              <span className="flex-1">Manage & Publish Slots</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  )
}

export default EnergySlotDashboard
