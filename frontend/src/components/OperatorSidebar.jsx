import {
  BatteryCharging,
  CalendarCheck2,
  CalendarDays,
  ChevronDown,
  CircleUserRound,
  Cpu,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  Settings2,
  Zap,
} from 'lucide-react'
import clsx from 'clsx'
import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

const groups = [
  {
    label: 'Reservations',
    icon: CalendarDays,
    items: [
      ['All Reservations', '/operator/reservations'],
      ['Pending Reservations', '/operator/reservations/pending'],
      ["Today's Bookings", '/operator/reservations/today'],
    ],
  },
  {
    label: 'Energy Slots',
    icon: BatteryCharging,
    items: [
      ['Slot Availability', '/operator/energy-slots'],
      ['Update Availability', '/operator/energy-slots/update'],
    ],
  },
  {
    label: 'Microgrid Nodes',
    icon: Cpu,
    items: [
      ['Assigned / Available Nodes', '/operator/nodes'],
      ['Node Details', '/operator/nodes/details'],
    ],
  },
]

const linkClass = ({ isActive }) => clsx(
  'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
  isActive
    ? 'bg-amber-400/10 font-medium text-amber-400'
    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white',
)

export function OperatorSidebar({ collapsed = false, onToggleCollapse, onLogout, onNavigate }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [openGroups, setOpenGroups] = useState({})

  return (
    <aside className={clsx(
      'operator-sidebar relative flex h-screen shrink-0 flex-col border-r border-slate-800 bg-slate-950 transition-[width] duration-300',
      collapsed ? 'w-20' : 'w-72',
    )}>
      <div className={clsx('relative flex h-20 shrink-0 items-center border-b border-slate-800', collapsed ? 'justify-center' : 'gap-3 px-5')}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-slate-950">
          <Zap className="h-6 w-6" strokeWidth={2.5} />
        </div>
        {!collapsed && <div className="min-w-0"><p className="truncate text-sm font-bold text-white">Smart Solar</p><p className="truncate text-xs text-slate-400">Microgrid Operator</p></div>}
        {onToggleCollapse && <button type="button" onClick={onToggleCollapse} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className={clsx('rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white', collapsed ? 'absolute bottom-1 right-1' : 'ml-auto')}>
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Grid operator navigation">
        <NavLink to="/operator" end className={clsx(linkClass, collapsed && 'justify-center px-2')} onClick={onNavigate} title={collapsed ? 'Dashboard' : undefined}>
          <LayoutDashboard className="h-5 w-5 shrink-0" />{!collapsed && <span>Dashboard</span>}
        </NavLink>
        <div className="mt-3 space-y-1">
          {groups.map((group) => {
            const Icon = group.icon
            const active = group.items.some(([, to]) => location.pathname.startsWith(to))
            const open = openGroups[group.label] ?? active
            return <div key={group.label}>
              <button type="button" onClick={() => collapsed ? navigate(group.items[0][1]) : setOpenGroups((current) => ({ ...current, [group.label]: !open }))} aria-expanded={!collapsed ? open : undefined} title={collapsed ? group.label : undefined} className={clsx('flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors', collapsed && 'justify-center px-2', active ? 'font-medium text-amber-400' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white')}>
                <Icon className="h-5 w-5 shrink-0" />{!collapsed && <><span className="min-w-0 flex-1 truncate">{group.label}</span><ChevronDown className={clsx('h-4 w-4 transition-transform', open && 'rotate-180')} /></>}
              </button>
              {open && !collapsed && <div className="ml-4 border-l border-slate-800 pl-3">{group.items.map(([label, to]) => <NavLink key={to} to={to} className={linkClass} onClick={onNavigate}>{label}</NavLink>)}</div>}
            </div>
          })}
        </div>
        <NavLink to="/operator/history" className={clsx(linkClass, 'mt-1', collapsed && 'justify-center px-2')} onClick={onNavigate} title={collapsed ? 'Booking History' : undefined}>
          <CalendarCheck2 className="h-5 w-5 shrink-0" />{!collapsed && <span>Booking History</span>}
        </NavLink>
      </nav>

      <div className="space-y-1 border-t border-slate-800 p-3">
        <NavLink to="/operator/profile" className={clsx(linkClass, collapsed && 'justify-center px-2')} onClick={onNavigate} title={collapsed ? 'My Profile' : undefined}><CircleUserRound className="h-5 w-5 shrink-0" />{!collapsed && <span>My Profile</span>}</NavLink>
        <NavLink to="/operator/settings" className={clsx(linkClass, collapsed && 'justify-center px-2')} onClick={onNavigate} title={collapsed ? 'Settings' : undefined}><Settings2 className="h-5 w-5 shrink-0" />{!collapsed && <span>Settings</span>}</NavLink>
        <button type="button" onClick={onLogout} title={collapsed ? 'Logout' : undefined} className={clsx('flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-red-400/10 hover:text-red-300', collapsed && 'justify-center px-2')}><LogOut className="h-5 w-5 shrink-0" />{!collapsed && <span>Logout</span>}</button>
      </div>
    </aside>
  )
}
