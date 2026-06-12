import { cn, titleCase } from '@/lib/utils'
import type { Severity } from '@/lib/types'

const base =
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide'

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-secondary text-secondary-foreground',
    PUBLISHED: 'bg-success/10 text-success',
    NEEDS_REVIEW: 'bg-warning/10 text-warning',
    ARCHIVED: 'bg-muted text-muted-foreground',
    ACTIVE: 'bg-success/10 text-success',
    MAINTENANCE: 'bg-warning/10 text-warning',
    RETIRED: 'bg-muted text-muted-foreground',
    COMPLETED: 'bg-success/10 text-success',
    RUNNING: 'bg-accent text-accent-foreground',
    FAILED: 'bg-destructive/10 text-destructive',
  }
  return (
    <span className={cn(base, styles[status] ?? 'bg-secondary text-secondary-foreground', className)}>
      {titleCase(status)}
    </span>
  )
}

export function CategoryBadge({ category, className }: { category: string; className?: string }) {
  const styles: Record<string, string> = {
    SERVER: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    NETWORK: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    SECURITY: 'bg-red-500/10 text-red-600 dark:text-red-400',
    BACKUP: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    MONITORING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    RUNBOOK: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    GENERAL: 'bg-secondary text-secondary-foreground',
  }
  return (
    <span className={cn(base, styles[category] ?? styles.GENERAL, className)}>
      {titleCase(category)}
    </span>
  )
}

export function CriticalityBadge({ criticality, className }: { criticality: string; className?: string }) {
  const styles: Record<string, string> = {
    LOW: 'bg-secondary text-secondary-foreground',
    MEDIUM: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    HIGH: 'bg-warning/10 text-warning',
    CRITICAL: 'bg-destructive/10 text-destructive',
  }
  return (
    <span className={cn(base, styles[criticality] ?? styles.MEDIUM, className)}>
      {titleCase(criticality)}
    </span>
  )
}

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const styles: Record<Severity, string> = {
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    warning: 'bg-warning/10 text-warning',
    critical: 'bg-destructive/10 text-destructive',
  }
  return <span className={cn(base, styles[severity], className)}>{titleCase(severity)}</span>
}
