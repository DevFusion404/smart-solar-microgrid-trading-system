import { motion } from 'framer-motion'
import {
  CircleUserRound,
  Clock,
  Edit3,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  User,
  X,
} from 'lucide-react'
import { useState } from 'react'

// Mock data matching GET /api/profile response for GridOperator
const mockProfile = {
  username: 'alex.ops',
  fullName: 'Alex Fernando',
  email: 'alex.fernando@solargrid.lk',
  phoneNumber: '+94 77 200 3002',
  role: 'GridOperator',
  status: 'Active',
  nic: null,
  address: '18 Flower Road, Colombo 07',
  createdAt: '2024-02-20T08:00:00Z',
  updatedAt: '2026-06-12T10:00:00Z',
  lastLoginAt: '2026-09-14T13:00:00Z',
}

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

export function ProfilePage() {
  const [profile] = useState(mockProfile)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    fullName: profile.fullName,
    phoneNumber: profile.phoneNumber,
    address: profile.address ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const initials = profile.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const formatDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        })
      : 'Never'

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
              <span>Member since {new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Last login: {formatDate(profile.lastLoginAt)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
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
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Edit3 className="h-4 w-4 text-blue-500" />
                <h2 className="font-semibold text-slate-900 dark:text-white">Edit Details</h2>
              </div>
              {[['Full Name', 'fullName', 'text'], ['Phone Number', 'phoneNumber', 'tel']].map(([label, key, type]) => (
                <label key={key} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {label}
                  <input type={type} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} required className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </label>
              ))}
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Address
                <textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 resize-none" />
              </label>
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
              <InfoRow icon={MapPin} label="Address" value={profile.address} />
              <InfoRow icon={Shield} label="Role" value={profile.role} />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
