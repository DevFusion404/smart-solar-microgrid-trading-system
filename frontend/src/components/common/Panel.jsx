import clsx from 'clsx'

export function Panel({ children, className, ...props }) {
  return (
    <section
      className={clsx(
        'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/80',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  )
}

export function SectionHeading({ title, description, action, className }) {
  return (
    <div className={clsx('flex items-start justify-between gap-4', className)}>
      <div>
        <h2 className="text-base font-semibold text-slate-950 dark:text-white">{title}</h2>
        {description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}
