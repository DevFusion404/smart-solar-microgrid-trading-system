/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Identity and Account Management (Component 1)
File          : PendingProsumerActions.jsx
Description   : Backoffice dashboard panel listing prosumer requests that
                need action, read live from the API:
                  - new registrations  (GET /api/prosumers/pending-activations)
                  - deactivation requests (GET /api/prosumers/deactivation-requests)
                Registrations can be activated and deactivation requests
                approved directly (two-click confirm). Rejecting a
                registration needs a reason, so it opens the full review.
=====================================================
*/

import { AlertCircle, ArrowRight, CheckCircle2, Eye, RefreshCw, UserCheck, UserMinus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { prosumerService } from '../../services'
import { Panel, SectionHeading } from '../common/Panel'
import { StatusBadge } from '../common/StatusBadge'

const MAX_ROWS = 5

// Formats how long ago a request was made (e.g. "12 min ago", "3 days ago")
function timeAgo(iso) {
  if (!iso) return '—'
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

// Turns both API lists into one list of rows, newest request first
function toRows(pendingItems, deactivationItems) {
  const activationRows = pendingItems.map((p) => ({
    ...p,
    type: 'activation',
    requestedAt: p.activationRequestedAt || p.createdAt,
  }))
  const deactivationRows = deactivationItems.map((p) => ({
    ...p,
    type: 'deactivation',
    requestedAt: p.deactivationRequestedAt || p.createdAt,
  }))
  return [...activationRows, ...deactivationRows]
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
    .slice(0, MAX_ROWS)
}

// Fetches the first page of both request queues from the API in parallel
function fetchQueues() {
  return Promise.all([
    prosumerService.listPendingActivations({ page: 1, pageSize: MAX_ROWS }),
    prosumerService.listDeactivationRequests({ page: 1, pageSize: MAX_ROWS }),
  ])
}

// Dashboard panel: live pending registrations and deactivation requests with quick actions
export function PendingProsumerActions() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [counts, setCounts] = useState({ activations: 0, deactivations: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirmingNic, setConfirmingNic] = useState(null)
  const [busyNic, setBusyNic] = useState(null)

  // Stores the API results in state (rows for the table, totals for the heading)
  const applyQueues = useCallback(([pending, deactivations]) => {
    setRows(toRows(pending.items || [], deactivations.items || []))
    setCounts({
      activations: pending.totalCount ?? (pending.items || []).length,
      deactivations: deactivations.totalCount ?? (deactivations.items || []).length,
    })
  }, [])

  // Reloads both queues (used by Retry and after a quick action)
  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      applyQueues(await fetchQueues())
    } catch (err) {
      setError(err.message || 'Could not load prosumer requests.')
    } finally {
      setLoading(false)
    }
  }, [applyQueues])

  // Initial load when the dashboard opens; ignores the result if the panel unmounts first
  useEffect(() => {
    let active = true
    fetchQueues()
      .then((result) => active && applyQueues(result))
      .catch((err) => active && setError(err.message || 'Could not load prosumer requests.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [applyQueues])

  // First click asks for confirmation; second click activates / approves through the API
  const handleQuickAction = async (row) => {
    if (confirmingNic !== row.nic) {
      setConfirmingNic(row.nic)
      return
    }
    setConfirmingNic(null)
    setBusyNic(row.nic)
    setError('')
    setNotice('')
    try {
      if (row.type === 'activation') {
        await prosumerService.activateProsumer(row.nic)
        setNotice(`${row.fullName} has been activated.`)
      } else {
        await prosumerService.approveDeactivation(row.nic)
        setNotice(`${row.fullName} has been deactivated.`)
      }
      await loadRequests()
    } catch (err) {
      setError(err.message || 'Action failed.')
    } finally {
      setBusyNic(null)
    }
  }

  const total = counts.activations + counts.deactivations

  return (
    <Panel className="overflow-hidden">
      <div className="p-5 pb-3 md:p-6 md:pb-4">
        <SectionHeading
          title="Pending prosumer actions"
          description={loading
            ? 'Loading requests…'
            : `${counts.activations} registration${counts.activations === 1 ? '' : 's'} awaiting activation · ${counts.deactivations} deactivation request${counts.deactivations === 1 ? '' : 's'}`}
          action={<Link to="/backoffice/prosumers/requests" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">View all <ArrowRight className="h-3.5 w-3.5" /></Link>}
        />
        {notice && (
          <p className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-400/10 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
            <button type="button" onClick={loadRequests} className="ml-auto font-semibold underline">Retry</button>
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-y border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:bg-slate-950/40">
            <tr>
              <th className="px-5 py-3 font-medium md:px-6">Prosumer</th>
              <th className="px-3 py-3 font-medium">Request</th>
              <th className="px-3 py-3 font-medium">Details</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium md:px-6"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-slate-400">
                  <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin opacity-50" /> Loading requests…
                </td>
              </tr>
            ) : total === 0 && !error ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-slate-400">
                  <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-400" /> No prosumer requests waiting. All caught up!
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const confirming = confirmingNic === row.nic
                const busy = busyNic === row.nic
                return (
                  <tr key={`${row.type}-${row.nic}`} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 md:px-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                          {(row.fullName || 'PR').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-100">{row.fullName}</p>
                          <p className="font-mono text-xs text-slate-400">{row.nic}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-slate-700 dark:text-slate-200">
                      {row.type === 'activation' ? 'New registration' : 'Deactivation'}
                      <p className="text-xs text-slate-400">{timeAgo(row.requestedAt)}</p>
                    </td>
                    <td className="max-w-[220px] px-3 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {row.type === 'deactivation' && row.deactivationReason
                        ? <span className="line-clamp-2 italic" title={row.deactivationReason}>“{row.deactivationReason}”</span>
                        : <span className="truncate">{row.email}</span>}
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={row.type === 'activation' ? 'Pending activation' : 'Deactivation requested'} />
                    </td>
                    <td className="px-5 py-3.5 md:px-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleQuickAction(row)}
                          onBlur={() => confirming && setConfirmingNic(null)}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white transition disabled:opacity-60 ${
                            row.type === 'activation' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                          }`}
                        >
                          {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            : row.type === 'activation' ? <UserCheck className="h-3.5 w-3.5" /> : <UserMinus className="h-3.5 w-3.5" />}
                          {confirming ? 'Confirm?' : row.type === 'activation' ? 'Activate' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          title="Open full review"
                          onClick={() => navigate(`/backoffice/prosumers/${encodeURIComponent(row.nic)}`)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          <Eye className="h-3.5 w-3.5" /> Review
                        </button>
                      </div>
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
