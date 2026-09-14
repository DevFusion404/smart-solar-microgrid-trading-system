import { BatteryCharging, CalendarDays, Clock3, Eye, Link as LinkIcon, MapPin, Search, SlidersHorizontal, Sparkles, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Panel, SectionHeading } from '../../components/common/Panel'
import { StatusBadge } from '../../components/common/StatusBadge'
import { energySlotRows } from './reservationData'

function SlotDetail({ slot, onClose }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md" role="presentation" onClick={onClose}>
    <Panel role="dialog" aria-modal="true" aria-labelledby="slot-detail-title" className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-800">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Energy slot details</p><h2 id="slot-detail-title" className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{slot.id}</h2></div>
        <button type="button" title="Close slot details" aria-label="Close slot details" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"><X className="h-4 w-4" /></button>
      </div>
      <div className="space-y-5 p-5">
        <div className="flex items-center justify-between"><StatusBadge status={slot.status} /><span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{slot.utilization}% utilized</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${slot.utilization}%` }} /></div>
        <div className="grid grid-cols-2 gap-3">
          {[['Total capacity', slot.capacity, BatteryCharging, 'text-amber-500'], ['Reserved energy', slot.reserved, BatteryCharging, 'text-blue-500'], ['Reservations', slot.reservedCount, Users, 'text-violet-500'], ['Remaining', slot.remaining, LinkIcon, 'text-emerald-500']].map(([label, value, Icon, color]) => <div key={label} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800"><Icon className={`h-4 w-4 ${color}`} /><p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">{value}{label === 'Reservations' ? ' bookings' : ''}</p></div>)}
        </div>
        <div className="space-y-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50"><div className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 text-slate-400" /><div><p className="text-xs text-slate-500 dark:text-slate-400">Microgrid node</p><p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{slot.node}</p></div></div><div className="flex items-start gap-3"><CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" /><div><p className="text-xs text-slate-500 dark:text-slate-400">Scheduled date</p><p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{slot.date}</p></div></div><div className="flex items-start gap-3"><Clock3 className="mt-0.5 h-4 w-4 text-slate-400" /><div><p className="text-xs text-slate-500 dark:text-slate-400">Time window</p><p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{slot.time}</p></div></div></div>
        <div className="flex items-center justify-between text-xs"><span className="text-slate-500 dark:text-slate-400">Energy source</span><span className="font-semibold text-slate-700 dark:text-slate-200">{slot.source}</span></div>
        <div className="flex items-center justify-between text-xs"><span className="text-slate-500 dark:text-slate-400">Published</span><span className="font-semibold text-slate-700 dark:text-slate-200">{slot.created}</span></div>
        <Link to="/backoffice/energy-slots/reservations" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"><Users className="h-4 w-4" /> View related reservations</Link>
      </div>
    </Panel>
    </div>,
    document.body,
  )
}

export function ManageEnergySlots() {
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const visibleSlots = energySlotRows.filter((slot) => !normalizedSearch || [slot.id, slot.node].some((value) => value.toLowerCase().includes(normalizedSearch)))

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400"><Sparkles className="h-3.5 w-3.5" /> Energy capacity planning</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl dark:text-white">Manage Energy Slots</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Review published capacity and see how each time window is being used.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[['18', 'Published slots', 'Across all nodes'], ['6', 'Microgrid nodes', 'Actively publishing'], ['72%', 'Capacity booked', 'For the next 48 hours']].map(([value, label, note]) => <Panel key={label} className="p-5"><p className="text-2xl font-bold text-slate-950 dark:text-white">{value}</p><p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note}</p></Panel>)}
      </div>

      <>
        <Panel className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between md:px-6">
            <SectionHeading title="Published slots" description="Select View on a slot to inspect its full capacity breakdown." />
            <div className="flex flex-wrap gap-2"><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400"><Search className="h-4 w-4" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} aria-label="Search slots by ID or microgrid node" placeholder="Search ID or node" className="w-32 bg-transparent outline-none placeholder:text-slate-400" /></label><button type="button" title="Filter slots" aria-label="Filter slots" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"><SlidersHorizontal className="h-4 w-4" /></button></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400"><tr><th className="px-5 py-3.5 md:px-6">Slot</th><th className="px-3 py-3.5">Microgrid node</th><th className="px-3 py-3.5">Schedule</th><th className="px-3 py-3.5">Capacity</th><th className="px-3 py-3.5">Reserved</th><th className="px-3 py-3.5">Status</th><th className="px-5 py-3.5 text-right md:px-6">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{visibleSlots.length > 0 ? visibleSlots.map((slot) => <tr key={slot.id} className={selectedSlot?.id === slot.id ? 'bg-amber-50/70 dark:bg-amber-400/5' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'}><td className="px-5 py-4 font-semibold text-slate-800 md:px-6 dark:text-slate-200">{slot.id}</td><td className="px-3 py-4 text-slate-600 dark:text-slate-300">{slot.node}</td><td className="px-3 py-4"><p className="whitespace-nowrap text-slate-600 dark:text-slate-300">{slot.date}</p><p className="mt-1 whitespace-nowrap text-xs text-slate-400">{slot.time}</p></td><td className="px-3 py-4 text-slate-600 dark:text-slate-300">{slot.capacity}</td><td className="px-3 py-4"><p className="text-slate-600 dark:text-slate-300">{slot.reserved}</p><p className="mt-1 text-xs text-slate-400">{slot.reservedCount} bookings</p></td><td className="px-3 py-4"><StatusBadge status={slot.status} /></td><td className="px-5 py-4 text-right md:px-6"><button type="button" title={`View ${slot.id}`} aria-label={`View details for ${slot.id}`} onClick={() => setSelectedSlot(slot)} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-400/10"><Eye className="h-3.5 w-3.5" /> View</button></td></tr>) : <tr><td colSpan="7" className="px-6 py-14 text-center"><Search className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" /><p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">No slots found</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Try a slot ID or a different microgrid node name.</p></td></tr>}</tbody>
            </table>
          </div>
        </Panel>
        {selectedSlot && <SlotDetail key={selectedSlot.id} slot={selectedSlot} onClose={() => setSelectedSlot(null)} />}
      </>
    </div>
  )
}
