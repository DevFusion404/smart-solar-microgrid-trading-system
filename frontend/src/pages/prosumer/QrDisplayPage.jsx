/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : QrDisplayPage.jsx
Description   : Prosumer QR display page showing the transaction
                details and the scannable QR code the grid operator
                reads at the station
Author        : Malmi
=====================================================
*/

import { ArrowLeft, BatteryCharging, CalendarDays, Clock3, MapPin, QrCode, ShieldCheck } from 'lucide-react'
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
 * One labelled row inside the transaction detail panel.
 * @param {Object} props - Component props
 * @param {Function} props.icon - A lucide-react icon component
 * @param {string} props.label - Field caption
 * @param {React.ReactNode} props.value - Field value
 */
function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 py-3 last:border-0 dark:border-slate-800">
      <span className="mt-0.5 rounded-lg bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-slate-900 dark:text-white">{value}</div>
      </div>
    </div>
  )
}

/**
 * Shows a prosumer the QR code for one transaction, alongside the booking
 * details the grid operator will confirm against.
 */
export function QrDisplayPage() {
  const { transactionId } = useParams()
  const navigate = useNavigate()

  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetches the stored token and re-renders its image; no new token is minted.
  const loadQr = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await transactionService.getQr(transactionId)
      setQrData(data)
    } catch (err) {
      setError(err.message || 'Could not load this QR code.')
    } finally {
      setLoading(false)
    }
  }, [transactionId])

  useEffect(() => {
    loadQr()
  }, [loadQr])

  const transaction = qrData?.transaction
  const isScannable = transaction?.qrStatus === 'Active'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/prosumer/transactions')}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to transactions
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Your Energy QR Code
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Show this code to the grid operator at the station to collect your energy.
          </p>
        </div>

        {transaction && <TransactionStatusPill status={transaction.transferStatus} />}
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? (
        <InlineSpinner label="Loading your QR code..." />
      ) : (
        qrData && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
            {/* ── QR panel ── */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col items-center">
                <div
                  className={
                    isScannable
                      ? 'rounded-2xl bg-white p-4 ring-1 ring-slate-200'
                      : 'rounded-2xl bg-white p-4 opacity-40 ring-1 ring-slate-200 grayscale'
                  }
                >
                  <img
                    src={qrData.qrImageData}
                    alt={`QR code for transaction ${qrData.transactionId}`}
                    className="h-56 w-56"
                  />
                </div>

                {!isScannable && (
                  <p className="mt-4 rounded-xl bg-rose-50 px-4 py-2 text-center text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                    This code is {transaction?.qrStatus?.toLowerCase()} and can no longer be scanned.
                  </p>
                )}

                <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">Transaction ID</p>
                <p className="text-center text-sm font-semibold text-slate-900 dark:text-white">
                  {qrData.transactionId}
                </p>

                <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  Valid until {formatDateTime(qrData.expiryDate)}
                </p>
              </div>
            </section>

            {/* ── Transaction details ── */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">Transaction details</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                These details are confirmed by the grid operator before the transfer completes.
              </p>

              <div className="mt-4">
                <DetailRow
                  icon={BatteryCharging}
                  label="Energy amount"
                  value={formatEnergy(transaction?.energyAmount)}
                />
                <DetailRow
                  icon={MapPin}
                  label="Station"
                  value={transaction?.stationName || transaction?.stationId || '—'}
                />
                <DetailRow icon={CalendarDays} label="Booking date" value={formatDate(transaction?.slotDate)} />
                <DetailRow icon={Clock3} label="Time slot" value={transaction?.slotTime || '—'} />
                <DetailRow icon={QrCode} label="Reservation" value={transaction?.reservationId || '—'} />
                <DetailRow
                  icon={ShieldCheck}
                  label="Verification"
                  value={<TransactionStatusPill status={transaction?.verificationStatus} />}
                />
              </div>

              {transaction?.completedDate && (
                <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                  Energy transfer completed on {formatDateTime(transaction.completedDate)}.
                </div>
              )}

              {transaction?.failureReason && transaction?.transferStatus === 'Rejected' && (
                <div className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                  Rejected by the operator: {transaction.failureReason}
                </div>
              )}
            </section>
          </div>
        )
      )}
    </div>
  )
}
