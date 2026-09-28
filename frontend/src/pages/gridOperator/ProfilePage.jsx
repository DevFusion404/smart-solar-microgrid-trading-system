/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Identity and Account Management (Component 1)
File          : ProfilePage.jsx (grid operator)
Description   : Grid Operator's own profile. Loads GET /api/profile and
                saves name/phone changes through PUT /api/profile.
                (Address is a prosumer-only field, so it is not shown.)
=====================================================
*/

import { motion } from 'framer-motion'
import {
  AlertCircle,
  CircleUserRound,
  Clock,
  Edit3,
  Mail,
  Phone,
  RefreshCw,
  Save,
  Shield,
  User,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { profileService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { validatePhone } from '../../utils/validators'

// One labelled field in the account information card
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
        <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-100 break-all">
          {value ?? <span className="text-slate-400 italic">Not set</span>}
        </p>
      </div>
    </div>
  )
}

// Formats an ISO date for display
function formatDate(iso) {
  return iso
    ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Never'
}

// Grid Operator profile page backed by the profile API
export function ProfilePage() {
  const { updateUserProfile } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ fullName: '', phoneNumber: '' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Loads the logged-in operator's profile
  const loadProfile = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await profileService.getProfile()
      setProfile(data)
      setForm({ fullName: data.fullName || '', phoneNumber: data.phoneNumber || '' })
    } catch (err) {
      setLoadError(err.message || 'Failed to load your profile.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Validates and saves name/phone changes
  const handleSave = async (e) => {
    e.preventDefault()
    const problem = (form.fullName.trim().length < 2 ? 'Full name must be at least 2 characters.' : '') || validatePhone(form.phoneNumber)
    if (problem) {
      setFormError(problem)
      return
    }
    setFormError('')
    setSaving(true)
    try {
      await updateUserProfile({ fullName: form.fullName.trim(), phoneNumber: form.phoneNumber.trim() })
      setSaved(true)
      setEditing(false)
      loadProfile()
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setFormError(err.message || 'Failed to save profile changes.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-50" />
        Loading your profile…
      </div>
    )
  }

  if (loadError || !profile) {
    return (
      <div className="py-12 text-center text-red-500">
        <AlertCircle className="h-10 w-10 mx-auto mb-2" />
        <p className="font-semibold">{loadError || 'Unable to fetch profile.'}</p>
        <button type="button" onClick={loadProfile} className="mt-3 rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
          Retry
        </button>
      </div>
    )
  }

  const initials = (profile.fullName || 'GO')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View and manage your account details</p>
      </motion.div>

      {saved && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-400/10 dark:text-emerald-300">
          ✓ Profile updated successfully.
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Avatar card */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-500 text-3xl font-bold text-white">
            {initials}
          </div>
          <p className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{profile.fullName}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">@{profile.username}</p>
          <div className="mt-3 flex flex-col items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
              <Shield className="h-3.5 w-3.5" /> Grid Operator
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
              {profile.status}
            </span>
          </div>

          <div className="mt-6 w-full space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Member since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Last login: {formatDate(profile.lastLoginAt)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setEditing((v) => !v); setFormError('') }}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              editing
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {editing ? <><X className="h-4 w-4" /> Cancel</> : <><Edit3 className="h-4 w-4" /> Edit Profile</>}
          </button>
        </motion.div>

        {/* Details */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }} className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {editing ? (
            <form onSubmit={handleSave} className="p-6 space-y-5" noValidate>
              <div className="flex items-center gap-2 mb-2">
                <Edit3 className="h-4 w-4 text-blue-500" />
                <h2 className="font-semibold text-slate-900 dark:text-white">Edit Details</h2>
              </div>
              {formError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">{formError}</p>}
              {[['Full Name', 'fullName', 'text'], ['Phone Number', 'phoneNumber', 'tel']].map(([label, key, type]) => (
                <label key={key} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {label}
                  <input type={type} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </label>
              ))}
              <p className="text-xs text-slate-400">Email and username can only be changed by a Backoffice officer.</p>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save Changes'}</button>
                <button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-1">
                <CircleUserRound className="h-4 w-4 text-slate-400" />
                <h2 className="font-semibold text-slate-900 dark:text-white">Account Information</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Last updated: {formatDate(profile.updatedAt)}</p>
              <InfoRow icon={User} label="Full Name" value={profile.fullName} />
              <InfoRow icon={User} label="Username" value={`@${profile.username}`} />
              <InfoRow icon={Mail} label="Email Address" value={profile.email} />
              <InfoRow icon={Phone} label="Phone Number" value={profile.phoneNumber} />
              <InfoRow icon={Shield} label="Role" value="Grid Operator" />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
