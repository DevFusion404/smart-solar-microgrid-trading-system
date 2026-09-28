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
  QrCode,
  Settings2,
} from 'lucide-react'

import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import logoImg from '../assets/logo3.png'

const navigationGroups = [
  {
    label: 'Energy Transfers',
    icon: QrCode,
    items: [
      {
        label: 'Transfer Dashboard',
        to: '/operator/transfers',
        end: true,
      },
      {
        label: 'Scan QR Code',
        to: '/operator/transfers/scan',
      },
    ],
  },
  {
    label: 'Reservations',
    icon: CalendarDays,
    items: [
      {
        label: 'All Reservations',
        to: '/operator/reservations',
        end: true,
      },
      {
        label: 'Pending Reservations',
        to: '/operator/reservations/pending',
      },
      {
        label: "Today's Bookings",
        to: '/operator/reservations/today',
      },
    ],
  },
  {
    label: 'Energy Slots',
    icon: BatteryCharging,
    items: [
      {
        label: 'Slot Availability',
        to: '/operator/energy-slots',
        end: true,
      },
      {
        label: 'Update Availability',
        to: '/operator/energy-slots/update',
      },
    ],
  },
  {
    label: 'Microgrid Nodes',
    icon: Cpu,
    items: [
      {
        label: 'Assigned / Available Nodes',
        to: '/operator/nodes',
        end: true,
      },
      {
        label: 'Node Details',
        to: '/operator/nodes/details',
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

export function OperatorSidebar({
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
        'operator-sidebar flex h-screen shrink-0 flex-col',
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
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 p-1 ring-1 ring-amber-400/30">
          <img src={logoImg} alt="Smart Solar Logo" className="h-full w-full object-contain" />
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">
              Smart Solar
            </p>

            <p className="truncate text-xs text-slate-400">
              Microgrid Operator
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
        aria-label="Grid operator navigation"
      >
        {/* Dashboard */}
        <NavLink
          to="/operator"
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

        {/* Booking History */}
        <div className="mt-1">
          <NavLink
            to="/operator/history"
            title={collapsed ? 'Booking History' : undefined}
            onClick={onNavigate}
            className={({ isActive }) =>
              getNavItemClass(isActive, collapsed)
            }
          >
            <CalendarCheck2 className="h-5 w-5 shrink-0" />

            {!collapsed && (
              <span className="truncate">
                Booking History
              </span>
            )}
          </NavLink>
        </div>
      </nav>

      {/* =========================
          BOTTOM SECTION
      ========================== */}
      <div className="shrink-0 space-y-1 border-t border-slate-800 p-3">
        <NavLink
          to="/operator/profile"
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
          to="/operator/settings"
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
