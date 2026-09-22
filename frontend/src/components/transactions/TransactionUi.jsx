/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : TransactionUi.jsx
Description   : Shared presentation pieces for the energy transfer
                screens — status pills, stat cards, empty states
                and the date/energy formatters they all use
Author        : Malmi
=====================================================
*/

import clsx from 'clsx'
import { motion } from 'framer-motion'

/**
 * Tailwind classes for each transfer status, mirroring the palette already
 * used by the shared StatusBadge component.
 */
const statusTones = {
  Pending: 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  Verified: 'bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
  Completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  Rejected: 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300',
  Failed: 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300',
  Active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  Used: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  Expired: 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300',
  Cancelled: 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300',
  Confirmed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  Approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
}

/**
 * Coloured status pill used across every transaction table and detail panel.
 * @param {Object} props - Component props
 * @param {string} props.status - Transfer, QR or reservation status
 */
export function TransactionStatusPill({ status }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        statusTones[status] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || 'Unknown'}
    </span>
  )
}

/**
 * Headline counter card with an icon, used by both dashboards.
 * @param {Object} props - Component props
 * @param {string} props.label - Caption above the value
 * @param {string|number} props.value - The figure to display
 * @param {Function} props.icon - A lucide-react icon component
 * @param {string} [props.detail] - Supporting line under the value
 * @param {string} [props.tone] - Accent colour: amber, blue, emerald or rose
 * @param {number} [props.index] - Position, used to stagger the entrance animation
 * @param {Function} [props.onClick] - Makes the card clickable when supplied
 */
export function TransferStatCard({ label, value, icon: Icon, detail, tone = 'blue', index = 0, onClick }) {
  const tones = {
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-400',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={onClick ? { y: -3 } : undefined}
      onClick={onClick}
      className={clsx(
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition dark:border-slate-800 dark:bg-slate-900',
        onClick && 'cursor-pointer hover:border-emerald-400/50',
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
        </div>
        <span className={clsx('rounded-xl p-2.5', tones[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {detail && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{detail}</p>}
    </motion.div>
  )
}

/**
 * Placeholder shown when a list or table has nothing to display.
 * @param {Object} props - Component props
 * @param {Function} props.icon - A lucide-react icon component
 * @param {string} props.title - Short headline
 * @param {string} [props.description] - Supporting sentence
 * @param {React.ReactNode} [props.action] - Optional call-to-action element
 */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
      <span className="rounded-2xl bg-slate-100 p-3 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/**
 * Small inline spinner used while a page or action is loading.
 * @param {Object} props - Component props
 * @param {string} [props.label] - Text shown beside the spinner
 */
export function InlineSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500 dark:text-slate-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500" />
      {label}
    </div>
  )
}

/**
 * Error banner used by every transfer screen so failures look consistent.
 * @param {Object} props - Component props
 * @param {string} props.message - The error text to display
 * @param {Function} [props.onDismiss] - Shows a dismiss button when supplied
 */
export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
      <p className="min-w-0">{message}</p>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="shrink-0 text-xs font-medium underline">
          Dismiss
        </button>
      )}
    </div>
  )
}

/**
 * Formats an ISO date as "18 Sep 2026".
 * @param {string} value - ISO date string
 * @returns {string} Formatted date, or an em dash when the value is missing
 */
export function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/**
 * Formats an ISO date as "18 Sep 2026, 14:30".
 * @param {string} value - ISO date string
 * @returns {string} Formatted date and time, or an em dash when the value is missing
 */
export function formatDateTime(value) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Formats an energy figure with its unit.
 * @param {number} value - Energy in kWh
 * @returns {string} e.g. "25 kWh"
 */
export function formatEnergy(value) {
  if (value === null || value === undefined) return '—'
  return `${Number(value).toLocaleString()} kWh`
}
