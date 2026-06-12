import { Badge } from './ui'
import type { Criticality, DocStatus } from '@/lib/types'
import type { Severity } from '@/lib/agents'
import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from 'lucide-react'

export function StatusBadge({ status }: { status: DocStatus }) {
  const map = {
    published: { tone: 'success' as const, label: 'Published' },
    review: { tone: 'warning' as const, label: 'In review' },
    draft: { tone: 'muted' as const, label: 'Draft' },
  }
  const s = map[status]
  return <Badge tone={s.tone}>{s.label}</Badge>
}

export function CriticalityBadge({ criticality }: { criticality: Criticality }) {
  const map = {
    critical: { tone: 'danger' as const, label: 'Critical' },
    high: { tone: 'warning' as const, label: 'High' },
    medium: { tone: 'primary' as const, label: 'Medium' },
    low: { tone: 'muted' as const, label: 'Low' },
  }
  const s = map[criticality]
  return <Badge tone={s.tone}>{s.label}</Badge>
}

export function SeverityIcon({ severity, className }: { severity: Severity; className?: string }) {
  const map = {
    critical: { Icon: AlertOctagon, color: 'text-danger' },
    warning: { Icon: AlertTriangle, color: 'text-warning' },
    info: { Icon: Info, color: 'text-primary' },
    ok: { Icon: CheckCircle2, color: 'text-success' },
  }
  const { Icon, color } = map[severity]
  return <Icon className={`${color} ${className ?? 'h-4 w-4'}`} />
}
