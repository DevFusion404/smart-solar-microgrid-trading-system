/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : ManageEnergySlots.jsx
Description   : Full management interface for energy booking slots linked to microgrid stations
Author        : Sithmaka
=====================================================
*/

import {
  AlertCircle,
  BatteryCharging,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Clock3,
  Cpu,
  Edit2,
  Eye,
  Link as LinkIcon,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useSearchParams } from 'react-router-dom'
import { Panel, SectionHeading } from '../../components/common/Panel'
import { StatusBadge } from '../../components/common/StatusBadge'
import { slotService, stationService } from '../../services'

// Slot Detail Modal
function SlotDetailModal({ slot, stationName, onClose, onAdjustCapacity, onEdit }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const total = slot.totalCapacity || 1
  const available = slot.availableCapacity ?? slot.totalCapacity
  const reserved = Math.max(0, total - available)
  const utilization = Math.round((reserved / total) * 100)

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
      role="presentation"
      onClick={onClose}
    >
      <Panel
        role="dialog"
        aria-modal="true"
        aria-labelledby="slot-detail-title"
        className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Energy slot details
            </p>
            <h2 id="slot-detail-title" className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
              {slot.slotId || slot.id}
            </h2>
          </div>
          <button
            type="button"
            title="Close slot details"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex items-center justify-between">
            <StatusBadge status={slot.status || 'Available'} />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {utilization}% utilized
            </span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-amber-400 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, utilization))}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 p-3.5 dark:border-slate-800">
              <Zap className="h-4 w-4 text-amber-500" />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Total capacity</p>
              <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">
                {slot.totalCapacity} kWh
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 p-3.5 dark:border-slate-800">
              <BatteryCharging className="h-4 w-4 text-emerald-500" />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Available capacity</p>
              <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">
                {slot.availableCapacity} kWh
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 p-3.5 dark:border-slate-800">
              <Users className="h-4 w-4 text-blue-500" />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Booked energy</p>
              <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">
                {reserved} kWh
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 p-3.5 dark:border-slate-800">
              <LinkIcon className="h-4 w-4 text-violet-500" />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Station Code</p>
              <p className="mt-1 font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                {slot.stationId}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Microgrid node</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {stationName || slot.stationId}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled date</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {slot.date ? new Date(slot.date).toLocaleDateString('en-GB') : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Time window</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {slot.startTime} - {slot.endTime}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose()
                onEdit(slot)
              }}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Edit Slot Info
            </button>
            <button
              type="button"
              onClick={() => {
                onClose()
                onAdjustCapacity(slot)
              }}
              className="flex-1 rounded-xl bg-amber-500 py-2.5 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400"
            >
              Adjust Capacity
            </button>
          </div>
        </div>
      </Panel>
    </div>,
    document.body
  )
}

