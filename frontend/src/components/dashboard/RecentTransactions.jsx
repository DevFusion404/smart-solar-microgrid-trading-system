import { ArrowRight, MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { recentReservations } from '../../data/dashboardMockData'
import { IconButton } from '../common/IconButton'
import { Panel, SectionHeading } from '../common/Panel'
import { StatusBadge } from '../common/StatusBadge'

export function RecentReservations() {
  return (
    <Panel className="overflow-hidden">
      <div className="p-5 pb-3 md:p-6 md:pb-4">
        <SectionHeading
          title="Recent reservations"
          description="Latest slot bookings across the network"
          action={<Link to="/backoffice/reservations/history" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">View all <ArrowRight className="h-3.5 w-3.5" /></Link>}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-y border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:bg-slate-950/40">
            <tr>
              <th className="px-5 py-3 font-medium md:px-6">Reservation</th>
              <th className="px-3 py-3 font-medium">Prosumer</th>
              <th className="px-3 py-3 font-medium">Node</th>
              <th className="px-3 py-3 font-medium">Slot</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium md:px-6"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentReservations.map((reservation) => (
              <tr key={reservation.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <td className="px-5 py-3.5 md:px-6">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">{reservation.id}</p>
                    <p className="text-xs text-slate-400">{reservation.date}</p>
                  </div>
                </td>
                <td className="px-3 py-3.5 text-slate-700 dark:text-slate-200">{reservation.prosumer}</td>
                <td className="px-3 py-3.5 text-slate-600 dark:text-slate-300">{reservation.node}</td>
                <td className="px-3 py-3.5 text-slate-600 dark:text-slate-300">{reservation.slot}</td>
                <td className="px-3 py-3.5"><StatusBadge status={reservation.status} /></td>
                <td className="px-5 py-3.5 text-right md:px-6"><IconButton label={`Open ${reservation.id}`}><MoreHorizontal className="h-4 w-4" /></IconButton></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

export function RecentTransactions() {
  return <RecentReservations />
}
