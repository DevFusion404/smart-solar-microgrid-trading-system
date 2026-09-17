/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Grid Operator Microgrid Node Overview
File          : OperatorNodesPage.jsx
Description   : Lists microgrid nodes assigned specifically to the logged-in Grid Operator
=====================================================
*/

import {
  AlertCircle,
  BatteryCharging,
  Calendar,
  Clock,
  Cpu,
  ExternalLink,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Panel } from '../../components/common/Panel'
import { StatusBadge } from '../../components/common/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { nodeAssignmentService } from '../../services'

export function OperatorNodesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [nodes, setNodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const loadAssignedNodes = async () => {
    try {
      setLoading(true)
      setError(null)
      const operatorIdentifier = user?.id || user?.username
      if (!operatorIdentifier) {
        setNodes([])
        return
      }
      const data = await nodeAssignmentService.getNodesByOperator(operatorIdentifier)
      setNodes(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load assigned microgrid nodes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssignedNodes()
  }, [user?.id, user?.username])

  // KPI Calculations
  const stats = useMemo(() => {
    const total = nodes.length
    const active = nodes.filter((n) => n.status === 'Active').length
    const totalGeneration = nodes.reduce((acc, n) => acc + (n.energyCapacity || 0), 0)
    const totalStorage = nodes.reduce((acc, n) => acc + (n.batteryStorageCapacity || 0), 0)
    return { total, active, totalGeneration, totalStorage }
  }, [nodes])

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes
    const q = searchQuery.trim().toLowerCase()
    return nodes.filter(
      (n) =>
        n.stationName?.toLowerCase().includes(q) ||
        n.stationId?.toLowerCase().includes(q) ||
        n.address?.toLowerCase().includes(q)
    )
  }, [nodes, searchQuery])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Cpu className="h-3.5 w-3.5" /> Operations Portal
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl dark:text-white">
            Assigned Microgrid Nodes
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Microgrid stations assigned to your Grid Operator account ({user?.fullName || user?.username}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAssignedNodes}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Assigned Nodes</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{stats.total}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {stats.active} operational / active
          </p>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Generation Capacity</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.totalGeneration.toLocaleString()}{' '}
            <span className="text-sm font-normal text-slate-400">kWh</span>
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Total rated solar generation</p>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Storage Capacity</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <BatteryCharging className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalStorage.toLocaleString()}{' '}
            <span className="text-sm font-normal text-slate-400">kWh</span>
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Combined battery reserves</p>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Operator Status</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-xl font-bold text-slate-950 dark:text-white">Active Grid Op</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Full slot management access
          </p>
        </Panel>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-400/10 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <Panel className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search assigned nodes by ID, name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </Panel>

      {/* Nodes List */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-amber-500" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading your assigned nodes...</p>
        </div>
      ) : filteredNodes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNodes.map((node) => (
            <Panel key={node.id || node.stationId} className="flex flex-col justify-between overflow-hidden p-6 transition hover:shadow-lg">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {node.stationId}
                    </span>
                    <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                      {node.stationName}
                    </h3>
                  </div>
                  <StatusBadge status={node.status || 'Active'} />
                </div>

                <div className="mt-4 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>{node.address}</span>
                </div>

                <div className="mt-2 text-xs text-slate-400 pl-6">
                  {node.latitude?.toFixed(4)}°, {node.longitude?.toFixed(4)}°
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50/80 p-3 text-xs dark:bg-slate-900/60">
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-slate-400">Generation</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800 dark:text-slate-200">
                      {node.energyCapacity} kWh
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-slate-400">Battery Reserve</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800 dark:text-slate-200">
                      {node.batteryStorageCapacity} kWh
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{node.operationalSchedule || 'Standard operating hours'}</span>
                </div>

                {node.assignedDate && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>Assigned: {new Date(node.assignedDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => navigate(`/operator/energy-slots?stationId=${node.stationId}`)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-amber-400"
                >
                  <BatteryCharging className="h-4 w-4" />
                  Manage Energy Slots
                </button>

                <a
                  href={`https://www.google.com/maps?q=${node.latitude},${node.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  title="View on Google Maps"
                  className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <Panel className="p-12 text-center">
          <Cpu className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-base font-bold text-slate-800 dark:text-slate-200">
            {searchQuery ? 'No matching nodes found' : 'No Microgrid Nodes Assigned'}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs text-slate-500 dark:text-slate-400">
            {searchQuery
              ? 'Try changing your search query or clearing the filter.'
              : 'You do not have any solar microgrid stations assigned to your Grid Operator account yet. A Backoffice officer must assign you to a station before you can publish energy slots.'}
          </p>
        </Panel>
      )}
    </div>
  )
}

export default OperatorNodesPage
