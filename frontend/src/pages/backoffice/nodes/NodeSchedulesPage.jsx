/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : NodeSchedulesPage.jsx
Description   : Operational hours and schedule management across microgrid nodes
Author        : Sithmaka
=====================================================
*/

import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Edit2,
  MapPin,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Panel, SectionHeading } from '../../../components/common/Panel'
import { StatusBadge } from '../../../components/common/StatusBadge'
import { stationService } from '../../../services'

export function NodeSchedulesPage() {
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Edit schedule modal
  const [activeStation, setActiveStation] = useState(null)
  const [scheduleInput, setScheduleInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState(null)
  const [successToast, setSuccessToast] = useState(null)

  const loadStations = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await stationService.getAllStations()
      setStations(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load microgrid node schedules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStations()
  }, [])

  const handleOpenScheduleModal = (station) => {
    setActiveStation(station)
    setScheduleInput(station.operationalSchedule || '')
    setModalError(null)
  }

  const handleSaveSchedule = async (e) => {
    e.preventDefault()
    if (!scheduleInput.trim()) {
      setModalError('Schedule cannot be empty')
      return
    }

    try {
      setSaving(true)
      setModalError(null)
      await stationService.updateStationSchedule(activeStation.id, scheduleInput.trim())
      setSuccessToast(`Schedule updated for ${activeStation.stationName}`)
      setActiveStation(null)
      await loadStations()

      setTimeout(() => {
        setSuccessToast(null)
      }, 3000)
    } catch (err) {
      setModalError(err.message || 'Failed to update station schedule')
    } finally {
      setSaving(false)
    }
  }

  const filteredStations = stations.filter((s) => {
    if (!searchQuery.trim()) return true
    return [s.stationName, s.stationId, s.operationalSchedule, s.address].some((val) =>
      val?.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link
            to="/backoffice/nodes"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Microgrid Nodes
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" /> Operational Hours
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl dark:text-white">
            Node Operational Schedules
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage operational hours, daily operating windows, and publishing schedules across all stations.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStations}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Success Banner */}
      {successToast && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-400/10 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-400/10 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Panel */}
      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between md:px-6 dark:border-slate-800">
          <SectionHeading
            title="Station Operating Timetables"
            description="Operational schedules determine when stations generate and accept slot bookings."
          />
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schedule or node..."
              className="w-48 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-white"
            />
          </label>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-amber-500" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading schedules...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredStations.length > 0 ? (
              filteredStations.map((station) => (
                <div
                  key={station.id}
                  className="flex flex-col justify-between gap-4 p-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center md:px-6 dark:hover:bg-slate-800/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-600 ring-1 ring-amber-400/20 dark:text-amber-400">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{station.stationName}</span>
                        <span className="font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">{station.stationId}</span>
                        <StatusBadge status={station.status} />
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3 w-3" /> {station.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:justify-end">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-amber-500" />
                        <span>{station.operationalSchedule}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenScheduleModal(station)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-amber-500" />
                      Edit Schedule
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center">
                <Clock className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-200">No schedules found</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {searchQuery ? 'Try matching another station name.' : 'No stations registered yet.'}
                </p>
              </div>
            )}
          </div>
        )}
      </Panel>

      {/* Edit Schedule Modal */}
      {activeStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <Panel className="w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Edit Operating Schedule</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeStation.stationName} ({activeStation.stationId})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveStation(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4 p-6">
              {modalError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                  Operational Schedule Description
                </label>
                <input
                  type="text"
                  required
                  value={scheduleInput}
                  onChange={(e) => setScheduleInput(e.target.value)}
                  placeholder="e.g. 06:00 AM - 06:00 PM (Mon-Sun)"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Quick schedule suggestions */}
              <div>
                <span className="text-xs text-slate-400">Quick options:</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[
                    '06:00 AM - 06:00 PM (Daily)',
                    '08:00 AM - 05:00 PM (Mon-Fri)',
                    '06:00 AM - 08:00 PM (Daily)',
                    '24/7 Operational (Solar + Battery)',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setScheduleInput(suggestion)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600 hover:border-amber-400 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStation(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </Panel>
        </div>
      )}
    </div>
  )
}

export default NodeSchedulesPage
