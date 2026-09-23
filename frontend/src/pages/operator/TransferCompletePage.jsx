/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : TransferCompletePage.jsx
Description   : Completion result page confirming a successful energy
                transfer with its transaction id, date and time
Author        : Malmi
=====================================================
*/

import { CheckCircle2, QrCode, Receipt } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
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
 * One line of the completion receipt.
 * @param {Object} props - Component props
 * @param {string} props.label - Field caption
 * @param {React.ReactNode} props.value - Field value
 */
function ReceiptRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-0 dark:border-slate-800">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  )
}

/**
 * Confirmation screen shown to the grid operator once a transfer has been
 * completed. It reads the stored transaction back so the figures shown are
 * the ones that were actually persisted, not the ones that were submitted.
 */
export function TransferCompletePage() {
  const { transactionId } = useParams()
  const navigate = useNavigate()

  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTransaction = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await transactionService.getTransaction(transactionId)
      setTransaction(data)
    } catch (err) {
      setError(err.message || 'Could not load the completed transaction.')
    } finally {
      setLoading(false)
    }
  }, [transactionId])

  useEffect(() => {
    loadTransaction()
  }, [loadTransaction])

  const isCompleted = transaction?.transferStatus === 'Completed'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? (
        <InlineSpinner label="Loading transaction..." />
      ) : (
        transaction && (
          <>
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <span
                className={
                  isCompleted
                    ? 'inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400'
                    : 'inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800'
                }
              >
                <CheckCircle2 className="h-8 w-8" />
              </span>

              <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                {isCompleted ? 'Transaction completed successfully' : 'Transfer not completed'}
              </h1>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {isCompleted
                  ? 'The energy has been transferred and the reservation is now closed.'
                  : `This transaction is currently ${transaction.transferStatus}.`}
              </p>

              <div className="mt-6 flex justify-center">
                <TransactionStatusPill status={transaction.transferStatus} />
              </div>
            </motion.section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-slate-400" />
                <h2 className="text-base font-semibold text-slate-950 dark:text-white">Transfer receipt</h2>
              </div>

              <ReceiptRow label="Transaction ID" value={transaction.transactionId} />
              <ReceiptRow label="Reservation ID" value={transaction.reservationId} />
              <ReceiptRow
                label="Prosumer"
                value={transaction.prosumerName || transaction.prosumerNIC}
              />
              <ReceiptRow
                label="Station"
                value={transaction.stationName || transaction.stationId}
              />
              <ReceiptRow label="Energy transferred" value={formatEnergy(transaction.energyAmount)} />
              <ReceiptRow
                label="Booking"
                value={`${formatDate(transaction.slotDate)} · ${transaction.slotTime}`}
              />
              <ReceiptRow label="Completed at" value={formatDateTime(transaction.completedDate)} />
              <ReceiptRow
                label="Confirmed by"
                value={transaction.operatorName || transaction.operatorId || '—'}
              />
              {transaction.remarks && <ReceiptRow label="Remarks" value={transaction.remarks} />}
            </section>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/operator/transfers/scan')}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-amber-400"
              >
                <QrCode className="h-4 w-4" />
                Scan next code
              </button>

              <button
                type="button"
                onClick={() => navigate('/operator/transfers')}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Back to dashboard
              </button>
            </div>
          </>
        )
      )}
    </div>
  )
}
