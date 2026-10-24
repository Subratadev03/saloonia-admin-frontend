import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

const fieldClass =
  'w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-ink shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] outline-none transition placeholder:text-muted/70 focus:border-rose/50 focus:bg-white focus:ring-4 focus:ring-rose/10'

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-[13px] font-semibold text-ink/75">{label}</span>
      {children}
    </label>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldClass, props.className)} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldClass, props.className)} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldClass, 'min-h-28', props.className)} />
}