// Create Slot Modal
function CreateSlotModal({ station, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    slotId: `SLOT-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00:00',
    endTime: '10:00:00',
    totalCapacity: 100,
    status: 'Available',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.slotId.trim()) {
      setError('Slot ID is required')
      return
    }

    const total = parseFloat(formData.totalCapacity)
    if (isNaN(total) || total <= 0) {
      setError('Total capacity must be greater than zero')
      return
    }

    // Ensure format HH:mm:ss
    const formatTime = (t) => (t.length === 5 ? `${t}:00` : t)

    try {
      setSaving(true)
      await slotService.createSlot(station.stationId, {
        slotId: formData.slotId.trim().toUpperCase(),
        date: formData.date,
        startTime: formatTime(formData.startTime),
        endTime: formatTime(formData.endTime),
        totalCapacity: total,
        availableCapacity: total, // Starts equal to totalCapacity
        status: formData.status,
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create energy slot')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <Panel className="w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white">Create Energy Booking Slot</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Station: {station.stationName} ({station.stationId})</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
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
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Slot Identifier</label>
            <input
              type="text"
              required
              value={formData.slotId}
              onChange={(e) => setFormData({ ...formData, slotId: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm uppercase outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Booking Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Start Time</label>
              <input
                type="time"
                step="1"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">End Time</label>
              <input
                type="time"
                step="1"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Total Capacity (kWh)</label>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                value={formData.totalCapacity}
                onChange={(e) => setFormData({ ...formData, totalCapacity: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
              <p className="mt-1 text-[11px] text-slate-400">Available capacity will start equal to this.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="Available">Available</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
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
              {saving ? 'Creating...' : 'Create Energy Slot'}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  )
}

// Edit Slot Modal
function EditSlotModal({ slot, onClose, onUpdated }) {
  const [formData, setFormData] = useState({
    date: slot.date ? new Date(slot.date).toISOString().split('T')[0] : '',
    startTime: slot.startTime || '08:00:00',
    endTime: slot.endTime || '10:00:00',
    status: slot.status || 'Available',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const formatTime = (t) => (t.length === 5 ? `${t}:00` : t)

    try {
      setSaving(true)
      await slotService.updateSlot(slot.id, {
        date: formData.date,
        startTime: formatTime(formData.startTime),
        endTime: formatTime(formData.endTime),
        totalCapacity: slot.totalCapacity, // Preserved
        availableCapacity: slot.availableCapacity, // Preserved
        status: formData.status,
      })
      onUpdated()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update slot')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <Panel className="w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white">Edit Slot Info</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{slot.slotId || slot.id}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
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
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Start Time</label>
              <input
                type="time"
                step="1"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">End Time</label>
              <input
                type="time"
                step="1"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="Available">Available</option>
              <option value="Booked">Booked</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            Total capacity is fixed at <strong>{slot.totalCapacity} kWh</strong>. Use the Adjust Capacity action to update available capacity.
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
              {saving ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  )
}

// Adjust Capacity Modal
function AdjustCapacityModal({ slot, onClose, onAdjusted }) {
  const [capacity, setCapacity] = useState(slot.availableCapacity ?? slot.totalCapacity)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const val = parseFloat(capacity)
    if (isNaN(val) || val < 0) {
      setError('Capacity cannot be negative')
      return
    }
    if (val > slot.totalCapacity) {
      setError(`Available capacity cannot exceed total capacity (${slot.totalCapacity} kWh)`)
      return
    }

    try {
      setSaving(true)
      await slotService.adjustSlotCapacity(slot.id, val)
      onAdjusted()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to adjust capacity')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <Panel className="w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white">Adjust Available Capacity</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{slot.slotId || slot.id}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
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

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Slot Capacity:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{slot.totalCapacity} kWh</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
              New Available Capacity (kWh)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              max={slot.totalCapacity}
              required
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-400">
              Endpoint called by reservation workflows when prosumers reserve or cancel bookings.
            </p>
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
              {saving ? 'Updating...' : 'Update Capacity'}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  )
}

export function ManageEnergySlots() {
  const [searchParams] = useSearchParams()
  const initialStationId = searchParams.get('stationId') || ''

  const [stations, setStations] = useState([])
  const [selectedStationId, setSelectedStationId] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Modals state
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [creatingSlot, setCreatingSlot] = useState(false)
  const [editingSlot, setEditingSlot] = useState(null)
  const [adjustingSlot, setAdjustingSlot] = useState(null)

  // Load all stations initially
  useEffect(() => {
    async function initStations() {
      try {
        setLoading(true)
        setError(null)
        const data = await stationService.getAllStations()
        const stationList = data || []
        setStations(stationList)

        if (stationList.length > 0) {
          // Preselect station from URL param if present, otherwise first active station
          const matched = stationList.find((s) => s.stationId === initialStationId)
          if (matched) {
            setSelectedStationId(matched.stationId)
          } else {
            setSelectedStationId(stationList[0].stationId)
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load microgrid stations')
      } finally {
        setLoading(false)
      }
    }

    initStations()
  }, [initialStationId])

  // Fetch slots whenever selected station or date changes
  const loadSlots = async () => {
    if (!selectedStationId) return
    try {
      setSlotsLoading(true)
      setError(null)
      const data = await slotService.getSlotsByStation(selectedStationId, dateFilter || undefined)
      setSlots(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load energy slots for station')
    } finally {
      setSlotsLoading(false)
    }
  }

  useEffect(() => {
    loadSlots()
  }, [selectedStationId, dateFilter])

  const selectedStation = useMemo(() => {
    return stations.find((s) => s.stationId === selectedStationId) || null
  }, [stations, selectedStationId])

  // Filter slots by search keyword
  const visibleSlots = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return slots
    return slots.filter((slot) =>
      [slot.slotId, slot.status, slot.startTime, slot.endTime].some((val) =>
        val?.toLowerCase().includes(q)
      )
    )
  }, [slots, searchTerm])

  // Stats calculation
  const stats = useMemo(() => {
    const totalSlots = slots.length
    const totalCap = slots.reduce((acc, s) => acc + (s.totalCapacity || 0), 0)
    const availableCap = slots.reduce((acc, s) => acc + (s.availableCapacity || 0), 0)
    const bookedCap = Math.max(0, totalCap - availableCap)
    const bookedRatio = totalCap > 0 ? Math.round((bookedCap / totalCap) * 100) : 0

    return { totalSlots, totalCap, availableCap, bookedCap, bookedRatio }
  }, [slots])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Sparkles className="h-3.5 w-3.5" /> Component 2: Energy Slot Management
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl dark:text-white">
            Manage Energy Slots
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Publish time slots, control capacity distribution, and review prosumer booking availability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadSlots}
            disabled={slotsLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${slotsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {selectedStation && (
            <button
              type="button"
              onClick={() => setCreatingSlot(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />
              Create Slot
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Panel className="p-5">
          <p className="text-3xl font-bold text-slate-950 dark:text-white">{stats.totalSlots}</p>
          <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Published Slots</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            For {selectedStation?.stationName || 'selected station'}
          </p>
        </Panel>

        <Panel className="p-5">
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.availableCap.toLocaleString()} <span className="text-sm font-normal text-slate-400">/ {stats.totalCap.toLocaleString()} kWh</span>
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Available Energy</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Remaining bookable capacity</p>
        </Panel>

        <Panel className="p-5">
          <p className="text-3xl font-bold text-amber-500">{stats.bookedRatio}%</p>
          <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Capacity Booked</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stats.bookedCap.toLocaleString()} kWh reserved</p>
        </Panel>
      </div>

      {/* Main Table Panel */}
      <Panel className="overflow-hidden">
        {/* Controls Bar: Station Selector + Date Filter + Search */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between md:px-6 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            {/* Station Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">Microgrid Station</label>
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                {stations.map((stn) => (
                  <option key={stn.id} value={stn.stationId}>
                    {stn.stationName} ({stn.stationId}) - {stn.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">Filter Date</label>
              <div className="relative mt-1">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>
            </div>

            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="mt-5 text-xs text-amber-600 hover:underline dark:text-amber-400"
              >
                Clear Date
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search slot ID..."
                className="w-36 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-white"
              />
            </label>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="m-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-400/10 dark:text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Table Content */}
        {slotsLoading ? (
          <div className="py-20 text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-amber-500" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading energy slots...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 md:px-6">Slot Identifier</th>
                  <th className="px-3 py-3.5">Date & Window</th>
                  <th className="px-3 py-3.5">Total Cap</th>
                  <th className="px-3 py-3.5">Available Cap</th>
                  <th className="px-3 py-3.5">Utilization</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right md:px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleSlots.length > 0 ? (
                  visibleSlots.map((slot) => {
                    const total = slot.totalCapacity || 1
                    const available = slot.availableCapacity ?? slot.totalCapacity
                    const booked = Math.max(0, total - available)
                    const percent = Math.round((booked / total) * 100)

                    return (
                      <tr
                        key={slot.id}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-900 md:px-6 dark:text-white">
                          <span className="font-mono text-amber-600 dark:text-amber-400">{slot.slotId}</span>
                        </td>

                        <td className="px-3 py-4">
                          <p className="whitespace-nowrap text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {slot.date ? new Date(slot.date).toLocaleDateString('en-GB') : 'N/A'}
                          </p>
                          <p className="mt-0.5 whitespace-nowrap font-mono text-xs text-slate-400">
                            {slot.startTime} - {slot.endTime}
                          </p>
                        </td>

                        <td className="px-3 py-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{slot.totalCapacity}</span>
                          <span className="ml-1 text-xs text-slate-400">kWh</span>
                        </td>

                        <td className="px-3 py-4">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{slot.availableCapacity}</span>
                          <span className="ml-1 text-xs text-slate-400">kWh</span>
                        </td>

                        <td className="px-3 py-4">
                          <div className="w-24">
                            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                              <span>{percent}%</span>
                            </div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className="h-full rounded-full bg-amber-400"
                                style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-4">
                          <StatusBadge status={slot.status || 'Available'} />
                        </td>

                        <td className="px-5 py-4 text-right md:px-6">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              title="Inspect slot"
                              onClick={() => setSelectedSlot(slot)}
                              className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-400/10"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              title="Edit slot window / status"
                              onClick={() => setEditingSlot(slot)}
                              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              title="Adjust available capacity"
                              onClick={() => setAdjustingSlot(slot)}
                              className="rounded-lg p-1.5 text-amber-500 transition hover:bg-amber-50 dark:hover:bg-amber-400/10"
                            >
                              <BatteryCharging className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="py-16 text-center">
                      <Zap className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                      <p className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-200">No energy slots found</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {dateFilter ? 'No slots published for this date.' : 'Click "Create Slot" to publish capacity for this station.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Modals */}
      {selectedSlot && (
        <SlotDetailModal
          slot={selectedSlot}
          stationName={selectedStation?.stationName}
          onClose={() => setSelectedSlot(null)}
          onEdit={(s) => setEditingSlot(s)}
          onAdjustCapacity={(s) => setAdjustingSlot(s)}
        />
      )}

      {creatingSlot && selectedStation && (
        <CreateSlotModal
          station={selectedStation}
          onClose={() => setCreatingSlot(false)}
          onCreated={loadSlots}
        />
      )}

      {editingSlot && (
        <EditSlotModal
          slot={editingSlot}
          onClose={() => setEditingSlot(null)}
          onUpdated={loadSlots}
        />
      )}

      {adjustingSlot && (
        <AdjustCapacityModal
          slot={adjustingSlot}
          onClose={() => setAdjustingSlot(null)}
          onAdjusted={loadSlots}
        />
      )}
    </div>
  )
}

export default ManageEnergySlots
