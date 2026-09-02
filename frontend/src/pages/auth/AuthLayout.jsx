import { ArrowLeft, Moon, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

function SolarIllustration() {
  return (
    <div className="relative flex h-full min-h-80 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 p-10">
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="relative w-full max-w-lg">
        <div className="mb-12 flex items-center gap-4">
          <div className="rounded-2xl bg-amber-300 p-3 text-slate-950 shadow-lg shadow-amber-300/20">
            <Sun className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xl font-semibold text-white">SolarGrid</p>
            <p className="text-sm text-blue-200">Smart microgrid trading</p>
          </div>
        </div>

        <div className="relative h-64">
          <div className="absolute left-1/2 top-0 h-28 w-28 -translate-x-1/2 rounded-full bg-amber-300/90 shadow-[0_0_80px_rgba(252,211,77,.7)]" />
          <div className="absolute bottom-6 left-1/2 h-20 w-64 -translate-x-1/2 skew-x-12 rounded-lg border-4 border-cyan-200/70 bg-blue-900/80 shadow-xl shadow-cyan-500/20">
            <div className="grid h-full grid-cols-4 divide-x divide-cyan-200/30">
              <span /><span /><span /><span />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-px w-full bg-cyan-200/50" />
          <div className="absolute bottom-20 left-8 h-px w-20 rotate-12 bg-amber-300" />
          <div className="absolute bottom-20 right-8 h-px w-20 -rotate-12 bg-amber-300" />
          <div className="absolute bottom-16 left-4 h-3 w-3 rounded-full bg-amber-300 shadow-[0_0_16px_#fcd34d]" />
          <div className="absolute bottom-16 right-4 h-3 w-3 rounded-full bg-amber-300 shadow-[0_0_16px_#fcd34d]" />
        </div>

        <p className="max-w-md text-lg leading-relaxed text-blue-100">
          Connect, trade, and optimize renewable energy across your community.
        </p>
      </div>
    </div>
  )
}

export function AuthLayout({ children }) {
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('theme') === 'dark'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.classList.toggle('light', !isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <main className="flex min-h-screen bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <section className="hidden w-1/2 lg:block">
        <SolarIllustration />
      </section>
      <section className="relative flex min-h-screen w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Back to home"
          className="absolute left-6 top-6 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setIsDark((value) => !value)}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="absolute right-6 top-6 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  )
}
