/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : TransactionVerificationPage.jsx
Description   : Grid operator verification page showing the prosumer,
                station, energy amount and booking time, with the
                actions to complete or reject the energy transfer
Author        : Malmi
=====================================================
*/

import {
  ArrowLeft,
  BatteryCharging,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  UserRound,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { transactionService } from '../../services'
import {
  ErrorBanner,
  InlineSpinner,
  TransactionStatusPill,
  formatDate,
  formatDateTime,
  formatEnergy,
} from '../../components/transactions/TransactionUi'

/**
 * A single labelled fact about the booking.
 * @param {Object} props - Component props
 * @param {Function} props.icon - A lucide-react icon component
 * @param {string} props.label - Field caption
 * @param {React.ReactNode} props.value - Field value
 */
function Fact({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{value}</div>
    </div>
  )
}

/**
 * Verification screen the operator lands on after a successful scan.
 * Completing here is what closes both the transaction and its reservation.
 */
export function TransactionVerificationPage() {
  const { transactionId } = useParams()
  const navigate = useNavigate()

  const [transaction, setTransaction] = useState(null)
  const [deliveredEnergy, setDeliveredEnergy] = useState('')
  const [remarks, setRemarks] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadTransaction = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await transactionService.getTransaction(transactionId)
      setTransaction(data)
      // Pre-fill the meter box with the reserved amount, which is the usual case.
      setDeliveredEnergy(String(data.energyAmount ?? ''))
    } catch (err) {
      setError(err.message || 'Could not load this transaction.')
    } finally {
      setLoading(false)
    }
  }, [transactionId])

  useEffect(() => {
    loadTransaction()
  }, [loadTransaction])

  // Confirms the handover and moves on to the completion receipt.
  const handleComplete = async () => {
    try {
      setSubmitting(true)
      setError('')

      const payload = {}
      const parsed = Number(deliveredEnergy)

      // Only send a metered amount when it differs from the reserved figure.
      if (deliveredEnergy !== '' && !Number.isNaN(parsed) && parsed !== transaction.energyAmount) {
        payload.deliveredEnergy = parsed
      }
      if (remarks.trim()) {
        payload.remarks = remarks.trim()
      }

      await transactionService.completeTransfer(transactionId, payload)
      navigate(`/operator/transfers/${transactionId}/complete`)
    } catch (err) {
      setError(err.message || 'Could not complete this energy transfer.')
      setSubmitting(false)
    }
  }

  // Declines the transfer, which also invalidates the QR token.
  const handleReject = async () => {
    try {
      setSubmitting(true)
      setError('')
      await transactionService.rejectTransfer(transactionId, rejectReason.trim())
      setShowReject(false)
      setRejectReason('')
      await loadTransaction()
    } catch (err) {
      setError(err.message || 'Could not reject this energy transfer.')
    } finally {
      setSubmitting(false)
    }
  }

  const isVerified = transaction?.transferStatus === 'Verified'
  const isClosed = transaction?.transferStatus === 'Completed' || transaction?.transferStatus === 'Rejected'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/operator/transfers')}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to transfers
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Transaction Verification
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Confirm these details with the prosumer before releasing energy.
          </p>
        </div>

        {transaction && <TransactionStatusPill status={transaction.transferStatus} />}
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? (
        <InlineSpinner label="Loading transaction..." />
      ) : (
        transaction && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Transaction ID</p>
                  <p className="text-lg font-bold text-slate-950 dark:text-white">
                    {transaction.transactionId}
                  </p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Reservation {transaction.reservationId}
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Fact
                  icon={UserRound}
                  label="Prosumer"
                  value={
                    <>
                      {transaction.prosumerName || '—'}
                      <span className="mt-0.5 block text-xs font-normal text-slate-500 dark:text-slate-400">
                        {transaction.prosumerNIC}
                      </span>
                    </>
                  }
                />
                <Fact
                  icon={MapPin}
                  label="Station"
                  value={transaction.stationName || transaction.stationId}
                />
                <Fact
                  icon={BatteryCharging}
                  label="Energy amount"
                  value={formatEnergy(transaction.energyAmount)}
                />
                <Fact
                  icon={CalendarDays}
                  label="Booking time"
                  value={
                    <>
                      {formatDate(transaction.slotDate)}
                      <span className="mt-0.5 block text-xs font-normal text-slate-500 dark:text-slate-400">
                        {transaction.slotTime}
                      </span>
                    </>
                  }
                />
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Fact
                  icon={Clock3}
                  label="Verified at"
                  value={formatDateTime(transaction.verifiedDate)}
                />
                <Fact
                  icon={CheckCircle2}
                  label="Verified by"
                  value={transaction.operatorName || transaction.operatorId || 'Not yet verified'}
                />
              </div>
            </section>

            {/* ── Actions ── */}
            {isClosed ? (
              <section
                className={
                  transaction.transferStatus === 'Completed'
                    ? 'rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-500/30 dark:bg-emerald-400/10'
                    : 'rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-500/30 dark:bg-rose-500/10'
                }
              >
                <p
                  className={
                    transaction.transferStatus === 'Completed'
                      ? 'text-sm font-semibold text-emerald-800 dark:text-emerald-300'
                      : 'text-sm font-semibold text-rose-800 dark:text-rose-300'
                  }
                >
                  {transaction.transferStatus === 'Completed'
                    ? `Energy transfer completed on ${formatDateTime(transaction.completedDate)}.`
                    : `This transfer was rejected: ${transaction.failureReason || 'no reason recorded'}.`}
                </p>
              </section>
            ) : (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                  Complete the energy transfer
                </h2>

                {!isVerified && (
                  <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">
                    This QR has not been scanned yet. Scan the prosumer's code before completing the transfer.
                  </p>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="delivered-energy"
                      className="text-xs font-medium text-slate-500 dark:text-slate-400"
                    >
                      Delivered energy (kWh)
                    </label>
                    <input
                      id="delivered-energy"
                      type="number"
                      min="0"
                      step="0.01"
                      max={transaction.energyAmount}
                      value={deliveredEnergy}
                      onChange={(e) => setDeliveredEnergy(e.target.value)}
                      disabled={!isVerified}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      Cannot exceed the reserved {formatEnergy(transaction.energyAmount)}.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="remarks" className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Remarks (optional)
                    </label>
                    <input
                      id="remarks"
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      disabled={!isVerified}
                      placeholder="Any note about this handover"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={!isVerified || submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {submitting ? 'Completing...' : 'Complete Transfer'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowReject((v) => !v)}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-5 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject transfer
                  </button>
                </div>

                {showReject && (
                  <div className="mt-4 rounded-xl border border-rose-200 p-4 dark:border-rose-500/30">
                    <label
                      htmlFor="reject-reason"
                      className="text-xs font-medium text-slate-500 dark:text-slate-400"
                    >
                      Reason for rejection
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <input
                        id="reject-reason"
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. Prosumer identity could not be confirmed"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={!rejectReason.trim() || submitting}
                        className="shrink-0 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
                      >
                        Confirm rejection
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}
          </>
        )
      )}
    </div>
  )
}
