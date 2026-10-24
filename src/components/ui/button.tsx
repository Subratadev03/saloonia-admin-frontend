import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type To } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
}

const base =
  'btn-advanced inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-all duration-200 ease-out select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45'

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-[0.95rem]',
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-[#d46264] to-[#a83b40] text-white shadow-[0_10px_24px_-12px_rgba(168,59,64,0.9)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-12px_rgba(168,59,64,0.95)]',
  secondary:
    'border border-line/90 bg-paper/90 text-ink shadow-[0_8px_20px_-16px_rgba(28,20,16,0.5)] hover:-translate-y-0.5 hover:border-gold/70 hover:bg-white',
  ghost: 'text-ink hover:bg-white/70',
  dark: 'bg-ink text-ivory shadow-[0_12px_24px_-14px_rgba(28,20,16,0.85)] hover:-translate-y-0.5 hover:bg-[#2b211c]',
  danger:
    'bg-gradient-to-b from-[#b54444] to-[#7d2424] text-white shadow-[0_10px_24px_-12px_rgba(125,36,36,0.85)] hover:-translate-y-0.5',
}

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}) {
  return cn(base, sizes[size], variants[variant], className)
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={buttonClassName({ variant, size, className })}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : icon ? (
        <span className="grid place-items-center">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  )
}

export function ButtonLink({
  to,
  children,
  variant = 'primary',
  size = 'md',
  className,
  icon,
}: {
  to: To
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  icon?: ReactNode
}) {
  return (
    <Link to={to} className={buttonClassName({ variant, size, className })}>
      {icon ? <span className="grid place-items-center">{icon}</span> : null}
      <span>{children}</span>
    </Link>
  )
}
