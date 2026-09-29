import { ArrowRight, Eye, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Panel, SectionHeading } from '../common/Panel'
import { StatusBadge } from '../common/StatusBadge'

function formatReservationDate(val) {
  if (!val) return '—'
  const d = new Date(val)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function RecentReservations({ reservations = [], loading = false }) {
  const sorted = [...reservations]
    .sort((a, b) => new Date(b.createdAt || b.slotDate || 0) - new Date(a.createdAt || a.slotDate || 0))
    .slice(0, 5)

  return (
    <Panel className="overflow-hidden">
      <div className="p-5 pb-3 md:p-6 md:pb-4">
        <SectionHeading
          title="Recent reservations"
          description="Latest slot bookings across the microgrid"
          action={
            <Link
              to="/backoffice/energy-slots/reservations"
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-y border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:bg-slate-950/40">
            <tr>
              <th className="px-5 py-3 font-medium md:px-6">Reservation</th>
              <th className="px-3 py-3 font-medium">Prosumer</th>
              <th className="px-3 py-3 font-medium">Station</th>
              <th className="px-3 py-3 font-medium">Slot & Energy</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium md:px-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-slate-400">
                  <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin opacity-50" />
                  Loading recent reservations…
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-slate-400">
                  No reservations recorded yet.
                </td>
              </tr>
            ) : (
              sorted.map((reservation) => {
                const startTimeStr = reservation.startTime ? String(reservation.startTime).slice(0, 5) : ''
                const endTimeStr = reservation.endTime ? String(reservation.endTime).slice(0, 5) : ''
                const timeWindow = startTimeStr && endTimeStr ? `${startTimeStr} – ${endTimeStr}` : 'Scheduled'

                return (
                  <tr
                    key={reservation.reservationId || reservation.id}
                    className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-3.5 md:px-6">
                      <div>
                        <p className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
                          {reservation.reservationId}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatReservationDate(reservation.createdAt || reservation.slotDate)}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="font-medium text-slate-800 dark:text-slate-100">
                        {reservation.prosumerName || reservation.prosumerNic || 'Prosumer'}
                      </p>
                      {reservation.prosumerNic && (
                        <p className="font-mono text-[11px] text-slate-400">{reservation.prosumerNic}</p>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-slate-600 dark:text-slate-300">
                      <p className="truncate font-medium">{reservation.stationName || reservation.stationId || '—'}</p>
                      <p className="font-mono text-[11px] text-slate-400">{reservation.stationId}</p>
                    </td>
                    <td className="px-3 py-3.5 text-slate-600 dark:text-slate-300">
                      <p className="text-xs font-medium">{timeWindow}</p>
                      <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        {reservation.reservedCapacity || 0} kWh
                      </p>
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={reservation.status || 'Pending'} />
                    </td>
                    <td className="px-5 py-3.5 text-right md:px-6">
                      <Link
                        to={`/backoffice/energy-slots/reservations/${encodeURIComponent(reservation.reservationId)}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        title="View reservation"
                      >
                        <Eye className="h-3.5 w-3.5" /> Details
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

export function RecentTransactions(props) {
  return <RecentReservations {...props} />
}
