import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { prosumerService } from '../../services'

export function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    nic: '',
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '',
    address: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await prosumerService.registerProsumer(formData)
      setSuccess(true)
    } catch (err) {
      console.error('Registration failed:', err)
      setError(err.message || 'Registration failed. Please check your inputs and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center py-6">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Registration Submitted!</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
            Your prosumer account has been registered with status <strong className="text-amber-600 dark:text-amber-400">Pending Activation</strong>. It is now awaiting review by the Backoffice team.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            Go to Sign In
          </button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold">Create your account</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <button type="button" onClick={() => navigate('/login')} className="font-medium text-blue-600 hover:text-blue-700">
            Sign in
          </button>
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            NIC Number
            <input
              type="text"
              name="nic"
              value={formData.nic}
              onChange={handleChange}
              placeholder="e.g. 981234567V"
              required
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <label className="block text-sm font-medium">
            Username
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. kasun.silva"
              required
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
        </div>

        <label className="block text-sm font-medium">
          Full Name
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Kasun Silva"
            required
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Email address
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <label className="block text-sm font-medium">
            Phone Number
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+94 77 111 2222"
              required
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
        </div>

        <label className="block text-sm font-medium">
          Address
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="No. 15, Park Road, Colombo 05"
            required
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <label className="block text-sm font-medium">
          Password
          <span className="relative mt-1.5 block">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-12 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900"
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </span>
        </label>

        <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
          <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600" />
          I agree to the terms and privacy policy.
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-slate-950 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          {loading ? 'Creating account…' : 'Create prosumer account'}
        </button>
      </form>
    </AuthLayout>
  )
}
