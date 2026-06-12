import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore, type Page } from '@/store/useStore'
import {
  AGENTS,
  getAgent,
  runAnalyzer,
  runBuilder,
  type Agent,
  type AgentResult,
} from '@/lib/agents'
import { DOC_TYPE_ICON } from '@/lib/standards'
import { Badge, Button, Card, Input, Label, Progress, ScoreRing, Select, Textarea } from '@/components/ui'
import { SeverityIcon } from '@/components/badges'
import { DocEditor } from '@/components/DocEditor'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Play,
  Sparkles,
  Zap,
} from 'lucide-react'

export function Agents({
  initialAgentId,
  onNavigate,
}: {
  initialAgentId?: string
  onNavigate: (p: Page) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialAgentId ?? null)

  useEffect(() => {
    setSelectedId(initialAgentId ?? null)
  }, [initialAgentId])

  const agent = selectedId ? getAgent(selectedId) : undefined

  if (agent) {
    return <AgentRunner agent={agent} onBack={() => setSelectedId(null)} onNavigate={onNavigate} />
  }

  const categories = Array.from(new Set(AGENTS.map((a) => a.category)))

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="flex items-center gap-4 border-0 bg-gradient-to-br from-primary/10 to-accent/10 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl brand-gradient text-white shadow-lg shadow-primary/30">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Expert agents, not a chatbot</h2>
          <p className="text-sm text-muted-foreground">
            Deterministic skills that build, audit and certify your IT documentation. Predictable
            results every run — nothing is invented.
          </p>
        </div>
      </Card>

      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AGENTS.filter((a) => a.category === cat).map((a) => (
              <AgentCard key={a.id} agent={a} onClick={() => setSelectedId(a.id)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function AgentCard({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  const Icon = agent.icon
  return (
    <Card
      onClick={onClick}
      className="group flex cursor-pointer flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${agent.accent} text-white shadow-md`}>
          <Icon className="h-5 w-5" />
        </div>
        <Badge tone={agent.kind === 'builder' ? 'accent' : 'primary'}>
          {agent.kind === 'builder' ? 'Builder' : 'Analyzer'}
        </Badge>
      </div>
      <h4 className="mt-3 font-semibold">{agent.name}</h4>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{agent.tagline}</p>
      <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Open agent <ArrowLeft className="h-3 w-3 rotate-180" />
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Runner                                                              */
/* ------------------------------------------------------------------ */

function AgentRunner({
  agent,
  onBack,
  onNavigate,
}: {
  agent: Agent
  onBack: () => void
  onNavigate: (p: Page) => void
}) {
  const docs = useStore((s) => s.docs)
  const addDoc = useStore((s) => s.addDoc)
  const Icon = agent.icon

  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    agent.inputs?.forEach((i) => {
      if (i.type === 'select' && i.options?.length) init[i.key] = i.options[0]
    })
    return init
  })
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(0)
  const [result, setResult] = useState<AgentResult | null>(null)
  const [openDocId, setOpenDocId] = useState<string | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const canRun = useMemo(() => {
    if (agent.kind !== 'builder') return true
    return (agent.inputs ?? []).filter((i) => i.required).every((i) => form[i.key]?.trim())
  }, [agent, form])

  const run = () => {
    setResult(null)
    setRunning(true)
    setStep(0)
    timers.current.forEach(clearTimeout)
    timers.current = []

    agent.steps.forEach((_, idx) => {
      const t = window.setTimeout(() => setStep(idx + 1), 420 * (idx + 1))
    timers.current.push(t)
    })

    const finish = window.setTimeout(() => {
      let res: AgentResult
      if (agent.kind === 'builder') {
        res = runBuilder(agent, form)
        addDoc(res.doc)
      } else {
        res = runAnalyzer(agent.id, docs)
      }
      setResult(res)
      setRunning(false)
    }, 420 * (agent.steps.length + 1))
    timers.current.push(finish)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All agents
      </button>

      {/* header */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${agent.accent} text-white shadow-lg`}>
            <Icon className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{agent.name}</h2>
              <Badge tone={agent.kind === 'builder' ? 'accent' : 'primary'}>
                {agent.kind === 'builder' ? 'Builder' : 'Analyzer'}
              </Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{agent.description}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {agent.skills.map((skill) => (
            <div key={skill} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
              <span>{skill}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* input / run panel */}
        <Card className="space-y-4 p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold">{agent.kind === 'builder' ? 'Input facts' : 'Run analysis'}</h3>

          {agent.kind === 'builder' ? (
            <div className="grid grid-cols-2 gap-3">
              {agent.inputs?.map((input) => (
                <div key={input.key} className={input.half ? '' : 'col-span-2'}>
                  <Label>
                    {input.label} {input.required && <span className="text-danger">*</span>}
                  </Label>
                  {input.type === 'select' ? (
                    <Select
                      value={form[input.key] ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, [input.key]: e.target.value }))}
                    >
                      {input.options?.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  ) : input.type === 'textarea' ? (
                    <Textarea
                      rows={2}
                      value={form[input.key] ?? ''}
                      placeholder={input.placeholder}
                      onChange={(e) => setForm((f) => ({ ...f, [input.key]: e.target.value }))}
                    />
                  ) : (
                    <Input
                      value={form[input.key] ?? ''}
                      placeholder={input.placeholder}
                      onChange={(e) => setForm((f) => ({ ...f, [input.key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
              This agent will analyze all <b className="text-foreground">{docs.length}</b> documents in
              your library and produce a report. No input required.
            </div>
          )}

          <Button onClick={run} disabled={!canRun || running} className="w-full" size="lg">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? 'Running…' : agent.kind === 'builder' ? 'Generate document' : 'Run agent'}
          </Button>
          {!canRun && agent.kind === 'builder' && (
            <p className="text-center text-xs text-muted-foreground">Fill the required fields to run.</p>
          )}

          {/* steps */}
          {(running || result) && (
            <div className="space-y-2 border-t border-border pt-4">
              {agent.steps.map((label, idx) => {
                const done = step > idx || (!!result && !running)
                const current = running && step === idx
                return (
                  <div key={label} className="flex items-center gap-2.5 text-xs">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        done ? 'bg-accent text-white' : current ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {done ? <Check className="h-3 w-3" /> : current ? <Loader2 className="h-3 w-3 animate-spin" /> : idx + 1}
                    </span>
                    <span className={done || current ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* result panel */}
        <div className="lg:col-span-3">
          {!result && !running && (
            <Card className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Zap className="h-7 w-7" />
              </div>
              <p className="max-w-xs text-sm text-muted-foreground">
                Run the agent to see results here. Output is deterministic and based only on your data.
              </p>
            </Card>
          )}
          {running && !result && (
            <Card className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/30" />
                <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${agent.accent} text-white`}>
                  <Icon className="h-7 w-7" />
                </div>
              </div>
              <p className="text-sm font-medium">{agent.steps[Math.min(step, agent.steps.length - 1)]}…</p>
            </Card>
          )}
          {result?.kind === 'builder' && (
            <BuilderResultView
              result={result}
              onOpen={() => setOpenDocId(result.doc.id)}
              onLibrary={() => onNavigate('documentation')}
            />
          )}
          {result?.kind === 'analyzer' && <AnalyzerResultView result={result} />}
        </div>
      </div>

      {openDocId && <DocEditor docId={openDocId} onClose={() => setOpenDocId(null)} />}
    </div>
  )
}

function BuilderResultView({
  result,
  onOpen,
  onLibrary,
}: {
  result: Extract<AgentResult, { kind: 'builder' }>
  onOpen: () => void
  onLibrary: () => void
}) {
  const Icon = DOC_TYPE_ICON[result.doc.type]
  return (
    <Card className="animate-fade-in p-5">
      <div className="flex items-center gap-2 text-success">
        <CheckCircle2 className="h-5 w-5" />
        <span className="text-sm font-semibold">Document generated & added to library</span>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">{result.doc.title}</div>
          <div className="text-xs text-muted-foreground">
            {result.doc.sections.length} sections · {result.completeness.score}% complete
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onLibrary}>
            Library
          </Button>
          <Button size="sm" onClick={onOpen}>
            <ExternalLink className="h-3.5 w-3.5" /> Open & finish
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium">Completeness</span>
          <span className="font-semibold">{result.completeness.score}%</span>
        </div>
        <Progress
          value={result.completeness.score}
          barClassName={result.completeness.score >= 75 ? 'bg-success' : 'bg-warning'}
        />
      </div>

      {result.notes.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Flagged for completion ({result.notes.length})
          </h4>
          <ul className="space-y-1.5">
            {result.notes.map((n, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <SeverityIcon severity="warning" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-border p-3">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</h4>
        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
          {result.doc.sections.map((s) => (
            <div key={s.heading}>
              <div className="text-xs font-semibold">{s.heading}</div>
              <p className="whitespace-pre-line text-[11px] leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function AnalyzerResultView({ result }: { result: Extract<AgentResult, { kind: 'analyzer' }> }) {
  return (
    <Card className="animate-fade-in p-5">
      <div className="flex items-center gap-4">
        <ScoreRing value={result.score} size={76} />
        <div>
          <div className="text-sm font-semibold">{result.scoreLabel}</div>
          <p className="mt-0.5 text-xs text-muted-foreground">{result.summary}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {result.stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-muted/50 p-3 text-center">
            <div className="text-lg font-bold">{s.value}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {result.groups && (
        <div className="mt-5 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Control families</h4>
          {result.groups.map((g) => (
            <div key={g.title} className="rounded-xl border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{g.title}</div>
                  <div className="text-[10px] text-muted-foreground">{g.reference}</div>
                </div>
                <Badge tone={g.coverage >= 75 ? 'success' : g.coverage >= 50 ? 'warning' : 'danger'}>{g.coverage}%</Badge>
              </div>
              <Progress
                value={g.coverage}
                className="mb-2"
                barClassName={g.coverage >= 75 ? 'bg-success' : g.coverage >= 50 ? 'bg-warning' : 'bg-danger'}
              />
              <div className="space-y-1">
                {g.items.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <SeverityIcon severity={item.ok ? 'ok' : 'warning'} className="h-3.5 w-3.5 shrink-0" />
                    <span className={item.ok ? '' : 'text-muted-foreground'}>{item.label}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{item.note}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Findings ({result.findings.filter((f) => f.severity !== 'ok').length})
        </h4>
        <ul className="space-y-2">
          {result.findings.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 rounded-xl border border-border p-2.5">
              <SeverityIcon severity={f.severity} className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium leading-snug">{f.title}</p>
                <p className="text-[11px] text-muted-foreground">{f.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
