import { Bell, ChevronDown, Moon, PanelLeft, Sun, X } from 'lucide-react'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { OperatorSidebar } from '../OperatorSidebar'

export function OperatorLayout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('operator-sidebar-collapsed') === 'true')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); document.documentElement.classList.toggle('light', !dark); localStorage.setItem('theme', dark ? 'dark' : 'light') }, [dark])
  const toggle = () => setCollapsed((value) => { localStorage.setItem('operator-sidebar-collapsed', String(!value)); return !value })
  const title = location.pathname === '/operator' ? 'Dashboard' : 'Grid Operator'
  return <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <div className={clsx('fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-300 xl:block', collapsed ? 'w-20' : 'w-72')}><OperatorSidebar collapsed={collapsed} onToggleCollapse={toggle} onLogout={() => navigate('/login')} /></div>
    {mobileOpen && <div className="fixed inset-0 z-40 xl:hidden"><button type="button" aria-label="Close navigation overlay" className="absolute inset-0 bg-slate-950/50" onClick={() => setMobileOpen(false)} /><div className="relative h-full w-72"><OperatorSidebar onLogout={() => navigate('/login')} onNavigate={() => setMobileOpen(false)} /><button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="absolute right-3 top-5 rounded-lg p-2 text-slate-400"><X className="h-5 w-5" /></button></div></div>}
    <div className={clsx('min-w-0 transition-[margin] duration-300', collapsed ? 'xl:ml-20' : 'xl:ml-72')}><header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8 dark:border-slate-800 dark:bg-slate-950/90"><div className="flex items-center gap-3"><button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="rounded-lg p-2 text-slate-500 xl:hidden"><PanelLeft className="h-5 w-5" /></button><div><p className="text-lg font-semibold text-slate-950 dark:text-white">{title}</p><p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">Operate your assigned microgrid network</p></div></div><div className="flex items-center gap-2"><button type="button" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setDark((value) => !value)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">{dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button><button type="button" aria-label="Notifications" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Bell className="h-5 w-5" /></button><button type="button" onClick={() => navigate('/operator/profile')} className="hidden items-center gap-2 rounded-xl p-1.5 text-left hover:bg-slate-100 sm:flex dark:hover:bg-slate-800"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">AO</span><span><span className="block text-sm font-medium text-slate-800 dark:text-slate-100">Alex Operator</span><span className="block text-[11px] text-slate-500 dark:text-slate-400">Grid Operator</span></span><ChevronDown className="h-4 w-4 text-slate-400" /></button></div></header><main className="mx-auto w-full max-w-[1600px] p-4 md:p-8"><Outlet /></main></div>
  </div>
}
