import { Bell, ChevronDown, Moon, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { ProsumerSidebar, ProsumerMobileToggle } from '../ProsumerSidebar'
import { IconButton } from '../common/IconButton'
import { useAuth } from '../../context/AuthContext'

const pageNames = {
  '/prosumer': 'Dashboard',
  '/prosumer/profile': 'My Profile',
  '/prosumer/account': 'Account Settings',
  '/prosumer/settings': 'Preferences',
}

function ProsumerHeader({ onOpenMenu, isDark, onToggleTheme }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const title = pageNames[location.pathname] ?? 'My Portal'

  const fullName = user?.fullName || 'Prosumer'
  const roleName = user?.role || 'Prosumer'
  const initials = fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'PR'

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex min-w-0 items-center gap-3">
        <div className="xl:hidden">
          <ProsumerMobileToggle onClick={onOpenMenu} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-slate-950 dark:text-white">{title}</p>
          <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
            Smart Solar Microgrid — Prosumer Portal
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3">
        <IconButton label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={onToggleTheme}>
          {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </IconButton>
        <IconButton label="Notifications" className="relative">
          <Bell className="h-[18px] w-[18px]" />
        </IconButton>
        <div className="ml-1 hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-800" />
        <button
          type="button"
          onClick={() => navigate('/prosumer/profile')}
          className="flex items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
            {initials}
          </span>
          <span className="hidden text-sm sm:block">
            <span className="block font-medium text-slate-800 dark:text-slate-100">{fullName}</span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">{roleName}</span>
          </span>
          <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
        </button>
      </div>
    </header>
  )
}

export function ProsumerLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('prosumer-sidebar-collapsed') === 'true'
  )
  const [isDark, setIsDark] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark'
  )
  const navigate = useNavigate()
  const { logout: authLogout } = useAuth()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.classList.toggle('light', !isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const logout = async () => {
    await authLogout()
    navigate('/login')
  }
  const toggleSidebar = () => {
    setSidebarCollapsed((c) => {
      localStorage.setItem('prosumer-sidebar-collapsed', String(!c))
      return !c
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-200 xl:block',
          sidebarCollapsed ? 'w-20' : 'w-72'
        )}
      >
        <ProsumerSidebar
          onLogout={logout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      </div>

      {/* Mobile overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-slate-950/50"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative h-full w-72 shadow-2xl">
            <ProsumerSidebar onLogout={logout} onNavigate={() => setMenuOpen(false)} />
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-5 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className={clsx(
          'min-w-0 transition-[margin] duration-200',
          sidebarCollapsed ? 'xl:ml-20' : 'xl:ml-72'
        )}
      >
        <ProsumerHeader
          onOpenMenu={() => setMenuOpen(true)}
          isDark={isDark}
          onToggleTheme={() => setIsDark((v) => !v)}
        />
        <main className="mx-auto w-full max-w-[1400px] p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
