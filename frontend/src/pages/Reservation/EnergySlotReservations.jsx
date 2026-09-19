import { CalendarDays, Check, CircleUserRound, Eye, MapPin, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Panel, SectionHeading } from '../../components/common/Panel'
import { StatusBadge } from '../../components/common/StatusBadge'
import { reservationService } from '../../services'

const statusOptions = ['All', 'Reviewing', 'Pending', 'Approved', 'Completed', 'Cancelled']
const workflowStatusOptions = statusOptions.filter((status) => status !== 'All')

function toDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateKeyFromApi(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const getPart = (type) => parts.find((part) => part.type === type)?.value
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`
}

function formatDate(value) {
  if (!value) return 'Date unavailable'
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(year, month - 1, day))
}

function formatTime(value) {
  const match = /^(\d{1,2}):(\d{2})/.exec(value || '')
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : 'Time unavailable'
}

function formatEnergy(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '0 kWh'
  return `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(amount)} kWh`
}

function formatCreatedAt(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || 'Not recorded'
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function toReservationRow(reservation) {
  const dateKey = dateKeyFromApi(reservation.slotDate)
  return {
    id: reservation.reservationId,
    nic: reservation.prosumerNic || 'NIC unavailable',
    prosumer: reservation.prosumerName || reservation.userId || 'Unknown prosumer',
    node: reservation.stationName || reservation.stationId || 'Unknown microgrid node',
    dateKey,
    date: formatDate(dateKey),
    time: `${formatTime(reservation.startTime)} - ${formatTime(reservation.endTime)}`,
    status: reservation.status || 'Reviewing',
    energy: formatEnergy(reservation.reservedCapacity),
    created: formatCreatedAt(reservation.createdAt),
  }
}

function ReservationDetail({ reservation, onReservationUpdated }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState(reservation.status)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const isCancelled = reservation.status === 'Cancelled'

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])

  const saveStatus = async () => {
    if (status === reservation.status) {
      setSaved(true)
      return
    }

    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const updatedReservation = await reservationService.updateBackofficeReservationStatus(reservation.id, status)
      onReservationUpdated(toReservationRow(updatedReservation))
      setSaved(true)
    } catch (requestError) {
      setError(requestError.message || 'Unable to update the reservation status.')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md" role="presentation" onClick={() => navigate('/backoffice/energy-slots/reservations')}>
      <Panel role="dialog" aria-modal="true" aria-labelledby="reservation-detail-title" className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Reservation details</p><h2 id="reservation-detail-title" className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{reservation.id}</h2></div>
          <button type="button" title="Close details" aria-label="Close details" onClick={() => navigate('/backoffice/energy-slots/reservations')} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-5 p-5">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-amber-400 dark:text-slate-950">{reservation.prosumer.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><div><p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{reservation.prosumer}</p><p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">{reservation.nic}</p></div></div>
          <div className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50"><div className="flex items-start gap-3"><CircleUserRound className="mt-0.5 h-4 w-4 text-slate-400" /><div><p className="text-xs text-slate-500 dark:text-slate-400">Requested by</p><p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{reservation.prosumer}</p></div></div><div className="flex items-start gap-3"><CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" /><div><p className="text-xs text-slate-500 dark:text-slate-400">Scheduled window</p><p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{reservation.date}, {reservation.time}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Requested {reservation.created}</p></div></div></div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Microgrid node<div className="mt-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-700 dark:border-slate-800 dark:text-slate-200">{reservation.node}</div></label>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Reservation status<select value={status} disabled={isCancelled || saving} onChange={(event) => { setStatus(event.target.value); setSaved(false) }} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-700 outline-none ring-blue-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">{workflowStatusOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Energy requested<div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-700 dark:border-slate-800 dark:text-slate-200"><span>{reservation.energy}</span><span className="text-xs text-slate-400">Solar surplus</span></div></label>
          {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">{error}</p>}
          <button type="button" disabled={isCancelled || saving} onClick={saveStatus} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300">{saved ? <Check className="h-4 w-4" /> : null}{saving ? 'Saving changes...' : saved ? 'Changes saved' : isCancelled ? 'Reservation cancelled' : 'Save changes'}</button>
        </div>
      </Panel>
    </div>,
    document.body,
  )
}

export function EnergySlotReservations() {
  const { reservationId } = useParams()
  const navigate = useNavigate()
  const [reservations, setReservations] = useState([])
  const [selectedDate, setSelectedDate] = useState(toDateKey())
  const [statusFilter, setStatusFilter] = useState('All')
  const [nodeFilter, setNodeFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReservations = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await reservationService.listBackofficeReservations()
      setReservations(Array.isArray(response) ? response.map(toReservationRow) : [])
    } catch (requestError) {
      setReservations([])
      setError(requestError.message || 'Unable to load reservations.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReservations()
  }, [loadReservations])

  const nodeOptions = useMemo(
    () => [...new Set(reservations.map((reservation) => reservation.node))].sort(),
    [reservations],
  )
  const selectedReservation = reservations.find((reservation) => reservation.id === reservationId)
  const viewingDate = selectedReservation?.dateKey || selectedDate
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const visibleReservations = reservations.filter((reservation) => {
    const matchesDate = reservation.dateKey === viewingDate
    const matchesStatus = statusFilter === 'All' || reservation.status === statusFilter
    const matchesNode = nodeFilter === 'All' || reservation.node === nodeFilter
    const matchesSearch = !normalizedSearch || [reservation.id, reservation.prosumer].some((value) => value.toLowerCase().includes(normalizedSearch))
    return matchesDate && matchesStatus && matchesNode && matchesSearch
  })
  const isToday = viewingDate === toDateKey()
  const dateLabel = isToday ? `Today, ${formatDate(viewingDate)}` : formatDate(viewingDate)

  const clearFilters = () => {
    setSelectedDate(toDateKey())
    setStatusFilter('All')
    setNodeFilter('All')
    setSearchTerm('')
    if (reservationId) navigate('/backoffice/energy-slots/reservations')
  }

  const changeDate = (value) => {
    setSelectedDate(value)
    if (reservationId) navigate('/backoffice/energy-slots/reservations')
  }

  const updateReservationInList = (updatedReservation) => {
    setReservations((current) => current.map((reservation) => (
      reservation.id === updatedReservation.id ? updatedReservation : reservation
    )))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400"><CircleUserRound className="h-3.5 w-3.5" /> Reservation workflow</div><h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl dark:text-white">Reservations</h1><p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Review requests, approve time windows, and keep prosumers informed.</p></div><div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"><CalendarDays className="h-4 w-4 text-slate-400" /> Viewing {dateLabel}</div></div>
      <Panel className="overflow-hidden">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800 md:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><SectionHeading title="Reservation queue" description={`${visibleReservations.length} reservation${visibleReservations.length === 1 ? '' : 's'} for ${dateLabel}.`} /><div className="flex flex-wrap items-center gap-2"><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400"><CalendarDays className="h-4 w-4" /><span className="sr-only">Choose reservation date</span><input type="date" value={viewingDate} onChange={(event) => changeDate(event.target.value)} className="bg-transparent text-xs font-semibold text-slate-700 outline-none dark:text-slate-200" /></label><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400"><MapPin className="h-4 w-4" /><select value={nodeFilter} onChange={(event) => setNodeFilter(event.target.value)} aria-label="Filter by microgrid node" className="reservation-node-select w-36 bg-transparent text-xs font-semibold text-slate-700 outline-none dark:text-slate-200"><option value="All">All nodes</option>{nodeOptions.map((node) => <option key={node} value={node}>{node}</option>)}</select></label><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400"><Search className="h-4 w-4" /><span className="sr-only">Search reservations</span><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} aria-label="Search reservations by ID or prosumer name" placeholder="Search ID or name" className="w-32 bg-transparent outline-none placeholder:text-slate-400" /></label><button type="button" title="Clear filters" aria-label="Clear filters" onClick={clearFilters} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"><RotateCcw className="h-4 w-4" /></button></div></div>
          <div className="mt-5 flex flex-wrap items-center gap-2"><span className="mr-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Status</span>{statusOptions.map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${statusFilter === status ? 'bg-slate-950 text-white dark:bg-amber-400 dark:text-slate-950' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'}`}>{status}</button>)}<SlidersHorizontal className="ml-1 h-4 w-4 text-slate-400" /></div>
        </div>
        {error && <div role="alert" className="mx-5 mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300 md:mx-6">{error}</div>}
        <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400"><tr><th className="px-5 py-3.5 md:px-6">Reservation</th><th className="px-3 py-3.5">Prosumer</th><th className="px-3 py-3.5">Node</th><th className="px-3 py-3.5">Schedule</th><th className="px-3 py-3.5">Status</th><th className="px-5 py-3.5 text-right md:px-6">Action</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{loading ? <tr><td colSpan="6" className="px-6 py-14 text-center text-sm text-slate-500 dark:text-slate-400">Loading reservations...</td></tr> : visibleReservations.length > 0 ? visibleReservations.map((reservation) => <tr key={reservation.id} className={reservation.id === reservationId ? 'bg-blue-50/60 dark:bg-blue-400/5' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'}><td className="px-5 py-4 md:px-6"><p className="font-semibold text-slate-800 dark:text-slate-200">{reservation.id}</p><p className="mt-1 text-xs text-slate-400">{reservation.energy}</p></td><td className="px-3 py-4"><p className="text-slate-700 dark:text-slate-300">{reservation.prosumer}</p><p className="mt-1 font-mono text-[11px] text-slate-400">{reservation.nic}</p></td><td className="px-3 py-4 text-slate-600 dark:text-slate-400">{reservation.node}</td><td className="px-3 py-4 whitespace-nowrap"><p className="text-slate-600 dark:text-slate-300">{reservation.date}</p><p className="mt-1 text-xs text-slate-400">{reservation.time}</p></td><td className="px-3 py-4"><StatusBadge status={reservation.status} /></td><td className="px-5 py-4 text-right md:px-6"><Link to={`/backoffice/energy-slots/reservations/${reservation.id}`} title={`View and edit ${reservation.id}`} aria-label={`View and edit ${reservation.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-400/10"><Eye className="h-3.5 w-3.5" /> View</Link></td></tr>) : <tr><td colSpan="6" className="px-6 py-14 text-center"><CalendarDays className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" /><p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">No reservations found</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Try another date or clear the active filters.</p></td></tr>}</tbody></table></div>
      </Panel>
      {selectedReservation && <ReservationDetail key={selectedReservation.id} reservation={selectedReservation} onReservationUpdated={updateReservationInList} />}
    </div>
  )
}
