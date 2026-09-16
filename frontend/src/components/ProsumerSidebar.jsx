import {
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  Settings2,
  ShieldAlert,
  Zap,
} from 'lucide-react'
import clsx from 'clsx'
import { NavLink, useNavigate } from 'react-router-dom'
import logoImg from '../assets/logo3.png'

const linkClass = ({ isActive }) =>
  clsx(
    'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
    isActive
      ? 'bg-emerald-400/10 font-medium text-emerald-400'
      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
  )

export function ProsumerSidebar({ collapsed = false, onToggleCollapse, onLogout, onNavigate }) {
  const navigate = useNavigate()

  const collapsedLinkClass = ({ isActive }) =>
    clsx(
      'flex min-h-11 items-center justify-center rounded-xl px-2 py-2.5 text-sm transition-colors',
      isActive
        ? 'bg-emerald-400/10 font-medium text-emerald-400'
        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
    )

  const cls = collapsed ? collapsedLinkClass : linkClass

  return (
    <aside
      className={clsx(
        'prosumer-sidebar relative flex h-screen shrink-0 flex-col border-r border-slate-800 bg-slate-950 transition-[width] duration-300',
        collapsed ? 'w-20' : 'w-72'
      )}
    >
      {/* Header */}
      <div
        className={clsx(
          'relative flex h-20 shrink-0 items-center border-b border-slate-800',
          collapsed ? 'justify-center' : 'gap-3 px-5'
        )}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 p-1 ring-1 ring-emerald-500/30">
          <img src={logoImg} alt="Smart Solar Logo" className="h-full w-full object-contain" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">Smart Solar</p>
            <p className="truncate text-xs text-slate-400">My Account</p>
          </div>
        )}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={clsx(
              'rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white',
              collapsed ? 'absolute bottom-1 right-1' : 'ml-auto'
            )}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1" aria-label="Prosumer navigation">
        <NavLink
          to="/prosumer"
          end
          className={cls}
          onClick={onNavigate}
          title={collapsed ? 'Dashboard' : undefined}
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        <NavLink
          to="/prosumer/profile"
          className={cls}
          onClick={onNavigate}
          title={collapsed ? 'My Profile' : undefined}
        >
          <CircleUserRound className="h-5 w-5 shrink-0" />
          {!collapsed && <span>My Profile</span>}
        </NavLink>

        <NavLink
          to="/prosumer/account"
          className={cls}
          onClick={onNavigate}
          title={collapsed ? 'Account Settings' : undefined}
        >
          <ShieldAlert className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Account Settings</span>}
        </NavLink>

        <NavLink
          to="/prosumer/settings"
          className={cls}
          onClick={onNavigate}
          title={collapsed ? 'Preferences' : undefined}
        >
          <Settings2 className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Preferences</span>}
        </NavLink>
      </nav>

      {/* Bottom */}
      <div className="space-y-1 border-t border-slate-800 p-3">
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? 'Logout' : undefined}
          className={clsx(
            'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-red-400/10 hover:text-red-300',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}

export function ProsumerMobileToggle({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open navigation"
      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
    >
      <PanelLeft className="h-5 w-5" />
    </button>
  )
}
