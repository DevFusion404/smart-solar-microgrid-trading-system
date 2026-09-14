import { ArrowRight, BatteryCharging, CalendarCheck2, CalendarDays, CheckCircle2, Clock3, Plus, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Panel, SectionHeading } from '../../components/common/Panel'
import { StatusBadge } from '../../components/common/StatusBadge'
import { reservationRows, TODAY_FULL_LABEL } from './reservationData'

const summaryCards = [
  { label: 'Available energy slots', value: '18', note: 'Across 6 microgrid nodes', icon: BatteryCharging, accent: 'amber' },
  { label: 'Pending reservations', value: '5', note: '2 need attention today', icon: Clock3, accent: 'blue' },
  { label: 'Approved future reservations', value: '8', note: 'Next 7 days', icon: CheckCircle2, accent: 'emerald' },
  { label: "Today's reservations", value: '4', note: '1,250 kWh scheduled', icon: CalendarCheck2, accent: 'violet' },
]

const accentStyles = {
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
}

function SummaryCard({ card, index }) {
  const Icon = card.icon

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: index * 0.06 }}>
      <Panel className="h-full p-5">
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentStyles[card.accent]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Live</span>
        </div>
        <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{card.value}</p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{card.note}</p>
      </Panel>
    </motion.div>
  )
}

export function EnergySlotDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Zap className="h-3.5 w-3.5" /> Energy slot operations
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl dark:text-white">Energy Slot Management Dashboard</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Keep availability visible, reservations moving, and every node ready for the next booking.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <CalendarDays className="h-4 w-4 text-slate-400" /> {TODAY_FULL_LABEL}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card, index) => <SummaryCard key={card.label} card={card} index={index} />)}
      </div>

      <Panel className="overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800 md:px-6">
          <SectionHeading
            title="Recent reservations"
            description="The latest activity across your energy slot network."
            action={<Link to="/backoffice/energy-slots/reservations" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">View all <ArrowRight className="h-3.5 w-3.5" /></Link>}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5 md:px-6">Reservation ID</th>
                <th className="px-3 py-3.5">Prosumer NIC</th>
                <th className="px-3 py-3.5">Microgrid node</th>
                <th className="px-3 py-3.5">Reservation date</th>
                <th className="px-3 py-3.5">Time slot</th>
                <th className="px-3 py-3.5">Status</th>
                {/* <th className="px-5 py-3.5 text-right md:px-6">Action</th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reservationRows.slice(0, 5).map((reservation) => (
                <tr key={reservation.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                  <td className="px-5 py-4 font-semibold text-slate-800 md:px-6 dark:text-slate-200">{reservation.id}</td>
                  <td className="px-3 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{reservation.nic}</td>
                  <td className="px-3 py-4 text-slate-600 dark:text-slate-300">{reservation.node}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{reservation.date}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{reservation.time}</td>
                  <td className="px-3 py-4"><StatusBadge status={reservation.status} /></td>
                  {/* <td className="px-5 py-4 text-right md:px-6">
                    <Link to="/backoffice/energy-slots/reservations" title="Open reservations" aria-label={`Open reservations for ${reservation.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-400/10 dark:hover:text-blue-300">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
        <Panel className="p-5 md:p-6">
          <SectionHeading title="Upcoming reservations by node" description="Confirmed energy demand for the next 48 hours." />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ['Colombo Solar Hub', '6 reservations', '720 kWh', 'bg-amber-400'],
              ['Kandy Energy Station', '4 reservations', '480 kWh', 'bg-blue-500'],
              ['Galle Solar Hub', '3 reservations', '350 kWh', 'bg-emerald-500'],
              ['Jaffna Microgrid', '2 reservations', '220 kWh', 'bg-violet-500'],
            ].map(([node, bookings, energy, dot]) => (
              <div key={node} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5 dark:border-slate-800">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{node}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{bookings}</p></div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{energy}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="p-5 md:p-6">
          <SectionHeading title="Quick actions" description="Move the next workflow forward." />
          <div className="mt-5 space-y-3">
            <Link to="/backoffice/energy-slots/manage" className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50/70 dark:border-slate-800 dark:text-slate-200 dark:hover:border-amber-400/40 dark:hover:bg-amber-400/5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"><Plus className="h-4 w-4" /></span>
              <span className="flex-1">Manage energy slots</span><ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link to="/backoffice/energy-slots/reservations" className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/70 dark:border-slate-800 dark:text-slate-200 dark:hover:border-blue-400/40 dark:hover:bg-blue-400/5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300"><CalendarCheck2 className="h-4 w-4" /></span>
              <span className="flex-1">View all reservations</span><ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  )
}
