import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, ClipboardCheck, Database, FileText, Network, Server, ShieldCheck, Sparkles } from 'lucide-react'

const skills = [
  {
    id: 'server',
    title: 'Server Documentation Expert',
    description: 'Build a complete server runbook with ownership, OS, patching, access, monitoring, and recovery evidence.',
    icon: Server,
    level: 'Core',
    output: 'Server runbook',
    checklist: ['Inventory identity and owner', 'Record OS, roles, ports, and dependencies', 'Add monitoring and backup proof', 'Define recovery and escalation steps'],
  },
  {
    id: 'infrastructure',
    title: 'Infrastructure Mapper',
    description: 'Capture infrastructure topology, dependencies, service owners, lifecycle status, and change risk.',
    icon: Network,
    level: 'Core',
    output: 'Infrastructure map',
    checklist: ['List critical services and upstream dependencies', 'Map network zones and trust boundaries', 'Attach diagrams and source references', 'Flag missing owners or stale assets'],
  },
  {
    id: 'security',
    title: 'Security Baseline Reviewer',
    description: 'Check documentation against access, hardening, logging, backup, and audit requirements.',
    icon: ShieldCheck,
    level: 'Governance',
    output: 'Control gap report',
    checklist: ['Verify privileged access model', 'Check logging and retention evidence', 'Review backup and restore proof', 'Document exceptions with owners'],
  },
  {
    id: 'backup',
    title: 'Backup and DR Specialist',
    description: 'Create backup documentation that proves RPO, RTO, restore ownership, schedule, and test cadence.',
    icon: ClipboardCheck,
    level: 'Operations',
    output: 'DR procedure',
    checklist: ['Capture backup scope and schedule', 'Record RPO/RTO targets', 'Add restore test evidence', 'Define failover and rollback owners'],
  },
  {
    id: 'knowledge',
    title: 'Knowledge Curator',
    description: 'Turn scattered notes into structured knowledge nodes linked to real documentation.',
    icon: Database,
    level: 'Knowledge',
    output: 'Linked knowledge base',
    checklist: ['Identify duplicated or orphaned knowledge', 'Link facts to source documents', 'Tag systems, controls, and processes', 'Prepare review-ready summaries'],
  },
]

const principles = [
  'Task-first workflows instead of open-ended chat',
  'Citations, checklists, and evidence before answers',
  'Purpose-built IT documentation expertise',
  'Human approval for every material change',
]

export default function AgentSkills() {
  const [activeSkillId, setActiveSkillId] = useState(skills[0].id)
  const activeSkill = skills.find((skill) => skill.id === activeSkillId) ?? skills[0]
  const ActiveIcon = activeSkill.icon

  return (
    <div className='space-y-8'>
      <section className='overflow-hidden rounded-3xl border bg-card shadow-sm'>
        <div className='grid gap-6 p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10'>
          <div className='space-y-6'>
            <Badge variant='secondary' className='w-fit gap-2 rounded-full px-3 py-1'>
              <Sparkles className='h-3.5 w-3.5' />
              Agentic skills, no chatbot
            </Badge>
            <div className='space-y-3'>
              <h1 className='max-w-3xl text-4xl font-semibold tracking-tight lg:text-5xl'>
                Expert workflows for trustworthy IT documentation.
              </h1>
              <p className='max-w-2xl text-lg text-muted-foreground'>
                Trust Doc uses focused skills for servers, infrastructure, security, backup, and knowledge work. Each skill guides the user through the right evidence and leaves a reviewable output.
              </p>
            </div>
            <div className='flex flex-wrap gap-3'>
              <Button size='lg' onClick={() => { window.location.hash = 'docs' }}>
                <FileText className='mr-2 h-4 w-4' />
                Start from documentation
              </Button>
              <Button size='lg' variant='outline' onClick={() => { window.location.hash = 'knowledge' }}>
                Open knowledge workspace
              </Button>
            </div>
          </div>
          <div className='rounded-3xl border bg-muted/40 p-6'>
            <p className='mb-4 text-sm font-medium text-muted-foreground'>Design principles</p>
            <div className='space-y-3'>
              {principles.map((principle) => (
                <div key={principle} className='flex items-start gap-3 rounded-2xl bg-background/70 p-3'>
                  <CheckCircle2 className='mt-0.5 h-4 w-4 text-primary' />
                  <span className='text-sm'>{principle}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className='grid gap-6 lg:grid-cols-[0.9fr_1.1fr]'>
        <Card className='h-fit'>
          <CardHeader>
            <CardTitle>Skill library</CardTitle>
            <CardDescription>Choose the expert workflow that matches the documentation job.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {skills.map((skill) => {
              const Icon = skill.icon
              const isActive = skill.id === activeSkill.id

              return (
                <button
                  key={skill.id}
                  type='button'
                  onClick={() => setActiveSkillId(skill.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition hover:border-primary/60 hover:bg-muted/50 ${isActive ? 'border-primary bg-muted' : 'bg-background'}`}
                >
                  <div className='flex items-start gap-3'>
                    <div className='rounded-xl bg-primary/10 p-2 text-primary'>
                      <Icon className='h-5 w-5' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <p className='font-medium'>{skill.title}</p>
                        <Badge variant='outline' className='text-[10px]'>{skill.level}</Badge>
                      </div>
                      <p className='mt-1 text-sm text-muted-foreground'>{skill.description}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <Card className='overflow-hidden'>
          <CardHeader className='border-b bg-muted/30'>
            <div className='flex items-start gap-4'>
              <div className='rounded-2xl bg-primary p-3 text-primary-foreground'>
                <ActiveIcon className='h-6 w-6' />
              </div>
              <div>
                <CardTitle>{activeSkill.title}</CardTitle>
                <CardDescription>{activeSkill.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-6 p-6'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='rounded-2xl border p-4'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>Primary output</p>
                <p className='mt-2 text-lg font-semibold'>{activeSkill.output}</p>
              </div>
              <div className='rounded-2xl border p-4'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>Guardrail</p>
                <p className='mt-2 text-lg font-semibold'>Evidence required</p>
              </div>
            </div>

            <div>
              <h3 className='mb-3 text-sm font-semibold'>Runbook checklist</h3>
              <div className='space-y-3'>
                {activeSkill.checklist.map((item, index) => (
                  <div key={item} className='flex items-start gap-3 rounded-2xl border bg-background p-4'>
                    <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground'>
                      {index + 1}
                    </span>
                    <p className='text-sm'>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className='rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground'>
              Skills are designed as guided work packages. They prepare structure, ask for missing evidence, and route the result into documentation for review instead of producing uncontrolled chat output.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
