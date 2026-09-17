import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  User,
  X,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { profileService } from '../../services'
import { useAuth } from '../../context/AuthContext'

function InfoRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
        <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className={`mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-100 break-all ${mono ? 'font-mono' : ''}`}>
          {value ?? <span className="italic text-slate-400">Not set</span>}
        </p>
      </div>
    </div>
  )
}

const statusInfo = {
  Active: {
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
    icon: CheckCircle2,
    desc: 'Your account is active and you have full access to the platform.',
  },
  PendingActivation: {
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
    icon: Clock,
    desc: 'Your registration is pending Backoffice review. You will be notified once approved.',
  },
  PendingDeactivation: {
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300',
    icon: Clock,
    desc: 'Your deactivation request is pending Backoffice review.',
  },
  Deactivated: {
    color: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300',
    icon: X,
    desc: 'Your account has been deactivated. Contact support if you believe this is a mistake.',
  },
}

export function ProfilePage() {
  const { updateUserProfile } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ fullName: '', phoneNumber: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deactivationReason, setDeactivationReason] = useState('')
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [deactivationSubmitted, setDeactivationSubmitted] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await profileService.getProfile()
      setProfile(data)
      setForm({
        fullName: data.fullName || '',
        phoneNumber: data.phoneNumber || '',
        address: data.address || '',
      })
    } catch (err) {
      console.error('Failed to load prosumer profile:', err)
      setError(err.message || 'Failed to connect to profile service.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const formatDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'N/A'

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateUserProfile(form)
      setSaved(true)
      setEditing(false)
      loadProfile()
      setTimeout(() => setSaved(false), 3500)
    } catch (err) {
      alert(err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleRequestDeactivation = async () => {
    if (!deactivationReason.trim()) return
    setDeactivating(true)
    try {
      await profileService.requestDeactivation(deactivationReason)
      setShowDeactivateConfirm(false)
      setDeactivationSubmitted(true)
      loadProfile()
    } catch (err) {
      alert(err.message || 'Failed to submit deactivation request.')
    } finally {
      setDeactivating(false)
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

  if (error || !profile) {
    return (
      <div className="py-12 text-center text-red-500">
        <AlertCircle className="h-10 w-10 mx-auto mb-2" />
        <p className="font-semibold">{error || 'Unable to fetch profile.'}</p>
        <button type="button" onClick={loadProfile} className="mt-3 rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
          Retry
        </button>
      </div>
    )
  }

  const initials = profile.fullName
    ? profile.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'PR'

  const status = profile.status || 'Active'
  const si = statusInfo[status] ?? statusInfo.Active
  const StatusIcon = si.icon

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your personal details and account settings</p>
      </motion.div>

      {saved && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-400/10 dark:text-emerald-300">
          ✓ Profile updated successfully.
        </motion.div>
      )}

      {deactivationSubmitted && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-700/40 dark:bg-amber-400/10 dark:text-amber-300">
          ⏳ Your deactivation request has been submitted. Awaiting Backoffice review.
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Left — Avatar + status */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 text-3xl font-bold text-white">
              {initials}
            </div>
            <p className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{profile.fullName}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">@{profile.username}</p>
            <div className="mt-3 flex flex-col items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${si.color}`}>
                <StatusIcon className="h-3.5 w-3.5" /> {status}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400"><Shield className="h-3 w-3" /> Prosumer</span>
            </div>
            <div className="mt-4 w-full space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              {profile.createdAt && <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 shrink-0" />Registered {new Date(profile.createdAt).toLocaleDateString('en-GB')}</div>}
              <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 shrink-0" />Last login {formatDate(profile.lastLoginAt)}</div>
            </div>
            <button type="button" onClick={() => setEditing((v) => !v)} className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${editing ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>
              {editing ? <><X className="h-4 w-4" /> Cancel</> : <><Edit3 className="h-4 w-4" /> Edit Profile</>}
            </button>
          </motion.div>

          {/* Account Status card */}
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">Account Status</h3>
            <div className={`flex items-start gap-2 rounded-xl p-3 ${si.color}`}>
              <StatusIcon className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-xs">{si.desc}</p>
            </div>
          </motion.div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Profile details / edit form */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 }} className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {editing ? (
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Edit3 className="h-4 w-4 text-emerald-500" />
                  <h2 className="font-semibold text-slate-900 dark:text-white">Edit Profile</h2>
                </div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full Name
                  <input type="text" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </label>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Phone Number
                  <input type="tel" value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} required className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </label>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Address
                  <textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 resize-none" />
                </label>
                <p className="text-xs text-slate-400">Note: Email and NIC cannot be changed. Contact support if needed.</p>
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save Changes'}</button>
                  <button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="p-6">
                <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Personal Information</h2>
                <InfoRow icon={User} label="Full Name" value={profile.fullName} />
                <InfoRow icon={User} label="Username" value={`@${profile.username}`} mono />
                <InfoRow icon={User} label="NIC Number" value={profile.nic} mono />
                <InfoRow icon={Mail} label="Email Address" value={profile.email} />
                <InfoRow icon={Phone} label="Phone Number" value={profile.phoneNumber} />
                <InfoRow icon={MapPin} label="Address" value={profile.address} />
              </div>
            )}
          </motion.div>

          {/* Account lifecycle / deactivation section */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.09 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <h2 className="font-semibold text-slate-900 dark:text-white">Account Actions</h2>
            </div>

            {status === 'Active' && !showDeactivateConfirm && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 dark:border-red-800/40 dark:bg-red-400/5">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Request Account Deactivation</p>
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Once submitted, your request will be reviewed by the Backoffice team. Your account will remain active until approved.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeactivateConfirm(true)}
                  className="mt-3 flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition"
                >
                  <AlertTriangle className="h-4 w-4" /> Request Deactivation
                </button>
              </div>
            )}

            <AnimatePresence>
              {showDeactivateConfirm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/40 dark:bg-red-400/5">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">Confirm Deactivation Request</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mb-3">Please provide a reason for your deactivation request.</p>
                    <textarea
                      value={deactivationReason}
                      onChange={(e) => setDeactivationReason(e.target.value)}
                      placeholder="Enter your reason here…"
                      rows={3}
                      className="w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 dark:border-red-700/40 dark:bg-slate-800 dark:text-slate-100 resize-none"
                    />
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={handleRequestDeactivation} disabled={deactivating || !deactivationReason.trim()} className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition">
                        {deactivating ? 'Submitting…' : 'Submit Request'}
                      </button>
                      <button type="button" onClick={() => setShowDeactivateConfirm(false)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700/40 dark:text-red-400">
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {status === 'PendingDeactivation' && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-700/40 dark:bg-orange-400/5">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Deactivation Request Pending</p>
                </div>
                <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                  Your request is being reviewed by the Backoffice team. You will be notified of the outcome.
                </p>
              </div>
            )}

            {status !== 'Active' && status !== 'PendingDeactivation' && (
              <p className="text-sm text-slate-400">No account actions available for your current status.</p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
