import {
  BatteryCharging,
  CalendarDays,
  ChevronDown,
  CircleUserRound,
  Cpu,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  Settings2,
  Users,
  Zap,
} from 'lucide-react'

import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'

const navigationGroups = [
  {
    label: 'Prosumer Management',
    icon: Users,
    items: [
      {
        label: 'All Prosumers',
        to: '/backoffice/prosumers',
        end: true,
      },
      {
        label: 'Pending / Reactivation Requests',
        to: '/backoffice/prosumers/requests',
      },
    ],
  },
  {
    label: 'Microgrid Nodes',
    icon: Cpu,
    items: [
      {
        label: 'All Nodes',
        to: '/backoffice/nodes',
        end: true,
      },
      {
        label: 'Add New Node',
        to: '/backoffice/nodes/new',
      },
      {
        label: 'Node Schedules',
        to: '/backoffice/nodes/schedules',
      },
    ],
  },
  {
    label: 'Energy Slots',
    icon: BatteryCharging,
    items: [
      {
        label: 'Slot Management',
        to: '/backoffice/energy-slots',
        end: true,
      },
      {
        label: 'Availability',
        to: '/backoffice/energy-slots/availability',
      },
    ],
  },
  {
    label: 'Reservations',
    icon: CalendarDays,
    items: [
      {
        label: 'All Reservations',
        to: '/backoffice/reservations',
        end: true,
      },
      {
        label: 'Pending Reservations',
        to: '/backoffice/reservations/pending',
      },
      {
        label: 'Reservation History',
        to: '/backoffice/reservations/history',
      },
    ],
  },
]

function getNavItemClass(isActive, collapsed = false) {
  return clsx(
    'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5',
    'text-sm transition-all duration-200',

    collapsed && 'justify-center px-2',

    isActive
      ? 'bg-amber-400/10 font-medium text-amber-400'
      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
  )
}

export function BackOfficeSidebar({
  onLogout,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}) {
  const location = useLocation()
  const navigate = useNavigate()

  const [openGroups, setOpenGroups] = useState({})

  const isGroupActive = (items) =>
    items.some((item) => {
      if (item.end) {
        return location.pathname === item.to
      }

      return location.pathname.startsWith(item.to)
    })

  const isGroupOpen = (group) => {
    return openGroups[group.label] ?? isGroupActive(group.items)
  }

  const handleGroupClick = (group) => {
    // When sidebar is collapsed, clicking an icon should
    // navigate somewhere instead of opening an invisible submenu.
    if (collapsed) {
      navigate(group.items[0].to)

      if (onNavigate) {
        onNavigate()
      }

      return
    }

    setOpenGroups((current) => ({
      ...current,
      [group.label]: !isGroupOpen(group),
    }))
  }

  return (
    <aside
      className={clsx(
        'backoffice-sidebar flex h-screen shrink-0 flex-col',
        'border-r border-slate-800',
        'bg-slate-950',
        'transition-[width] duration-300 ease-in-out',

        collapsed ? 'w-20' : 'w-72'
      )}
    >
      {/* =========================
          LOGO / HEADER
      ========================== */}
      <div
        className={clsx(
          'flex h-20 shrink-0 items-center',
          'border-b border-slate-800',

          collapsed
            ? 'flex-col justify-center gap-1 px-2'
            : 'gap-3 px-5'
        )}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-slate-950">
          <Zap className="h-6 w-6" strokeWidth={2.5} />
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">
              Smart Solar
            </p>

            <p className="truncate text-xs text-slate-400">
              Microgrid Backoffice
            </p>
          </div>
        )}

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={
              collapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
            title={
              collapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
            className={clsx(
              'flex items-center justify-center rounded-lg',
              'text-slate-400 transition',
              'hover:bg-slate-800 hover:text-white',

              collapsed
                ? 'h-7 w-7'
                : 'h-9 w-9'
            )}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* =========================
          NAVIGATION
      ========================== */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-5"
        aria-label="Backoffice navigation"
      >
        {/* Dashboard */}
        <NavLink
          to="/backoffice"
          end
          title={collapsed ? 'Dashboard' : undefined}
          onClick={onNavigate}
          className={({ isActive }) =>
            getNavItemClass(isActive, collapsed)
          }
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />

          {!collapsed && (
            <span className="truncate">
              Dashboard
            </span>
          )}
        </NavLink>

        {/* User Management */}
        <NavLink
          to="/backoffice/users"
          title={collapsed ? 'User Management' : undefined}
          onClick={onNavigate}
          className={({ isActive }) =>
            getNavItemClass(isActive, collapsed)
          }
        >
          <Users className="h-5 w-5 shrink-0" />

          {!collapsed && (
            <span className="truncate">
              User Management
            </span>
          )}
        </NavLink>

        {/* Groups */}
        <div className="mt-3 space-y-1">
          {navigationGroups.map((group) => {
            const Icon = group.icon
            const active = isGroupActive(group.items)
            const open = isGroupOpen(group)

            return (
              <div key={group.label}>
                <button
                  type="button"
                  onClick={() => handleGroupClick(group)}
                  title={collapsed ? group.label : undefined}
                  aria-expanded={!collapsed ? open : undefined}
                  className={clsx(
                    'flex min-h-11 w-full items-center gap-3',
                    'rounded-xl px-3 py-2.5',
                    'text-left text-sm',
                    'transition-all duration-200',

                    collapsed && 'justify-center px-2',

                    active
                      ? 'font-medium text-amber-400'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />

                  {!collapsed && (
                    <>
                      <span className="min-w-0 flex-1 truncate">
                        {group.label}
                      </span>

                      <ChevronDown
                        className={clsx(
                          'h-4 w-4 shrink-0 transition-transform duration-200',
                          open && 'rotate-180'
                        )}
                      />
                    </>
                  )}
                </button>

                {/* Sub Navigation */}
                {!collapsed && open && (
                  <div className="ml-5 mt-1 space-y-1 border-l border-slate-800 pl-3">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          clsx(
                            'block rounded-lg px-3 py-2',
                            'text-sm transition-colors',

                            isActive
                              ? 'bg-amber-400/10 font-medium text-amber-400'
                              : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                          )
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* =========================
          BOTTOM SECTION
      ========================== */}
      <div className="shrink-0 space-y-1 border-t border-slate-800 p-3">
        <NavLink
          to="/backoffice/profile"
          title={collapsed ? 'My Profile' : undefined}
          onClick={onNavigate}
          className={({ isActive }) =>
            getNavItemClass(isActive, collapsed)
          }
        >
          <CircleUserRound className="h-5 w-5 shrink-0" />

          {!collapsed && (
            <span>My Profile</span>
          )}
        </NavLink>

        <NavLink
          to="/backoffice/settings"
          title={collapsed ? 'Settings' : undefined}
          onClick={onNavigate}
          className={({ isActive }) =>
            getNavItemClass(isActive, collapsed)
          }
        >
          <Settings2 className="h-5 w-5 shrink-0" />

          {!collapsed && (
            <span>Settings</span>
          )}
        </NavLink>

        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? 'Logout' : undefined}
          className={clsx(
            'flex min-h-11 w-full items-center gap-3',
            'rounded-xl px-3 py-2.5',
            'text-sm text-slate-400',
            'transition-all duration-200',
            'hover:bg-red-500/10 hover:text-red-400',

            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />

          {!collapsed && (
            <span>Logout</span>
          )}
        </button>
      </div>
    </aside>
  )
}

export function MobileSidebarToggle({ onClick }) {
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