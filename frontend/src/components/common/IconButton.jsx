import clsx from 'clsx'

export function IconButton({ label, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        'rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
