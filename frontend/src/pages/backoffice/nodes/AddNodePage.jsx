/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : AddNodePage.jsx
Description   : Registration page for creating new solar microgrid station nodes
Author        : Sithmaka
=====================================================
*/

import {
  AlertCircle,
  ArrowLeft,
  BatteryCharging,
  CheckCircle2,
  Clock,
  Cpu,
  MapPin,
  Save,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Panel } from '../../../components/common/Panel'
import { stationService } from '../../../services'

// Quick preset coordinates for Sri Lankan regions
const PRESETS = [
  { label: 'Colombo Hub', address: 'Colombo 03', lat: 6.9271, lng: 79.8612 },
  { label: 'Kandy Station', address: 'Peradeniya Road, Kandy', lat: 7.2906, lng: 80.6337 },
  { label: 'Galle Solar', address: 'Fort Road, Galle', lat: 6.0535, lng: 80.2210 },
  { label: 'Jaffna Grid', address: 'Hospital Road, Jaffna', lat: 9.6615, lng: 80.0255 },
  { label: 'Kurunegala Hub', address: 'Negombo Road, Kurunegala', lat: 7.4863, lng: 80.3623 },
]

export function AddNodePage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    stationId: '',
    stationName: '',
    address: '',
    latitude: '',
    longitude: '',
    energyCapacity: '',
    batteryStorageCapacity: '',
    operationalSchedule: '06:00 AM - 06:00 PM (Daily)',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      address: prev.address || preset.address,
      latitude: preset.lat,
      longitude: preset.lng,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Form field validations
    if (!formData.stationId.trim()) {
      setError('Station ID is required (e.g. STN-001)')
      return
    }
    if (!formData.stationName.trim()) {
      setError('Station Name is required')
      return
    }
    if (!formData.address.trim()) {
      setError('Address is required')
      return
    }

    const lat = parseFloat(formData.latitude)
    const lng = parseFloat(formData.longitude)
    const energy = parseFloat(formData.energyCapacity)
    const battery = parseFloat(formData.batteryStorageCapacity)

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be a valid coordinate between -90 and 90')
      return
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError('Longitude must be a valid coordinate between -180 and 180')
      return
    }
    if (isNaN(energy) || energy <= 0) {
      setError('Energy capacity must be greater than zero kWh')
      return
    }
    if (isNaN(battery) || battery < 0) {
      setError('Battery storage capacity cannot be negative')
      return
    }
    if (!formData.operationalSchedule.trim()) {
      setError('Operational schedule is required')
      return
    }

    try {
      setLoading(true)
      await stationService.createStation({
        stationId: formData.stationId.trim().toUpperCase(),
        stationName: formData.stationName.trim(),
        address: formData.address.trim(),
        latitude: lat,
        longitude: lng,
        energyCapacity: energy,
        batteryStorageCapacity: battery,
        operationalSchedule: formData.operationalSchedule.trim(),
      })

      setSuccess(true)
      setTimeout(() => {
        navigate('/backoffice/nodes')
      }, 1500)
    } catch (err) {
      setError(err.message || 'Failed to create microgrid station')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back Link & Header */}
      <div>
        <Link
          to="/backoffice/nodes"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Microgrid Nodes
        </Link>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          <Cpu className="h-3.5 w-3.5" /> Node Registration
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl dark:text-white">
          Add New Microgrid Node
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Register a physical solar generation station and publish its GPS coordinates to the grid.
        </p>
      </div>

      {/* Success Notification */}
      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-400/10 dark:text-emerald-300">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h4 className="text-sm font-bold">Node Created Successfully!</h4>
            <p className="text-xs">Redirecting to microgrid nodes list...</p>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-900/50 dark:bg-rose-400/10 dark:text-rose-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {/* Form Card */}
      <Panel className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Identifiers */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">1. Station Identifiers</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Unique identifier and public station name.</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                  Station ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STN-001"
                  value={formData.stationId}
                  onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm uppercase outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                  Station Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Colombo Solar Hub"
                  value={formData.stationName}
                  onChange={(e) => setFormData({ ...formData, stationName: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* Section 2: Location & GPS */}
          <div>
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">2. Location & GPS Coordinates</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Required for Google Maps integration and station search.</p>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-400">Presets:</span>
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:border-amber-400 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                  Physical Address / Location <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. No 128, Galle Road, Colombo 03"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    Latitude (-90° to 90°) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 6.9271"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    Longitude (-180° to 180°) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 79.8612"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* Section 3: Capacities & Schedule */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">3. Energy Capacity & Operating Hours</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Specify production ratings and operational schedule.</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                  Energy Generation Capacity (kWh) <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <Zap className="absolute left-3.5 top-3 h-4 w-4 text-amber-500" />
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    placeholder="e.g. 500"
                    value={formData.energyCapacity}
                    onChange={(e) => setFormData({ ...formData, energyCapacity: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                  Battery Storage Capacity (kWh) <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <BatteryCharging className="absolute left-3.5 top-3 h-4 w-4 text-violet-500" />
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="e.g. 200"
                    value={formData.batteryStorageCapacity}
                    onChange={(e) => setFormData({ ...formData, batteryStorageCapacity: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                  Operational Schedule <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <Clock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 06:00 AM - 06:00 PM (Daily)"
                    value={formData.operationalSchedule}
                    onChange={(e) => setFormData({ ...formData, operationalSchedule: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/backoffice/nodes')}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Registering Node...' : 'Register Station Node'}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  )
}

export default AddNodePage
