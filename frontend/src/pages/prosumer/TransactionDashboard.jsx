/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : TransactionDashboard.jsx
Description   : Prosumer energy transaction dashboard showing
                pending, current and completed transfers plus
                approved bookings still waiting for a QR code
Author        : Malmi
=====================================================
*/

import { BatteryCharging, CalendarClock, CheckCircle2, Clock3, QrCode, Zap } from 'lucide-react'
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

/**
 * Tab definitions for the transaction lists. The key maps onto the matching
 * array in the dashboard payload returned by GET /api/dashboard/prosumer.
 */
const TABS = [
  { key: 'pendingTransactions', label: 'Pending' },
  { key: 'currentTransactions', label: 'Approved' },
  { key: 'completedTransactions', label: 'Completed' },
]

/**
 * Prosumer-facing dashboard for the energy transfer workflow.
 * Reads everything from a single dashboard endpoint so the counters and the
 * lists can never disagree with each other.
 */
export function TransactionDashboard() {
  const navigate = useNavigate()

  const [dashboard, setDashboard] = useState(null)
  const [activeTab, setActiveTab] = useState(TABS[0].key)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generatingFor, setGeneratingFor] = useState('')

  // Loads the dashboard payload; reused by the initial load and after a QR is issued.
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await transactionService.getMyDashboard()
      setDashboard(data)
    } catch (err) {
      setError(err.message || 'Could not load your transaction dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  /**
   * Issues a QR for an approved booking and opens the display page.
   * @param {string} reservationId - Reservation to generate against
   */
  const handleGenerateQr = async (reservationId) => {
    try {
      setGeneratingFor(reservationId)
      setError('')
      const result = await transactionService.generateQr(reservationId)
      navigate(`/prosumer/transactions/${result.transactionId}/qr`)
    } catch (err) {
      setError(err.message || 'Could not generate a QR code for this reservation.')
      setGeneratingFor('')
    }
  }

  const summary = dashboard?.summary
  const transactions = dashboard?.[activeTab] ?? []
  const upcoming = dashboard?.approvedFutureReservations ?? []

  const stats = [
    {
      label: 'Pending transfers',
      value: summary?.pendingTransfers ?? 0,
      icon: Clock3,
      tone: 'amber',
      detail: 'QR issued, waiting to be scanned',
    },
    {
      label: 'Approved at station',
      value: summary?.verifiedTransfers ?? 0,
      icon: CalendarClock,
      tone: 'blue',
      detail: 'Verified, awaiting handover',
    },
    {
      label: 'Completed transfers',
      value: summary?.completedTransfers ?? 0,
      icon: CheckCircle2,
      tone: 'emerald',
      detail: 'Energy successfully collected',
    },
    {
      label: 'Total energy received',
      value: formatEnergy(summary?.totalEnergyTransferred ?? 0),
      icon: Zap,
      tone: 'violet',
      detail: 'Across all completed transfers',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Energy Transfers
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          Transaction Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Generate a QR code for an approved booking, then show it to the grid operator to collect your energy.
        </p>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? (
        <InlineSpinner label="Loading your transactions..." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat, index) => (
              <TransferStatCard key={stat.label} index={index} {...stat} />
            ))}
          </div>

          {/* ── Approved bookings awaiting a QR ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                Approved bookings
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Upcoming reservations that are ready to be collected.
              </p>
            </div>

            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="No approved bookings"
                description="Once a reservation is approved it will appear here, ready for a QR code."
              />
            ) : (
              <div className="space-y-3">
                {upcoming.map((reservation) => (
                  <div
                    key={reservation.reservationId}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {reservation.stationName || reservation.stationId}
                        </p>
                        <TransactionStatusPill status={reservation.status} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {reservation.reservationId} · {formatDate(reservation.slotDate)} · {reservation.slotTime} ·{' '}
                        {formatEnergy(reservation.reservedCapacity)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleGenerateQr(reservation.reservationId)}
                      disabled={generatingFor === reservation.reservationId}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <QrCode className="h-4 w-4" />
                      {generatingFor === reservation.reservationId
                        ? 'Generating...'
                        : reservation.hasTransaction
                          ? 'View QR code'
                          : 'Generate QR code'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Transaction lists ── */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              {TABS.map((tab) => {
                const count = dashboard?.[tab.key]?.length ?? 0
                const isActive = activeTab === tab.key

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={
                      isActive
                        ? 'rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white'
                        : 'rounded-xl px-4 py-2 text-sm text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }
                  >
                    {tab.label} ({count})
                  </button>
                )
              })}
            </div>

            <div className="p-5">
              {transactions.length === 0 ? (
                <EmptyState
                  icon={BatteryCharging}
                  title={`No ${TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} transactions`}
                  description="Transactions appear here as your energy transfers progress."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="pb-3 pr-4 font-medium">Transaction</th>
                        <th className="pb-3 pr-4 font-medium">Station</th>
                        <th className="pb-3 pr-4 font-medium">Slot</th>
                        <th className="pb-3 pr-4 font-medium">Energy</th>
                        <th className="pb-3 pr-4 font-medium">Status</th>
                        <th className="pb-3 font-medium" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {transactions.map((transaction) => (
                        <tr key={transaction.transactionId}>
                          <td className="py-3 pr-4">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {transaction.transactionId}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDateTime(transaction.transactionDate)}
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
                            {transaction.transferStatus !== 'Completed' &&
                              transaction.transferStatus !== 'Rejected' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/prosumer/transactions/${transaction.transactionId}/qr`)
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-400/10"
                                >
                                  <QrCode className="h-3.5 w-3.5" />
                                  Show QR
                                </button>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
