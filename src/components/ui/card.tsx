import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'surface-card rounded-[28px] border border-white/70 ring-1 ring-line/80',
        className,
      )}
      {...props}
    />
  )
}

export function Badge({
  children,
  tone = 'rose',
}: {
  children: ReactNode
  tone?: 'rose' | 'gold' | 'moss' | 'muted'
}) {
  const tones = {
    rose: 'bg-rose/10 text-rose-deep ring-rose/15',
    gold: 'bg-gold/15 text-[#7a5c2c] ring-gold/25',
    moss: 'bg-moss/10 text-moss ring-moss/15',
    muted: 'bg-line/80 text-muted ring-line',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide uppercase ring-1',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}
