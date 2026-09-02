import { Bell, ChevronDown, Moon, Search, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { BackOfficeSidebar, MobileSidebarToggle } from '../BackOfficeSidebar'
import { IconButton } from '../common/IconButton'

const pageNames = {
  '/backoffice': 'Dashboard',
  '/backoffice/users': 'User Management',
  '/backoffice/prosumers': 'All Prosumers',
  '/backoffice/prosumers/requests': 'Reactivation Requests',
  '/backoffice/nodes': 'Microgrid Nodes',
  '/backoffice/nodes/new': 'Add New Node',
  '/backoffice/nodes/schedules': 'Node Schedules',
  '/backoffice/energy-slots': 'Energy Slots',
  '/backoffice/energy-slots/availability': 'Energy Availability',
  '/backoffice/reservations': 'Reservations',
  '/backoffice/reservations/pending': 'Pending Reservations',
  '/backoffice/reservations/history': 'Reservation History',
  '/backoffice/profile': 'My Profile',
  '/backoffice/settings': 'Settings',
}

function DashboardHeader({ onOpenMenu, isDark, onToggleTheme }) {
  const location = useLocation()
  const navigate = useNavigate()
  const title = pageNames[location.pathname] || 'Back office'

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex min-w-0 items-center gap-3">
        <div className="xl:hidden">
          <MobileSidebarToggle onClick={onOpenMenu} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-slate-950 dark:text-white">{title}</p>
          <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">Monitor your energy network at a glance</p>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-3">
        <label className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 lg:flex dark:border-slate-800 dark:bg-slate-900">
          <Search className="h-4 w-4 text-slate-400" />
          <input aria-label="Search dashboard" className="w-44 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-200" placeholder="Search anything..." />
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
        <button type="button" onClick={() => navigate('/backoffice/profile')} className="flex items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-amber-400 dark:text-slate-950">JD</span>
          <span className="hidden text-sm sm:block">
            <span className="block font-medium text-slate-800 dark:text-slate-100">Jordan Davis</span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">Administrator</span>
          </span>
          <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
        </button>
      </div>
    </header>
  )
}

export function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true')
  const [isDark, setIsDark] = useState(() => typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark')
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.classList.toggle('light', !isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const logout = () => navigate('/login')
  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      localStorage.setItem('sidebar-collapsed', String(!collapsed))
      return !collapsed
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className={clsx('fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-200 xl:block', sidebarCollapsed ? 'w-20' : 'w-72')}>
        <BackOfficeSidebar onLogout={logout} collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-40 xl:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button type="button" aria-label="Close navigation overlay" className="absolute inset-0 bg-slate-950/50" onClick={() => setMenuOpen(false)} />
          <div className="relative h-full w-72 shadow-2xl">
            <BackOfficeSidebar onLogout={logout} onNavigate={() => setMenuOpen(false)} />
            <button type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="absolute right-3 top-5 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      <div className={clsx('min-w-0 transition-[margin] duration-200', sidebarCollapsed ? 'xl:ml-20' : 'xl:ml-72')}>
        <DashboardHeader onOpenMenu={() => setMenuOpen(true)} isDark={isDark} onToggleTheme={() => setIsDark((value) => !value)} />
        <main className="mx-auto w-full max-w-[1600px] p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
