/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : OperatorTransfersPage.jsx
Description   : Grid operator dashboard for energy transfers —
                today's, pending and completed transfers, with
                status, date, station and NIC filtering
Author        : Malmi
=====================================================
*/

import { CheckCircle2, Clock3, QrCode, Search, Trash2, Zap } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { transactionService } from '../../services'
import {
  EmptyState,
  ErrorBanner,
  InlineSpinner,
  TransactionStatusPill,
  TransferStatCard,
  formatDate,
  formatDateTime,
  formatEnergy,
} from '../../components/transactions/TransactionUi'

/** Status values the filter dropdown offers, matching the backend vocabulary. */
const STATUS_OPTIONS = ['Pending', 'Verified', 'Completed', 'Rejected', 'Failed']

/** Empty filter state, reused when the operator clears the form. */
const EMPTY_FILTERS = { status: '', date: '', stationId: '', prosumerNic: '' }

/**
 * Grid operator view of every energy transfer.
 * The counters come from the dashboard endpoint; the table is driven by the
 * search endpoint so filtering happens in the database, not in the browser.
 */
export function OperatorTransfersPage() {
  const navigate = useNavigate()

  const [dashboard, setDashboard] = useState(null)
  const [results, setResults] = useState(null)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  // Headline counters and the operator's queues.
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await transactionService.getOperatorDashboard()
      setDashboard(data)
    } catch (err) {
      setError(err.message || 'Could not load the transfer dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  /**
   * Runs a filtered search against the API.
   * @param {number} [targetPage=1] - Page to request
   */
  const runSearch = async (targetPage = 1) => {
    try {
      setSearching(true)
      setError('')
      const data = await transactionService.searchTransactions({ ...filters, page: targetPage, pageSize: 20 })
      setResults(data)
      setPage(targetPage)
    } catch (err) {
      setError(err.message || 'Could not search transactions.')
    } finally {
      setSearching(false)
    }
  }

  // Clears the filters and falls back to the dashboard queues.
  const clearSearch = () => {
    setFilters(EMPTY_FILTERS)
    setResults(null)
    setPage(1)
  }

  const summary = dashboard?.summary

  // Without an active search the table shows today's transfers, which is the
  // list an operator on shift actually needs.
  const rows = results ? results.items : (dashboard?.todayTransfers ?? [])

  const stats = [
    {
      label: "Today's transfers",
      value: summary?.todayTransfers ?? 0,
      icon: Zap,
      tone: 'amber',
      detail: 'Transactions raised today',
    },
    {
      label: 'Pending transfers',
      value: summary?.pendingTransfers ?? 0,
      icon: Clock3,
      tone: 'blue',
      detail: 'Awaiting a QR scan',
    },
    {
      label: 'Completed transfers',
      value: summary?.completedTransfers ?? 0,
      icon: CheckCircle2,
      tone: 'emerald',
      detail: formatEnergy(summary?.totalEnergyTransferred ?? 0) + ' delivered',
    },
    {
      label: 'Awaiting confirmation',
      value: summary?.verifiedTransfers ?? 0,
      icon: QrCode,
      tone: 'violet',
      detail: 'Verified, not yet completed',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Energy Transfers
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Transfer Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Scan a prosumer QR code, verify the booking, and confirm the energy handover.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/operator/transfers/scan')}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-amber-400"
        >
          <QrCode className="h-4 w-4" />
          Scan QR code
        </button>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? (
        <InlineSpinner label="Loading transfers..." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat, index) => (
              <TransferStatCard key={stat.label} index={index} {...stat} />
            ))}
          </div>

          {/* ── Search and filter ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">Search transactions</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                aria-label="Filter by status"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                aria-label="Filter by date"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <input
                type="text"
                value={filters.stationId}
                onChange={(e) => setFilters({ ...filters, stationId: e.target.value })}
                placeholder="Station ID"
                aria-label="Filter by station"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <input
                type="text"
                value={filters.prosumerNic}
                onChange={(e) => setFilters({ ...filters, prosumerNic: e.target.value })}
                placeholder="Prosumer NIC"
                aria-label="Filter by prosumer NIC"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => runSearch(1)}
                  disabled={searching}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  <Search className="h-4 w-4" />
                  {searching ? 'Searching...' : 'Search'}
                </button>

                {results && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ── Results table ── */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                {results ? 'Search results' : "Today's transfers"}
              </h2>
              {results && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {results.totalCount} match{results.totalCount === 1 ? '' : 'es'}
                </p>
              )}
            </div>

            <div className="p-5">
              {rows.length === 0 ? (
                <EmptyState
                  icon={Zap}
                  title={results ? 'No matching transactions' : 'No transfers scheduled today'}
                  description={
                    results
                      ? 'Try widening the filters above.'
                      : 'Transactions appear here as prosumers generate their QR codes.'
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="pb-3 pr-4 font-medium">Transaction ID</th>
                        <th className="pb-3 pr-4 font-medium">Prosumer</th>
                        <th className="pb-3 pr-4 font-medium">Station</th>
                        <th className="pb-3 pr-4 font-medium">Slot</th>
                        <th className="pb-3 pr-4 font-medium">Energy</th>
                        <th className="pb-3 pr-4 font-medium">Status</th>
                        <th className="pb-3 font-medium" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {rows.map((transaction) => (
                        <tr key={transaction.transactionId}>
                          <td className="py-3 pr-4">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {transaction.transactionId}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDateTime(transaction.transactionDate)}
                            </p>
                          </td>
                          <td className="py-3 pr-4">
                            <p className="text-slate-900 dark:text-white">
                              {transaction.prosumerName || '—'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {transaction.prosumerNIC}
                            </p>
                          </td>
                          <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                            {transaction.stationName || transaction.stationId}
                          </td>
                          <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                            {formatDate(transaction.slotDate)}
                            <span className="block text-xs text-slate-400">{transaction.slotTime}</span>
                          </td>
                          <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">
                            {formatEnergy(transaction.energyAmount)}
                          </td>
                          <td className="py-3 pr-4">
                            <TransactionStatusPill status={transaction.transferStatus} />
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/operator/transfers/${transaction.transactionId}/verify`)
                              }
                              className="rounded-lg px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-400/10"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Paging is only meaningful for a search result set. */}
              {results && results.totalPages > 1 && (
                <div className="mt-5 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={page <= 1 || searching}
                    onClick={() => runSearch(page - 1)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Previous
                  </button>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Page {results.page} of {results.totalPages}
                  </p>

                  <button
                    type="button"
                    disabled={page >= results.totalPages || searching}
                    onClick={() => runSearch(page + 1)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
