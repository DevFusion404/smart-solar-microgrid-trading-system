import { Bell, ChevronDown, Moon, Search, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { OperatorSidebar, MobileSidebarToggle } from '../OperatorSidebar'
import { IconButton } from '../common/IconButton'
import logoImg from '../../assets/logo3.png'
import { useAuth } from '../../context/AuthContext'

const pageNames = {
  '/operator': 'Dashboard',
  '/operator/reservations': 'All Reservations',
  '/operator/reservations/pending': 'Pending Reservations',
  '/operator/reservations/today': "Today's Bookings",
  '/operator/energy-slots': 'Slot Availability',
  '/operator/energy-slots/update': 'Update Availability',
  '/operator/nodes': 'Assigned / Available Nodes',
  '/operator/nodes/details': 'Node Details',
  '/operator/history': 'Booking History',
  '/operator/profile': 'My Profile',
  '/operator/prosumers': 'Prosumer Directory',
  '/operator/settings': 'Settings',
}

function OperatorHeader({ onOpenMenu, isDark, onToggleTheme }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const title = pageNames[location.pathname] || 'Grid Operator'

  const fullName = user?.fullName || 'Grid Operator'
  const roleName = user?.role || 'Operator'
  const initials = fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'GO'

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex min-w-0 items-center gap-3">
        <div className="xl:hidden">
          <MobileSidebarToggle onClick={onOpenMenu} />
        </div>
        <img src={logoImg} alt="Smart Solar" className="h-9 w-9 shrink-0 rounded-xl object-contain bg-amber-400/10 p-1 ring-1 ring-amber-400/30 xl:hidden" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-slate-950 dark:text-white">{title}</p>
          <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">Operate and monitor your assigned microgrid network</p>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-3">
        <label className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 lg:flex dark:border-slate-800 dark:bg-slate-900">
          <Search className="h-4 w-4 text-slate-400" />
          <input aria-label="Search operator portal" className="w-44 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-200" placeholder="Search anything..." />
          <kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-slate-700">⌘ K</kbd>
        </label>
        <IconButton label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={onToggleTheme}>
          {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </IconButton>
        <IconButton label="Notifications" className="relative">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-rose-500 dark:border-slate-950" />
        </IconButton>
        <div className="ml-1 hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-800" />
        <button type="button" onClick={() => navigate('/operator/profile')} className="flex items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">{initials}</span>
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

export function OperatorLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('operator-sidebar-collapsed') === 'true')
  const [isDark, setIsDark] = useState(() => typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark')
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
    setSidebarCollapsed((collapsed) => {
      localStorage.setItem('operator-sidebar-collapsed', String(!collapsed))
      return !collapsed
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className={clsx('fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-200 xl:block', sidebarCollapsed ? 'w-20' : 'w-72')}>
        <OperatorSidebar onLogout={logout} collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-40 xl:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button type="button" aria-label="Close navigation overlay" className="absolute inset-0 bg-slate-950/50" onClick={() => setMenuOpen(false)} />
          <div className="relative h-full w-72 shadow-2xl">
            <OperatorSidebar onLogout={logout} onNavigate={() => setMenuOpen(false)} />
            <button type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="absolute right-3 top-5 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      <div className={clsx('min-w-0 transition-[margin] duration-200', sidebarCollapsed ? 'xl:ml-20' : 'xl:ml-72')}>
        <OperatorHeader onOpenMenu={() => setMenuOpen(true)} isDark={isDark} onToggleTheme={() => setIsDark((value) => !value)} />
        <main className="mx-auto w-full max-w-[1600px] p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
