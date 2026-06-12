import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Sparkles,
  Play,
  Check,
  Loader2,
  Save,
  RotateCcw,
  CircleDot,
} from 'lucide-react'
import { toast } from 'sonner'
import { agentSkills, getSkill, type GeneratedDoc } from '../agent/skills'
import { useTrustDocStore } from '../store'
import { Markdown } from '../Markdown'
import { CategoryTag } from '../ui'
import { cn } from '@/lib/utils'

type Phase = 'configure' | 'running' | 'result'

function navigate(hash: string) {
  window.location.hash = hash
}

export function Agent({ initialSkillId }: { initialSkillId?: string }) {
  const assets = useTrustDocStore((s) => s.assets)
  const documents = useTrustDocStore((s) => s.documents)
  const createDocument = useTrustDocStore((s) => s.createDocument)

  const [skillId, setSkillId] = useState<string | undefined>(initialSkillId)
  const [phase, setPhase] = useState<Phase>('configure')
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [stepIndex, setStepIndex] = useState(0)
  const [result, setResult] = useState<GeneratedDoc | null>(null)
  const timers = useRef<number[]>([])

  const skill = skillId ? getSkill(skillId) : undefined

  useEffect(() => {
    setSkillId(initialSkillId)
  }, [initialSkillId])

  // Initialize inputs with defaults when a skill is selected.
  useEffect(() => {
    if (!skill) return
    const init: Record<string, string> = {}
    skill.fields.forEach((f) => {
      init[f.id] = f.defaultValue || ''
    })
    setInputs(init)
    setPhase('configure')
    setResult(null)
    setStepIndex(0)
  }, [skillId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => timers.current.forEach((t) => clearTimeout(t))
  }, [])

  const selectSkill = (id: string) => {
    navigate(`agent/${id}`)
    setSkillId(id)
  }

  const backToSkills = () => {
    navigate('agent')
    setSkillId(undefined)
    setResult(null)
    setPhase('configure')
  }

  const run = () => {
    if (!skill) return
    const missing = skill.fields.filter((f) => f.required && !(inputs[f.id] || '').trim())
    if (missing.length) {
      toast.error(`Please fill in: ${missing.map((m) => m.label).join(', ')}`)
      return
    }
    timers.current.forEach((t) => clearTimeout(t))
    timers.current = []
    setPhase('running')
    setStepIndex(0)

    const stepMs = 650
    skill.plan.forEach((_, i) => {
      const t = window.setTimeout(() => setStepIndex(i + 1), stepMs * (i + 1))
      timers.current.push(t)
    })
    const done = window.setTimeout(() => {
      const generated = skill.generate(inputs, { assets, documents })
      setResult(generated)
      setPhase('result')
    }, stepMs * (skill.plan.length + 1))
    timers.current.push(done)
  }

  const save = () => {
    if (!skill || !result) return
    // Auto-link to an asset when the hostname/device name matches the inventory.
    const nameInput = (inputs.hostname || inputs.name || '').trim().toLowerCase()
    const matched = nameInput
      ? assets.find((a) => a.name.toLowerCase() === nameInput)
      : undefined
    const doc = createDocument({
      title: result.title,
      category: result.category,
      status: 'In Review',
      owner: (inputs.owner || 'TrustDoc Agent').trim() || 'TrustDoc Agent',
      tags: result.tags,
      content: result.content,
      linkedAssetId: matched?.id ?? null,
      generatedByAgent: true,
      skillId: skill.id,
    })
    toast.success('Saved to library')
    navigate(`document/${doc.id}`)
  }

  // ---- Skill gallery ----
  if (!skill) {
    return (
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6 lg:p-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Agentic, not a chatbot
          </div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">TrustDoc Agent</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            A focused documentation expert with skills for servers, networks, infrastructure,
            backup, security and quality. Pick a skill, give it a few facts, and it drafts
            standardized documentation for you.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agentSkills.map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.id} className="card-hover flex flex-col">
                <CardHeader>
                  <div className={cn('mb-3 flex h-11 w-11 items-center justify-center rounded-xl', s.accent)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{s.name}</CardTitle>
                  <CardDescription>{s.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button onClick={() => selectSkill(s.id)} className="w-full gap-2">
                    <Play className="h-4 w-4" /> Use skill
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  const SkillIcon = skill.icon

  // ---- Skill workspace ----
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={backToSkills} className="gap-2 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> All skills
      </Button>

      <div className="flex items-start gap-4">
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', skill.accent)}>
          <SkillIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{skill.name}</h1>
          <p className="text-muted-foreground">{skill.description}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inputs</CardTitle>
            <CardDescription>
              {skill.fields.length === 0
                ? 'This skill reads directly from your inventory — no input required.'
                : 'Give the agent the essentials; it expands the rest.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {skill.fields.map((f) => (
              <div key={f.id} className="space-y-2">
                <Label htmlFor={f.id}>
                  {f.label}
                  {f.required && <span className="ml-1 text-destructive">*</span>}
                </Label>
                {f.type === 'textarea' ? (
                  <Textarea
                    id={f.id}
                    placeholder={f.placeholder}
                    value={inputs[f.id] || ''}
                    onChange={(e) => setInputs({ ...inputs, [f.id]: e.target.value })}
                    rows={3}
                  />
                ) : f.type === 'select' ? (
                  <Select
                    value={inputs[f.id] || ''}
                    onValueChange={(v) => setInputs({ ...inputs, [f.id]: v })}
                  >
                    <SelectTrigger id={f.id}>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options?.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={f.id}
                    placeholder={f.placeholder}
                    value={inputs[f.id] || ''}
                    onChange={(e) => setInputs({ ...inputs, [f.id]: e.target.value })}
                  />
                )}
                {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
              </div>
            ))}
            <Button onClick={run} disabled={phase === 'running'} className="w-full gap-2">
              {phase === 'running' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Agent working…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Run agent
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Execution plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agent plan</CardTitle>
            <CardDescription>How the agent approaches this task</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {skill.plan.map((step, i) => {
              const isDone = phase !== 'configure' && i < stepIndex
              const isActive = phase === 'running' && i === stepIndex
              return (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition-colors',
                      isDone && 'border-emerald-500 bg-emerald-500 text-white',
                      isActive && 'border-primary text-primary',
                      !isDone && !isActive && 'border-border text-muted-foreground'
                    )}
                  >
                    {isDone ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : isActive ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CircleDot className="h-3 w-3" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-sm',
                      isDone && 'text-muted-foreground line-through decoration-muted-foreground/40',
                      isActive && 'font-medium text-foreground',
                      !isDone && !isActive && 'text-muted-foreground'
                    )}
                  >
                    {step}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Result */}
      {phase === 'result' && result && (
        <Card className="border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Generated draft</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <CategoryTag category={result.category} /> ready to review
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={run} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Re-run
              </Button>
              <Button onClick={save} className="gap-2">
                <Save className="h-4 w-4" /> Save to library
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[520px] overflow-y-auto rounded-lg border bg-muted/30 p-6">
              <Markdown content={result.content} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
