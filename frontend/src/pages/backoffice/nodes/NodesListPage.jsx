/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : NodesListPage.jsx
Description   : Full management view for solar microgrid nodes / stations
Author        : Sithmaka
=====================================================
*/

import {
  AlertCircle,
  BatteryCharging,
  CalendarDays,
  CheckCircle2,
  Clock,
  Cpu,
  Edit3,
  ExternalLink,
  MapPin,
  Plus,
  PowerOff,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Panel, SectionHeading } from '../../../components/common/Panel'
import { StatusBadge } from '../../../components/common/StatusBadge'
import { stationService } from '../../../services'

// Edit Station Modal Component
function EditStationModal({ station, onClose, onUpdated }) {
  const [formData, setFormData] = useState({
    stationName: station.stationName || '',
    address: station.address || '',
    latitude: station.latitude ?? '',
    longitude: station.longitude ?? '',
    energyCapacity: station.energyCapacity ?? '',
    batteryStorageCapacity: station.batteryStorageCapacity ?? '',
    operationalSchedule: station.operationalSchedule || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const lat = parseFloat(formData.latitude)
    const lng = parseFloat(formData.longitude)
    const energy = parseFloat(formData.energyCapacity)
    const battery = parseFloat(formData.batteryStorageCapacity)

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be a valid number between -90 and 90')
      return
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError('Longitude must be a valid number between -180 and 180')
      return
    }
    if (isNaN(energy) || energy <= 0) {
      setError('Energy capacity must be greater than zero')
      return
    }
    if (isNaN(battery) || battery < 0) {
      setError('Battery storage capacity cannot be negative')
      return
    }

    try {
      setSaving(true)
      await stationService.updateStation(station.id, {
        stationName: formData.stationName.trim(),
        address: formData.address.trim(),
        latitude: lat,
        longitude: lng,
        energyCapacity: energy,
        batteryStorageCapacity: battery,
        operationalSchedule: formData.operationalSchedule.trim(),
      })
      onUpdated()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update station')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <Panel className="w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white">Edit Microgrid Node</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Node ID: {station.stationId}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Node Name</label>
            <input
              type="text"
              required
              value={formData.stationName}
              onChange={(e) => setFormData({ ...formData, stationName: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Address / Location</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Generation Cap (kWh)</label>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                value={formData.energyCapacity}
                onChange={(e) => setFormData({ ...formData, energyCapacity: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Battery Storage (kWh)</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={formData.batteryStorageCapacity}
                onChange={(e) => setFormData({ ...formData, batteryStorageCapacity: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Operational Schedule</label>
            <input
              type="text"
              required
              value={formData.operationalSchedule}
              onChange={(e) => setFormData({ ...formData, operationalSchedule: e.target.value })}
              placeholder="e.g. 06:00 AM - 06:00 PM (Daily)"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  )
}

// Quick Schedule Modal Component
function QuickScheduleModal({ station, onClose, onUpdated }) {
  const [schedule, setSchedule] = useState(station.operationalSchedule || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!schedule.trim()) {
      setError('Schedule text cannot be empty')
      return
    }

    try {
      setSaving(true)
      await stationService.updateStationSchedule(station.id, schedule.trim())
      onUpdated()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update schedule')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <Panel className="w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white">Update Node Schedule</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{station.stationName} ({station.stationId})</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Operating Hours / Schedule</label>
            <input
              type="text"
              required
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="e.g. 06:00 AM - 08:00 PM (Daily)"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update Schedule'}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  )
}

// Deactivate Confirmation Modal
function DeactivateModal({ station, onClose, onDeactivated }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleDeactivate = async () => {
    try {
      setLoading(true)
      setError(null)
      await stationService.deactivateStation(station.id)
      onDeactivated()
      onClose()
    } catch (err) {
      setError(err.message || 'Deactivation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <Panel className="w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-400/10">
            <PowerOff className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-4 text-center">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">Deactivate Station Node</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to deactivate <span className="font-semibold text-slate-900 dark:text-white">{station.stationName}</span>?
            </p>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Station cannot be deactivated if it contains active booking slots or reservations.
            </p>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-400/10 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={loading}
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:opacity-50"
            >
              {loading ? 'Deactivating...' : 'Confirm Deactivate'}
            </button>
          </div>
        </div>
      </Panel>
    </div>
  )
}

export function NodesListPage() {
  const navigate = useNavigate()
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All') // 'All' | 'Active' | 'Deactivated'
  const [activeTab, setActiveTab] = useState('table') // 'table' | 'map'
  const [mapPins, setMapPins] = useState([])

  // Modal states
  const [editingStation, setEditingStation] = useState(null)
  const [schedulingStation, setSchedulingStation] = useState(null)
  const [deactivatingStation, setDeactivatingStation] = useState(null)

  const loadStations = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await stationService.getAllStations()
      setStations(data || [])

      // Also fetch map pins for the map view
      try {
        const pins = await stationService.getStationMapPins()
        setMapPins(pins || [])
      } catch {
        // Map pins fallback
      }
    } catch (err) {
      setError(err.message || 'Failed to load microgrid stations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStations()
  }, [])

  // KPI Calculations
  const stats = useMemo(() => {
    const total = stations.length
    const active = stations.filter((s) => s.status === 'Active').length
    const deactivated = total - active
    const totalCap = stations.reduce((acc, s) => acc + (s.energyCapacity || 0), 0)
    const totalBattery = stations.reduce((acc, s) => acc + (s.batteryStorageCapacity || 0), 0)

    return { total, active, deactivated, totalCap, totalBattery }
  }, [stations])

  // Filtered station list
  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      const matchesSearch =
        !searchQuery.trim() ||
        [s.stationId, s.stationName, s.address].some((val) =>
          val?.toLowerCase().includes(searchQuery.trim().toLowerCase())
        )

      const matchesStatus =
        statusFilter === 'All' || s.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [stations, searchQuery, statusFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Cpu className="h-3.5 w-3.5" /> Component 2: Microgrid Node Management
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl dark:text-white">
            Solar Microgrid Nodes
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Monitor, coordinate, and control distributed microgrid station generation nodes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadStations}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/backoffice/nodes/schedules"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Clock className="h-4 w-4 text-amber-500" />
            Schedules
          </Link>
          <Link
            to="/backoffice/nodes/new"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            Add New Node
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Stations</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{stats.total}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Across Sri Lanka microgrid</p>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Stations</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {stats.deactivated > 0 ? `${stats.deactivated} deactivated` : '100% operational'}
          </p>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Generation Cap</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{stats.totalCap.toLocaleString()} <span className="text-base font-normal text-slate-400">kWh</span></p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Peak combined output</p>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Battery Storage Cap</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
              <BatteryCharging className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{stats.totalBattery.toLocaleString()} <span className="text-base font-normal text-slate-400">kWh</span></p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Installed buffer storage</p>
        </Panel>
      </div>

      {/* Main Content Area */}
      <Panel className="overflow-hidden">
        {/* Controls Bar */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between md:px-6 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search node, location..."
                className="w-48 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-white"
              />
            </label>

            {/* Status Filter Tabs */}
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950/40">
              {['All', 'Active', 'Deactivated'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    statusFilter === status
                      ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* View Tab Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950/40">
              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeTab === 'table'
                    ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Table View
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeTab === 'map'
                    ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Map Pins View ({mapPins.length})
              </button>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="m-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-400/10 dark:text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-amber-500" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading microgrid stations...</p>
          </div>
        ) : activeTab === 'table' ? (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 md:px-6">Node ID & Name</th>
                  <th className="px-3 py-3.5">Address & Coordinates</th>
                  <th className="px-3 py-3.5">Generation Cap</th>
                  <th className="px-3 py-3.5">Battery Storage</th>
                  <th className="px-3 py-3.5">Operating Schedule</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right md:px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStations.length > 0 ? (
                  filteredStations.map((station) => (
                    <tr
                      key={station.id}
                      className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-4 md:px-6">
                        <div className="font-semibold text-slate-900 dark:text-white">{station.stationName}</div>
                        <div className="mt-0.5 font-mono text-xs text-amber-600 dark:text-amber-400">{station.stationId}</div>
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span>{station.address}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {station.latitude?.toFixed(4)}°, {station.longitude?.toFixed(4)}°
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{station.energyCapacity}</span>
                        <span className="ml-1 text-xs text-slate-400">kWh</span>
                      </td>

                      <td className="px-3 py-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{station.batteryStorageCapacity}</span>
                        <span className="ml-1 text-xs text-slate-400">kWh</span>
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{station.operationalSchedule}</span>
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <StatusBadge status={station.status} />
                      </td>

                      <td className="px-5 py-4 text-right md:px-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Edit station details"
                            onClick={() => setEditingStation(station)}
                            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            title="Update operating schedule"
                            onClick={() => setSchedulingStation(station)}
                            className="rounded-lg p-1.5 text-amber-600 transition hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-400/10"
                          >
                            <Clock className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            title="View station energy slots"
                            onClick={() => navigate(`/backoffice/energy-slots/manage?stationId=${station.stationId}`)}
                            className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-400/10"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>

                          {station.status === 'Active' && (
                            <button
                              type="button"
                              title="Deactivate station"
                              onClick={() => setDeactivatingStation(station)}
                              className="rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-400/10"
                            >
                              <PowerOff className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-16 text-center">
                      <Search className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                      <p className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-200">No microgrid stations found</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {searchQuery ? 'Try clearing your search query.' : 'Click "Add New Node" to create your first station.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Map View */
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Map Coordinates</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time GPS coordinates retrieved from <code className="text-amber-600 dark:text-amber-400">/api/stations/map</code>
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mapPins.map((pin) => (
                <div
                  key={pin.id}
                  className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-amber-400 dark:border-slate-800 dark:bg-slate-950/60"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500 ring-1 ring-amber-400/30">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">{pin.name}</h4>
                      <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                        Lat: {pin.lat?.toFixed(4)}° | Lng: {pin.lng?.toFixed(4)}°
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const found = stations.find((s) => s.id === pin.id)
                            if (found) setEditingStation(found)
                          }}
                          className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Edit Node
                        </button>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <a
                          href={`https://www.google.com/maps?q=${pin.lat},${pin.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:underline dark:text-amber-400"
                        >
                          Google Maps <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>

      {/* Modals */}
      {editingStation && (
        <EditStationModal
          station={editingStation}
          onClose={() => setEditingStation(null)}
          onUpdated={loadStations}
        />
      )}

      {schedulingStation && (
        <QuickScheduleModal
          station={schedulingStation}
          onClose={() => setSchedulingStation(null)}
          onUpdated={loadStations}
        />
      )}

      {deactivatingStation && (
        <DeactivateModal
          station={deactivatingStation}
          onClose={() => setDeactivatingStation(null)}
          onDeactivated={loadStations}
        />
      )}
    </div>
  )
}

export default NodesListPage
