import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bot,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Stethoscope,
  LayoutList,
  Network,
  CalendarClock,
  FileText,
  ArrowUpRight,
  Sparkles,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAgent, parseProposedAction, parseRunSummary, type AgentFinding } from '@/hooks/useAgent'

const SKILL_ICONS: Record<string, typeof Bot> = {
  DOC_HEALTH: Stethoscope,
  TEMPLATE_COMPLIANCE: LayoutList,
  COVERAGE_GAP: Network,
  REVIEW_CYCLE: CalendarClock,
}

const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
  HIGH: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
  MEDIUM: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  LOW: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
}

function severityRank(severity: string) {
  const idx = SEVERITY_ORDER.indexOf(severity as (typeof SEVERITY_ORDER)[number])
  return idx === -1 ? SEVERITY_ORDER.length : idx
}

function formatTimeAgo(dateString: string) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

export function Agent() {
  const { skills, runs, findings, loading, runningSkill, runSkill, applyFinding, dismissFinding } = useAgent()
  const [busyFinding, setBusyFinding] = useState<string | null>(null)

  const openFindings = useMemo(
    () => findings.filter((f) => f.status === 'OPEN').sort((a, b) => severityRank(a.severity) - severityRank(b.severity)),
    [findings]
  )
  const resolvedFindings = useMemo(() => findings.filter((f) => f.status !== 'OPEN'), [findings])

  const handleApply = async (finding: AgentFinding) => {
    setBusyFinding(finding.id)
    try {
      const result = await applyFinding(finding.id)
      const documentId = result?.result?.documentId
      const action = parseProposedAction(finding)
      if (action?.action === 'CREATE_DOCUMENT' && documentId) {
        window.location.hash = `document/${documentId}`
      }
    } catch {
      // toast shown in hook
    } finally {
      setBusyFinding(null)
    }
  }

  const handleDismiss = async (finding: AgentFinding) => {
    setBusyFinding(finding.id)
    try {
      await dismissFinding(finding.id)
    } catch {
      // toast shown in hook
    } finally {
      setBusyFinding(null)
    }
  }

  const runAll = async () => {
    for (const skill of skills) {
      // sequential on purpose: each scan builds on the previous state
      await runSkill(skill.id).catch(() => undefined)
    }
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10'>
              <Bot className='h-5 w-5 text-primary' />
            </div>
            <h2 className='text-3xl font-bold tracking-tight'>Documentation Agent</h2>
          </div>
          <p className='max-w-2xl text-muted-foreground'>
            A rule-based expert for IT documentation. It scans your workspace, flags gaps against server, network and
            backup best practice, and fixes them — only when you approve.
          </p>
        </div>
        <Button size='lg' onClick={runAll} disabled={runningSkill !== null || loading} className='gap-2 self-start'>
          {runningSkill ? <Loader2 className='h-4 w-4 animate-spin' /> : <Sparkles className='h-4 w-4' />}
          Run full audit
        </Button>
      </div>

      {/* Skills */}
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {(loading && skills.length === 0 ? Array.from({ length: 4 }) : skills).map((skill: any, idx) =>
          skill ? (
            <Card key={skill.id} className='flex flex-col transition-shadow hover:shadow-md'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  {(() => {
                    const Icon = SKILL_ICONS[skill.id] ?? Bot
                    return (
                      <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10'>
                        <Icon className='h-4 w-4 text-primary' />
                      </div>
                    )
                  })()}
                  <Button
                    size='sm'
                    variant='outline'
                    className='gap-1.5'
                    disabled={runningSkill !== null}
                    onClick={() => runSkill(skill.id)}
                  >
                    {runningSkill === skill.id ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Play className='h-3.5 w-3.5' />}
                    Run
                  </Button>
                </div>
                <CardTitle className='pt-2 text-base'>{skill.name}</CardTitle>
              </CardHeader>
              <CardContent className='flex flex-1 flex-col gap-3'>
                <p className='text-sm text-muted-foreground'>{skill.description}</p>
                <div className='mt-auto flex flex-wrap gap-1.5'>
                  {skill.checks.map((check: string) => (
                    <span key={check} className='rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground'>
                      {check}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card key={idx} className='h-48 animate-pulse bg-muted/40' />
          )
        )}
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Findings */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Findings</CardTitle>
            <CardDescription>
              Every finding comes with a concrete proposed action. Nothing changes without your approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue='open'>
              <TabsList>
                <TabsTrigger value='open'>Open ({openFindings.length})</TabsTrigger>
                <TabsTrigger value='resolved'>Resolved ({resolvedFindings.length})</TabsTrigger>
              </TabsList>

              <TabsContent value='open' className='mt-4 space-y-3'>
                {openFindings.length === 0 ? (
                  <div className='flex flex-col items-center gap-2 py-12 text-center'>
                    <CheckCircle2 className='h-10 w-10 text-emerald-500' />
                    <p className='font-medium'>No open findings</p>
                    <p className='text-sm text-muted-foreground'>Run a skill to audit your documentation.</p>
                  </div>
                ) : (
                  openFindings.map((finding) => {
                    const action = parseProposedAction(finding)
                    return (
                      <div key={finding.id} className='rounded-xl border p-4 transition-colors hover:bg-muted/30'>
                        <div className='flex flex-wrap items-start justify-between gap-3'>
                          <div className='min-w-0 flex-1 space-y-1.5'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <Badge variant='outline' className={cn('text-[11px]', SEVERITY_STYLES[finding.severity])}>
                                {finding.severity}
                              </Badge>
                              <span className='text-[11px] uppercase tracking-wide text-muted-foreground'>
                                {finding.type.replace(/_/g, ' ')}
                              </span>
                              <span className='text-[11px] text-muted-foreground'>{formatTimeAgo(finding.createdAt)}</span>
                            </div>
                            <p className='text-sm font-medium leading-snug'>{finding.message}</p>
                            {finding.detail && <p className='text-xs text-muted-foreground'>{finding.detail}</p>}
                            {action?.label && (
                              <p className='flex items-center gap-1 text-xs font-medium text-primary'>
                                <Sparkles className='h-3 w-3' />
                                Proposed: {action.label}
                              </p>
                            )}
                          </div>
                          <div className='flex shrink-0 items-center gap-2'>
                            {finding.documentId && (
                              <Button
                                variant='ghost'
                                size='sm'
                                className='gap-1 text-xs'
                                onClick={() => (window.location.hash = `document/${finding.documentId}`)}
                              >
                                <FileText className='h-3.5 w-3.5' />
                                Open
                                <ArrowUpRight className='h-3 w-3' />
                              </Button>
                            )}
                            <Button
                              variant='ghost'
                              size='sm'
                              className='text-xs text-muted-foreground'
                              disabled={busyFinding === finding.id}
                              onClick={() => handleDismiss(finding)}
                            >
                              Dismiss
                            </Button>
                            {action && (
                              <Button size='sm' className='gap-1.5 text-xs' disabled={busyFinding === finding.id} onClick={() => handleApply(finding)}>
                                {busyFinding === finding.id ? (
                                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                                ) : (
                                  <CheckCircle2 className='h-3.5 w-3.5' />
                                )}
                                Apply
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </TabsContent>

              <TabsContent value='resolved' className='mt-4 space-y-2'>
                {resolvedFindings.length === 0 ? (
                  <p className='py-12 text-center text-sm text-muted-foreground'>Nothing resolved yet.</p>
                ) : (
                  resolvedFindings.map((finding) => (
                    <div key={finding.id} className='flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm'>
                      {finding.status === 'APPLIED' ? (
                        <CheckCircle2 className='h-4 w-4 shrink-0 text-emerald-500' />
                      ) : (
                        <XCircle className='h-4 w-4 shrink-0 text-muted-foreground' />
                      )}
                      <span className='min-w-0 flex-1 truncate text-muted-foreground'>{finding.message}</span>
                      <Badge variant='outline' className='shrink-0 text-[11px]'>
                        {finding.status}
                      </Badge>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Run history */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <History className='h-4 w-4' />
              Recent runs
            </CardTitle>
            <CardDescription>The agent's audit history</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {runs.length === 0 ? (
              <p className='py-8 text-center text-sm text-muted-foreground'>No runs yet.</p>
            ) : (
              runs.map((run) => {
                const summary = parseRunSummary(run)
                const skillName = skills.find((s) => s.id === run.skill)?.name ?? run.skill
                return (
                  <div key={run.id} className='rounded-lg border p-3'>
                    <div className='flex items-center justify-between gap-2'>
                      <p className='truncate text-sm font-medium'>{skillName}</p>
                      <Badge variant={run.status === 'COMPLETED' ? 'secondary' : run.status === 'FAILED' ? 'destructive' : 'outline'} className='text-[10px]'>
                        {run.status}
                      </Badge>
                    </div>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      {formatTimeAgo(run.startedAt)}
                      {summary && ` · ${summary.scanned} scanned · ${summary.findings} new finding(s)`}
                    </p>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Agent
