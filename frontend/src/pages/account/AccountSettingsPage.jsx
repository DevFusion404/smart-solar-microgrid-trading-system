/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Identity and Account Management (Component 1)
File          : AccountSettingsPage.jsx
Description   : Shared "Account Settings" page for every role
                (/backoffice/settings, /operator/settings, /prosumer/account).
                Shows the account summary and lets the user change their
                password through POST /api/profile/change-password.
=====================================================
*/

import { motion } from 'framer-motion'
import { CheckCircle2, Eye, EyeOff, KeyRound, RefreshCw, Shield, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { profileService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { validatePassword } from '../../utils/validators'

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' }

const roleLabel = { Backoffice: 'Backoffice Officer', GridOperator: 'Grid Operator', Prosumer: 'Prosumer' }
const statusLabel = {
  Active: 'Active',
  PendingActivation: 'Pending Activation',
  DeactivationRequested: 'Deactivation Requested',
  Deactivated: 'Deactivated',
}

// Formats an ISO date for display, or returns a dash when missing
function formatDate(iso) {
  return iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
}

// One label/value line in the account summary card
function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 text-sm last:border-0 dark:border-slate-800">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-800 dark:text-slate-100">{value}</span>
    </div>
  )
}

// Password input with a show/hide toggle
function PasswordField({ id, label, value, onChange, error, autoComplete }) {
  const [visible, setVisible] = useState(false)
  return (
    <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
      <div className="relative mt-1.5">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          className={`w-full rounded-xl border bg-white px-4 py-2.5 pr-11 text-sm outline-none focus:ring-2 dark:bg-slate-800 dark:text-slate-100 ${error ? 'border-red-400 focus:ring-red-400/20' : 'border-slate-300 focus:border-amber-400 focus:ring-amber-400/20 dark:border-slate-700'}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-600"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <span className="mt-1 block text-xs font-normal text-red-500">{error}</span>}
    </label>
  )
}

// Account settings page: account summary + change password form
export function AccountSettingsPage() {
  const { user, role } = useAuth()
  const [profile, setProfile] = useState(user)
  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Load the latest profile (status, last login) from the API
  useEffect(() => {
    profileService.getProfile().then(setProfile).catch(() => {})
  }, [])

  // Updates one form field and clears its error
  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setFieldErrors((errs) => ({ ...errs, [key]: '' }))
    setSuccess(false)
  }

  // Checks the form locally before calling the API
  const validate = () => {
    const errors = {}
    if (!form.currentPassword) errors.currentPassword = 'Enter your current password.'
    const strength = validatePassword(form.newPassword)
    if (strength) errors.newPassword = strength
    else if (form.newPassword === form.currentPassword) errors.newPassword = 'New password must be different from the current one.'
    if (form.confirmPassword !== form.newPassword) errors.confirmPassword = 'Passwords do not match.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Sends the password change and shows the result
  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setSaving(true)
    try {
      await profileService.changePassword(form)
      setForm(EMPTY_FORM)
      setSuccess(true)
    } catch (err) {
      setServerError(err.message || 'Failed to change password.')
    } finally {
      setSaving(false)
    }
  }

  const accent = role === 'Prosumer' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-amber-400 hover:bg-amber-300 text-slate-950'

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Account Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review your account and keep your password secure.</p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        {/* Account summary */}
        <motion.section initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-2 flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><Shield className="h-4 w-4 text-slate-400" /> Account</h2>
          <SummaryRow label="Username" value={profile?.username ? `@${profile.username}` : '—'} />
          <SummaryRow label="Role" value={roleLabel[profile?.role || role] || role} />
          {profile?.nic && <SummaryRow label="NIC" value={<span className="font-mono">{profile.nic}</span>} />}
          <SummaryRow label="Status" value={statusLabel[profile?.status] || profile?.status || '—'} />
          <SummaryRow label="Member since" value={formatDate(profile?.createdAt)} />
          <SummaryRow label="Last login" value={formatDate(profile?.lastLoginAt)} />
          {role === 'Prosumer' && (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              To close your account, submit a deactivation request from <Link to="/prosumer/profile" className="font-medium text-emerald-600 hover:underline">My Profile</Link>.
            </p>
          )}
        </motion.section>

        {/* Change password */}
        <motion.section initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><KeyRound className="h-4 w-4 text-slate-400" /> Change Password</h2>

          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-400/10 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Password updated. Use the new password next time you log in.
            </div>
          )}
          {serverError && (
            <div role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" /> {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <PasswordField id="current-password" label="Current password" value={form.currentPassword} onChange={setField('currentPassword')} error={fieldErrors.currentPassword} autoComplete="current-password" />
            <PasswordField id="new-password" label="New password" value={form.newPassword} onChange={setField('newPassword')} error={fieldErrors.newPassword} autoComplete="new-password" />
            <PasswordField id="confirm-password" label="Confirm new password" value={form.confirmPassword} onChange={setField('confirmPassword')} error={fieldErrors.confirmPassword} autoComplete="new-password" />
            <p className="text-xs text-slate-400">At least 8 characters, with an uppercase letter, a lowercase letter and a number.</p>
            <button type="submit" disabled={saving} className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${accent}`}>
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {saving ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </motion.section>
      </div>
    </div>
  )
}

export default AccountSettingsPage
