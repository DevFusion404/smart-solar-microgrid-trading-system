import { ArrowLeft, Construction } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const placeholderNames = {
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

export function PlaceholderPage() {
  const location = useLocation()
  const title = placeholderNames[location.pathname] || location.pathname.split('/').filter(Boolean).pop()?.replaceAll('-', ' ') || 'workspace'

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"><Construction className="h-7 w-7" /></span>
        <h1 className="mt-5 text-2xl font-bold capitalize text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">This workspace is ready for your next workflow. Connect it to your data when the backend is available.</p>
        <Link to="/backoffice" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
      </div>
    </div>
  )
}
