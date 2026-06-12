import * as React from 'react'
import { cn } from '@/lib/utils'

/* Button ------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm shadow-primary/20',
  secondary: 'bg-muted text-foreground hover:bg-muted/70',
  ghost: 'hover:bg-muted text-muted-foreground hover:text-foreground',
  outline: 'border border-border bg-transparent hover:bg-muted',
  danger: 'bg-danger text-white hover:opacity-90',
}
const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-sm',
  icon: 'h-9 w-9',
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }
>(({ className, variant = 'primary', size = 'md', ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
      buttonVariants[variant],
      buttonSizes[size],
      className,
    )}
    {...props}
  />
))
Button.displayName = 'Button'

/* Card -------------------------------------------------------------- */

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl border border-border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  )
}

/* Badge ------------------------------------------------------------- */

export function Badge({
  className,
  tone = 'muted',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'muted' | 'primary' | 'success' | 'warning' | 'danger' | 'accent'
}) {
  const tones: Record<string, string> = {
    muted: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/15 text-warning',
    danger: 'bg-danger/10 text-danger',
  }
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}
      {...props}
    />
  )
}

/* Inputs ------------------------------------------------------------ */

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-xl border border-input bg-background px-3 text-sm transition-colors placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-input bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-10 w-full rounded-xl border border-input bg-background px-3 text-sm capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
)
Select.displayName = 'Select'

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-xs font-medium text-muted-foreground', className)} {...props} />
}

/* Progress ---------------------------------------------------------- */

export function Progress({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className={cn('h-full rounded-full bg-primary transition-all duration-500', barClassName)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

/* Ring score -------------------------------------------------------- */

export function ScoreRing({ value, size = 72 }: { value: number; size?: number }) {
  const stroke = 7
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ - (value / 100) * circ
  const color = value >= 75 ? 'hsl(var(--success))' : value >= 50 ? 'hsl(var(--warning))' : 'hsl(var(--danger))'
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-sm font-semibold">{value}%</span>
    </div>
  )
}
