import { clsx } from 'clsx'
import { ReactNode } from 'react'

// ── Button ────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed'
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-accent text-white hover:bg-accent-2 active:scale-95',
    outline: 'border border-border2 text-text2 hover:border-accent hover:text-accent-3',
    ghost:   'text-text2 hover:bg-card hover:text-text',
    danger:  'bg-danger text-white hover:bg-red-400',
  }
  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="h-3.5 w-3.5" />}
      {children}
    </button>
  )
}

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-xl border border-border bg-card p-5', className)}
      {...props}
    >
      {children}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────
type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'purple'

export function Badge({ variant = 'green', children }: { variant?: BadgeVariant; children: ReactNode }) {
  const colors: Record<BadgeVariant, string> = {
    green:  'bg-success/10 text-success',
    amber:  'bg-gold/10 text-gold',
    red:    'bg-danger/10 text-danger',
    blue:   'bg-info/10 text-info',
    purple: 'bg-accent/10 text-accent-3',
  }
  return (
    <span className={clsx('inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium', colors[variant])}>
      {children}
    </span>
  )
}

// ── Stat Card ─────────────────────────────────────────────────
export function StatCard({ label, value, change, changeType }: {
  label: string; value: string | number; change?: string; changeType?: 'up' | 'down' | 'neutral'
}) {
  const changeColor = { up: 'text-success', down: 'text-danger', neutral: 'text-text3' }
  return (
    <Card>
      <p className="mb-2 text-xs text-text3">{label}</p>
      <p className="font-display text-2xl font-bold">{value}</p>
      {change && (
        <p className={clsx('mt-1 text-xs', changeColor[changeType || 'neutral'])}>{change}</p>
      )}
    </Card>
  )
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={clsx('animate-spin', className || 'h-4 w-4')}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

// ── Input ─────────────────────────────────────────────────────
export function Input({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs uppercase tracking-wide text-text3">{label}</label>}
      <input
        className={clsx(
          'w-full rounded-lg border bg-card px-3 py-2.5 text-sm text-text outline-none placeholder:text-text3 focus:border-accent',
          error ? 'border-danger' : 'border-border'
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

// ── Progress Bar ──────────────────────────────────────────────
export function ProgressBar({ value, max, color = 'accent' }: { value: number; max: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg3">
      <div
        className="h-full rounded-full bg-accent transition-all duration-500"
        style={{ width: `${pct}%`, background: `var(--${color})` }}
      />
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────
export function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="mb-4 text-5xl">{icon}</span>
      <h3 className="mb-2 font-display text-lg font-semibold">{title}</h3>
      <p className="max-w-xs text-sm text-text2">{desc}</p>
    </div>
  )
}
