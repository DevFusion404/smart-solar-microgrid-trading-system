import clsx from 'clsx'

const statusStyles = {
  Completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  Online: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  Healthy: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  Processing: 'bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
  Pending: 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  Review: 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  'Needs review': 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  Approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  Confirmed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  Escalated: 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300',
  Maintenance: 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  Offline: 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300',
}

export function StatusBadge({ status }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', statusStyles[status] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300')}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}
