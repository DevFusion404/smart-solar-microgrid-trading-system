import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit3,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Shield,
  User,
  UserCheck,
  UserMinus,
  UserX,
  X,
  AlertCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { prosumerService } from '../../services'

const statusStyle = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  PendingActivation: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  PendingDeactivation: 'bg-orange-100 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300',
  Deactivated: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300',
}
const statusLabel = { PendingActivation: 'Pending Activation', PendingDeactivation: 'Pending Deactivation' }

function StatusBadge({ status }) {
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[status] ?? ''}`}>{statusLabel[status] ?? status}</span>
}

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

function TimelineItem({ label, date, by, color }) {
  if (!date) return null
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${color}`} />
        <div className="flex-1 w-px bg-slate-200 dark:bg-slate-700 mt-1" />
      </div>
      <div className="pb-5 -mt-0.5">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          {by && ` · by ${by}`}
        </p>
      </div>
    </div>
  )
}

export function ProsumerDetailPage() {
  const { nic } = useParams()
  const navigate = useNavigate()
  const [prosumer, setProsumer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', phoneNumber: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deactivateReason, setDeactivateReason] = useState('')

  const fetchProsumer = useCallback(async () => {
    if (!nic) return
    setLoading(true)
    setError('')
    try {
      const data = await prosumerService.getProsumerByNic(nic)
      setProsumer(data)
      setForm({
        fullName: data.fullName || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        address: data.address || '',
      })
    } catch (err) {
      console.error('Failed to load prosumer details:', err)
      setError(err.message || 'Prosumer account not found or access denied.')
    } finally {
      setLoading(false)
    }
  }, [nic])

  useEffect(() => {
    fetchProsumer()
  }, [fetchProsumer])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await prosumerService.updateProsumer(nic, form)
      showToast('✓ Profile updated successfully.')
      setEditing(false)
      fetchProsumer()
    } catch (err) {
      alert(err.message || 'Failed to update prosumer profile.')
    } finally {
      setSaving(false)
    }
  }

  const applyAction = async (type) => {
    try {
      if (type === 'activate') {
        await prosumerService.activateProsumer(nic)
      } else if (type === 'reject') {
        await prosumerService.rejectProsumerActivation(nic, rejectReason)
      } else if (type === 'deactivate') {
        await prosumerService.approveDeactivation(nic)
      } else if (type === 'reactivate') {
        await prosumerService.reactivateProsumer(nic)
      }
      setConfirmAction(null)
      showToast(`✓ Action [${type}] completed successfully.`)
      fetchProsumer()
    } catch (err) {
      alert(err.message || 'Action failed.')
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-50" />
        Loading prosumer profile…
      </div>
    )
  }

  if (error || !prosumer) {
    return (
      <div className="space-y-4 py-12 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <p className="font-semibold text-slate-800 dark:text-slate-200">{error || 'Prosumer not found.'}</p>
        <button type="button" onClick={() => navigate('/backoffice/prosumers')} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
          Back to Prosumers
        </button>
      </div>
    )
  }

  const initials = prosumer.fullName ? prosumer.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'PR'

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/backoffice/prosumers')} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Prosumer Profile</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">NIC: {prosumer.nic}</p>
        </div>
      </motion.div>

      {toast && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-400/10 dark:text-emerald-300">
          {toast}
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Left column */}
        <div className="space-y-4">
          {/* Avatar card */}
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-400 text-2xl font-bold text-slate-950">{initials}</div>
            <p className="mt-3 font-bold text-slate-900 dark:text-white">{prosumer.fullName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">@{prosumer.username || prosumer.nic}</p>
            <div className="mt-3 flex flex-col items-center gap-2">
              <StatusBadge status={prosumer.status} />
              <span className="flex items-center gap-1 text-xs text-slate-400"><Shield className="h-3 w-3" /> Prosumer</span>
            </div>
            <div className="mt-4 w-full space-y-1.5 text-xs text-slate-500 dark:text-slate-400 text-left">
              <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 shrink-0" /> Registered {prosumer.createdAt ? new Date(prosumer.createdAt).toLocaleDateString('en-GB') : '-'}</div>
              {prosumer.lastLoginAt && <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 shrink-0" /> Last login {new Date(prosumer.lastLoginAt).toLocaleDateString('en-GB')}</div>}
            </div>
          </motion.div>

          {/* Actions card */}
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.07 }} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Actions</p>
            {prosumer.status === 'PendingActivation' && <>
              <button type="button" onClick={() => setConfirmAction('activate')} className="flex w-full items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"><UserCheck className="h-4 w-4" /> Activate Account</button>
              <button type="button" onClick={() => setConfirmAction('reject')} className="flex w-full items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-700/40 dark:bg-red-400/5 dark:text-red-400"><UserX className="h-4 w-4" /> Reject Activation</button>
            </>}
            {prosumer.status === 'Active' && (
              <button type="button" onClick={() => setConfirmAction('deactivate')} className="flex w-full items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"><UserMinus className="h-4 w-4" /> Deactivate Account</button>
            )}
            {prosumer.status === 'PendingDeactivation' && <>
              <button type="button" onClick={() => setConfirmAction('deactivate')} className="flex w-full items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"><UserMinus className="h-4 w-4" /> Approve Deactivation</button>
              <button type="button" onClick={() => setConfirmAction('reactivate')} className="flex w-full items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"><RefreshCw className="h-4 w-4" /> Dismiss & Keep Active</button>
            </>}
            {prosumer.status === 'Deactivated' && (
              <button type="button" onClick={() => setConfirmAction('reactivate')} className="flex w-full items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600"><RefreshCw className="h-4 w-4" /> Reactivate Account</button>
            )}
            <button type="button" onClick={() => setEditing((v) => !v)} className={`flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${editing ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300' : 'border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
              {editing ? <><X className="h-4 w-4" /> Cancel Editing</> : <><Edit3 className="h-4 w-4" /> Edit Profile</>}
            </button>
          </motion.div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Profile info / edit */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 }} className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {editing ? (
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><Edit3 className="h-4 w-4 text-amber-400" /> Edit Profile</h2>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full Name
                  <input type="text" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </label>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                  <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </label>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Phone Number
                  <input type="tel" value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} required className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </label>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Address
                  <textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={2} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 resize-none" />
                </label>
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save Changes'}</button>
                  <button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="p-6">
                <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Account Details</h2>
                <InfoRow icon={User} label="Full Name" value={prosumer.fullName} />
                <InfoRow icon={User} label="Username" value={prosumer.username ? `@${prosumer.username}` : undefined} mono />
                <InfoRow icon={User} label="NIC" value={prosumer.nic} mono />
                <InfoRow icon={Mail} label="Email Address" value={prosumer.email} />
                <InfoRow icon={Phone} label="Phone Number" value={prosumer.phoneNumber} />
                <InfoRow icon={MapPin} label="Address" value={prosumer.address} />
              </div>
            )}
          </motion.div>

          {/* Timeline */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.09 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" /> Account Timeline</h2>
            <div>
              <TimelineItem label="Account Registered" date={prosumer.createdAt} color="bg-blue-500" />
              <TimelineItem label="Activation Requested" date={prosumer.activationRequestedAt} color="bg-amber-400" />
              <TimelineItem label="Account Activated" date={prosumer.activatedAt} by={prosumer.activatedBy} color="bg-emerald-500" />
              <TimelineItem label="Deactivation Requested" date={prosumer.deactivationRequestedAt} color="bg-orange-400" />
              <TimelineItem label="Account Deactivated" date={prosumer.deactivatedAt} by={prosumer.deactivatedBy} color="bg-red-500" />
            </div>
            {prosumer.deactivationReason && (
              <div className="mt-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-700/40 dark:bg-orange-400/5">
                <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Reason:</p>
                <p className="mt-0.5 text-sm italic text-orange-800 dark:text-orange-200">"{prosumer.deactivationReason}"</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Confirm dialogs */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">{confirmAction.replace(/([A-Z])/g, ' $1')} Account</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {confirmAction === 'activate' && 'This will approve the prosumer registration and grant platform access.'}
                {confirmAction === 'reject' && 'Provide an optional reason for rejection.'}
                {confirmAction === 'deactivate' && 'Provide a mandatory reason for this deactivation.'}
                {confirmAction === 'reactivate' && 'This will restore account access for the prosumer.'}
              </p>
              {(confirmAction === 'reject' || confirmAction === 'deactivate') && (
                <textarea value={confirmAction === 'reject' ? rejectReason : deactivateReason} onChange={(e) => confirmAction === 'reject' ? setRejectReason(e.target.value) : setDeactivateReason(e.target.value)} placeholder="Enter reason…" rows={3} className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 resize-none" />
              )}
              <div className="mt-5 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setConfirmAction(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
                <button type="button" onClick={() => applyAction(confirmAction)} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${confirmAction === 'reactivate' ? 'bg-blue-500 hover:bg-blue-600' : confirmAction === 'activate' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
