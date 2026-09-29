/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Identity and Account Management (Component 1)
File          : CreateProsumerPage.jsx
Description   : Backoffice form to create a prosumer account on behalf
                of a customer (POST /api/prosumers). NIC is the unique
                business key; the API rejects duplicates with 409.
                Accounts created here are Active immediately because the
                officer has already verified the customer.
=====================================================
*/

import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, CheckCircle2, RefreshCw, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { prosumerService } from '../../services'
import { validateProsumerForm } from '../../utils/validators'

const EMPTY_FORM = { nic: '', fullName: '', username: '', email: '', phoneNumber: '', address: '', password: '' }

const FIELDS = [
  { key: 'nic', label: 'NIC Number', type: 'text', placeholder: '981234567V or 199812345678', mono: true },
  { key: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Kasun Silva' },
  { key: 'username', label: 'Username', type: 'text', placeholder: 'kasun_silva' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'kasun@example.com' },
  { key: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: '0771234567' },
  { key: 'password', label: 'Temporary Password', type: 'password', placeholder: 'e.g. Solar2026' },
]

// Backoffice page for creating an Active prosumer account
export function CreateProsumerPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)
  const [created, setCreated] = useState(null)

  // Updates one field and clears its error message
  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((errs) => ({ ...errs, [key]: '' }))
  }

  // Validates locally, then creates the account through the API
  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const found = validateProsumerForm(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    try {
      const result = await prosumerService.createProsumer({ ...form, nic: form.nic.trim().toUpperCase() })
      setCreated(result)
      setForm(EMPTY_FORM)
    } catch (err) {
      // Map API field errors (e.g. { nic: [...] }) onto the form, and show the main message
      if (err.validationErrors) {
        setErrors(Object.fromEntries(Object.entries(err.validationErrors).map(([k, v]) => [k, Array.isArray(v) ? v.join(' ') : v])))
      }
      setServerError(err.message || 'Failed to create prosumer.')
    } finally {
      setSaving(false)
    }
  }

  // Returns the classes for an input, highlighting it when it has an error
  const inputClass = (key, mono) =>
    `mt-1.5 w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 dark:bg-slate-800 dark:text-slate-100 ${mono ? 'font-mono' : ''} ${errors[key] ? 'border-red-400 focus:ring-red-400/20' : 'border-slate-300 focus:border-amber-400 focus:ring-amber-400/20 dark:border-slate-700'}`

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/backoffice/prosumers')} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">New Prosumer</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create an account for a verified customer. It will be active immediately.</p>
        </div>
      </motion.div>

      {created && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-400/10 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Created <strong>{created.fullName}</strong> (NIC <span className="font-mono">{created.nic}</span>) — status {created.status}.</span>
          <button type="button" onClick={() => navigate(`/backoffice/prosumers/${encodeURIComponent(created.nic)}`)} className="ml-auto rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600">
            View profile
          </button>
        </motion.div>
      )}

      {serverError && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" /> {serverError}
        </div>
      )}

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        noValidate
        className="max-w-3xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map(({ key, label, type, placeholder, mono }) => (
            <label key={key} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {label}
              <input type={type} value={form[key]} onChange={setField(key)} placeholder={placeholder} autoComplete="off" className={inputClass(key, mono)} />
              {errors[key] && <span className="mt-1 block text-xs font-normal text-red-500">{errors[key]}</span>}
            </label>
          ))}
        </div>

        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Address
          <textarea value={form.address} onChange={setField('address')} rows={2} placeholder="No. 15, Park Road, Colombo 05" className={`${inputClass('address')} resize-none`} />
          {errors.address && <span className="mt-1 block text-xs font-normal text-red-500">{errors.address}</span>}
        </label>

        <p className="text-xs text-slate-400">Share the temporary password with the prosumer and ask them to change it under Account Settings after first login.</p>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {saving ? 'Creating…' : 'Create Prosumer'}
          </button>
          <button type="button" onClick={() => { setForm(EMPTY_FORM); setErrors({}); setServerError('') }} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Clear
          </button>
        </div>
      </motion.form>
    </div>
  )
}

export default CreateProsumerPage
