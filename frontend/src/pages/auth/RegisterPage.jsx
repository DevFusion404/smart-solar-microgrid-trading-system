import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'

export function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Create your account</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <button type="button" onClick={() => navigate('/login')} className="font-medium text-blue-600 hover:text-blue-700">
            Sign in
          </button>
        </p>
      </div>

      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
        <label className="block text-sm font-medium">
          Full name
          <input type="text" name="name" placeholder="Your name" required className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <label className="block text-sm font-medium">
          Email address
          <input type="email" name="email" placeholder="you@example.com" required className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <label className="block text-sm font-medium">
          Password
          <span className="relative mt-2 block">
            <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Create a password" required className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
          <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600" />
          I agree to the terms and privacy policy.
        </label>
        <button type="submit" className="w-full rounded-xl bg-slate-950 px-4 py-3 font-medium text-white transition hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500">
          Create account
        </button>
      </form>
    </AuthLayout>
  )
}
