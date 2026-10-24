import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Panel({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        'rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-30px_rgba(28,20,16,0.55)]',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function AdminHeading({
  kicker,
  title,
  subtitle,
  action,
}: {
  kicker?: string
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{kicker}</p>
        ) : null}
        <h1 className="font-serif text-3xl tracking-tight text-ink sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-xl text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function Avatar({
  first,
  last,
  className,
}: {
  first?: string
  last?: string
  className?: string
}) {
  const letters = `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '•'
  return (
    <span
      className={cn(
        'grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#efe6d8] text-sm font-semibold text-[#5c4632]',
        className,
      )}
    >
      {letters}
    </span>
  )
}
