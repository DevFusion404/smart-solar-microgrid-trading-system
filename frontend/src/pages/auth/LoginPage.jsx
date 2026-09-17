import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { useAuth } from '../../context/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login({ username, password })
      const userRole = result?.user?.role || result?.role
      
      if (userRole === 'GridOperator') {
        navigate('/operator')
      } else if (userRole === 'Prosumer') {
        navigate('/prosumer/profile')
      } else {
        navigate('/backoffice')
      }
    } catch (err) {
      console.error('Login failed:', err)
      setError(err.message || 'Invalid credentials or server error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Welcome back</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <button type="button" onClick={() => navigate('/register')} className="font-medium text-blue-600 hover:text-blue-700">
            Sign up
          </button>
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium">
          Username
          <input
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <span className="relative mt-2 block">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900"
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </span>
        </label>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <input type="checkbox" name="rememberMe" className="h-4 w-4 rounded border-slate-300 text-blue-600" />
            Remember me
          </label>
          <button type="button" className="font-medium text-blue-600 hover:text-blue-700">Forgot password?</button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-slate-950 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  )
}
