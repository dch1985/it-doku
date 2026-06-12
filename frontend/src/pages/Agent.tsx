import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bot,
  ChevronDown,
  ClipboardList,
  FileSearch,
  FileText,
  Loader2,
  Play,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { AgentRun, Skill } from '@/lib/types'
import { cn, timeAgo } from '@/lib/utils'
import { navigate } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SeverityBadge, StatusBadge } from '@/components/badges'

const skillIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'coverage-analysis': FileSearch,
  'health-audit': ClipboardList,
  'asset-doc-generator': Sparkles,
}

export function Agent() {
  const queryClient = useQueryClient()

  const { data: skills, isLoading: skillsLoading } = useQuery({
    queryKey: ['agent-skills'],
    queryFn: api.agent.skills,
  })
  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ['agent-runs'],
    queryFn: api.agent.runs,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['agent-runs'] })
    queryClient.invalidateQueries({ queryKey: ['documents'] })
    queryClient.invalidateQueries({ queryKey: ['assets'] })
    queryClient.invalidateQueries({ queryKey: ['stats'] })
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Agent</h1>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          The Trust Doc agent is a rule-based IT documentation expert. It inspects your inventory
          and library, reports what is wrong and fixes what it safely can - no chat, no generative
          AI, fully traceable.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {skillsLoading &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        {(skills ?? []).map((skill) => (
          <SkillCard key={skill.id} skill={skill} onCompleted={invalidate} />
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight">Run history</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Every run is recorded with its steps, findings and actions.
        </p>
        <div className="mt-4 space-y-3">
          {runsLoading &&
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          {!runsLoading && (runs ?? []).length === 0 && (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <Bot className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium">No runs yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Run a skill above - results will show up here with full traceability.
              </p>
            </div>
          )}
          {(runs ?? []).map((run) => (
            <RunCard key={run.id} run={run} />
          ))}
        </div>
      </div>
    </div>
  )
}

function SkillCard({ skill, onCompleted }: { skill: Skill; onCompleted: () => void }) {
  const [input, setInput] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {}
    for (const def of skill.inputs) {
      if (def.type === 'boolean') initial[def.key] = def.default ?? false
    }
    return initial
  })

  const needsAssets = skill.inputs.some((i) => i.type === 'assetId')
  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: () => api.assets.list(),
    enabled: needsAssets,
  })

  const runMutation = useMutation({
    mutationFn: () => api.agent.run(skill.id, input),
    onSuccess: (run) => {
      onCompleted()
      toast.success(run.summary ?? `${skill.name} completed`)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const Icon = skillIcons[skill.id] ?? Bot

  return (
    <div className="flex flex-col rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="mt-3 font-semibold">{skill.name}</h3>
      <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted-foreground">
        {skill.description}
      </p>
      <p className="mt-3 flex items-start gap-1.5 rounded-md bg-accent/60 px-2.5 py-2 text-xs leading-snug text-accent-foreground">
        <Wrench className="mt-0.5 h-3 w-3 shrink-0" />
        {skill.writes}
      </p>

      {skill.inputs.length > 0 && (
        <div className="mt-4 space-y-3 border-t pt-4">
          {skill.inputs.map((def) =>
            def.type === 'boolean' ? (
              <div key={def.key} className="flex items-center justify-between gap-2">
                <Label htmlFor={`${skill.id}-${def.key}`} className="text-xs font-medium">
                  {def.label}
                </Label>
                <Switch
                  id={`${skill.id}-${def.key}`}
                  checked={input[def.key] === true}
                  onCheckedChange={(checked) =>
                    setInput((prev) => ({ ...prev, [def.key]: checked }))
                  }
                />
              </div>
            ) : (
              <div key={def.key} className="space-y-1.5">
                <Label className="text-xs font-medium">{def.label}</Label>
                <Select
                  value={(input[def.key] as string) ?? 'ALL'}
                  onValueChange={(value) =>
                    setInput((prev) => {
                      const next = { ...prev }
                      if (value === 'ALL') delete next[def.key]
                      else next[def.key] = value
                      return next
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All assets</SelectItem>
                    {(assets ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          )}
        </div>
      )}

      <Button className="mt-4" onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
        {runMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {runMutation.isPending ? 'Running…' : 'Run skill'}
      </Button>
    </div>
  )
}

function RunCard({ run }: { run: AgentRun }) {
  const [open, setOpen] = useState(false)
  const Icon = skillIcons[run.skillId] ?? Bot

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{run.skillName}</span>
            <StatusBadge status={run.status} />
            <span className="text-xs text-muted-foreground">
              {timeAgo(run.createdAt)}
              {run.durationMs != null && ` · ${run.durationMs} ms`}
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{run.summary}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
          <span>{run.findings.length} findings</span>
          <span>{run.actions.length} actions</span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div className="space-y-5 border-t px-4 py-4">
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Steps
            </h4>
            <ol className="mt-2 space-y-2">
              {run.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-medium">{step.label}</span>
                    <span className="text-muted-foreground"> - {step.detail}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {run.findings.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Findings
              </h4>
              <div className="mt-2 space-y-2">
                {run.findings.map((finding, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-md bg-muted/50 px-3 py-2.5">
                    <SeverityBadge severity={finding.severity} className="mt-0.5 shrink-0" />
                    <div className="min-w-0 text-sm">
                      <p className="font-medium">{finding.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {finding.detail}
                      </p>
                      {finding.documentId && (
                        <button
                          onClick={() => navigate(`document/${finding.documentId}`)}
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <FileText className="h-3 w-3" />
                          Open document
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {run.actions.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions taken
              </h4>
              <div className="mt-2 space-y-1.5">
                {run.actions.map((action, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Wrench className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{action.label}</span>
                    {action.documentId && (
                      <button
                        onClick={() => navigate(`document/${action.documentId}`)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        open
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
