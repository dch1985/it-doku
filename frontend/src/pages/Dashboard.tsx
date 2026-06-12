import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileText,
  GitBranch,
  Network,
  Plus,
  Server,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { useDocuments } from '@/hooks/useDocuments'
import { useTemplates } from '@/hooks/useTemplates'
import { useAnalytics } from '@/hooks/useAnalytics'
import { TemplateForm } from '@/components/TemplateForm'

type TemplateItem = ReturnType<typeof useTemplates>['templates'][number]

type DocumentationSkill = {
  title: string
  description: string
  outcome: string
  suggestedTitle: string
  category: string
  icon: LucideIcon
}

const documentationSkills: DocumentationSkill[] = [
  {
    title: 'Server baseline',
    description: 'Capture roles, owners, operating system, access model, patching, monitoring, and backup facts.',
    outcome: 'Complete server runbook',
    suggestedTitle: 'Server baseline documentation',
    category: 'DOCUMENTATION',
    icon: Server,
  },
  {
    title: 'Infrastructure map',
    description: 'Document services, dependencies, data flows, criticality, and recovery expectations in one place.',
    outcome: 'Service dependency view',
    suggestedTitle: 'Infrastructure service map',
    category: 'KNOWLEDGE_BASE',
    icon: GitBranch,
  },
  {
    title: 'Network readiness',
    description: 'Standardize device inventory, VLANs, WAN links, firewall zones, routing, and support handover notes.',
    outcome: 'Network operations sheet',
    suggestedTitle: 'Network readiness documentation',
    category: 'DOCUMENTATION',
    icon: Network,
  },
  {
    title: 'Compliance evidence',
    description: 'Check documentation for ownership, review date, requirement IDs, change history, and audit evidence.',
    outcome: 'Audit-ready record',
    suggestedTitle: 'Compliance evidence pack',
    category: 'TEMPLATE',
    icon: ShieldCheck,
  },
]

const readinessChecks = [
  'Owners and escalation paths are visible',
  'Backup and restore notes are documented',
  'Dependencies and ports are linked',
  'Review dates and evidence are tracked',
]

export function Dashboard() {
  const [newDocDialog, setNewDocDialog] = useState(false)
  const [templatesDialog, setTemplatesDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null)
  const [templateFormOpen, setTemplateFormOpen] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newDocCategory, setNewDocCategory] = useState('DOCUMENTATION')
  const { documents, createDocument, refetch } = useDocuments()
  const { templates, loading: templatesLoading, useTemplate: createFromTemplate, seedTemplates } = useTemplates()
  const { data: analyticsData } = useAnalytics()

  const systemMetrics = analyticsData?.system
  const centralizeMetrics = analyticsData?.centralize
  const complyMetrics = analyticsData?.comply
  const openFindings = complyMetrics?.findings.openBySeverity.reduce((sum, item) => sum + item.count, 0) ?? 0
  const coveredDocuments = centralizeMetrics?.knowledge.documentsWithCoverage ?? 0
  const uncoveredDocuments = centralizeMetrics?.knowledge.documentsWithoutCoverage ?? 0

  const handleNewDocument = async () => {
    if (!newDocTitle.trim() || !newDocCategory) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      await createDocument({
        title: newDocTitle,
        category: newDocCategory,
        content: ''
      })
      setNewDocDialog(false)
      setNewDocTitle('')
      setNewDocCategory('DOCUMENTATION')
      await refetch()
    } catch {
      // handled in hook
    }
  }

  const startSkillDocument = (skill: DocumentationSkill) => {
    setNewDocTitle(skill.suggestedTitle)
    setNewDocCategory(skill.category)
    setNewDocDialog(true)
  }

  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 5)

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  return (
    <div className='space-y-8'>
      <section className='grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]'>
        <Card className='overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-2xl shadow-slate-950/10 dark:from-slate-900 dark:to-slate-950'>
          <CardContent className='relative p-8 lg:p-10'>
            <div className='absolute right-0 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl' />
            <Badge className='mb-6 border-white/20 bg-white/10 text-white hover:bg-white/10'>Trust Doc iteration</Badge>
            <div className='relative max-w-3xl space-y-5'>
              <h1 className='text-4xl font-semibold tracking-tight lg:text-5xl'>
                Expert IT documentation without the chatbot clutter.
              </h1>
              <p className='max-w-2xl text-base leading-7 text-slate-300 lg:text-lg'>
                Trust Doc focuses on structured agentic skills for servers, infrastructure, network, backups, and
                compliance so teams can create complete documentation faster.
              </p>
              <div className='flex flex-col gap-3 sm:flex-row'>
                <Button size='lg' onClick={() => setNewDocDialog(true)} className='bg-white text-slate-950 hover:bg-slate-200'>
                  <Plus className='mr-2 h-4 w-4' />
                  Start documentation
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  onClick={() => setTemplatesDialog(true)}
                  className='border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white'
                >
                  Explore expert templates
                  <ArrowRight className='ml-2 h-4 w-4' />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-primary/10 bg-card/80 shadow-lg shadow-black/5'>
          <CardHeader>
            <CardTitle>Documentation readiness</CardTitle>
            <CardDescription>What Trust Doc checks before a record is reliable.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {readinessChecks.map((check) => (
              <div key={check} className='flex items-start gap-3 rounded-2xl border bg-muted/30 p-3'>
                <CheckCircle2 className='mt-0.5 h-4 w-4 text-green-600' />
                <span className='text-sm'>{check}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Documents</CardTitle>
            <FileText className='h-5 w-5 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{systemMetrics?.totalDocuments ?? documents.length}</div>
            <p className='text-xs text-muted-foreground'>{templates.length} expert templates available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Knowledge Coverage</CardTitle>
            <Database className='h-5 w-5 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{coveredDocuments}</div>
            <p className='text-xs text-muted-foreground'>{uncoveredDocuments} documents still need structure</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Requirement Coverage</CardTitle>
            <ClipboardCheck className='h-5 w-5 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{complyMetrics?.policies.reqIdCoveragePercent ?? 0}%</div>
            <p className='text-xs text-muted-foreground'>{complyMetrics?.policies.documentsWithReqId ?? 0} documents tagged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Open Findings</CardTitle>
            <ShieldCheck className='h-5 w-5 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{openFindings}</div>
            <p className='text-xs text-muted-foreground'>Documentation gaps to resolve</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className='mb-4 flex items-end justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-semibold tracking-tight'>Agentic documentation skills</h2>
            <p className='text-sm text-muted-foreground'>
              Purpose-built workflows for the IT documentation your team actually needs.
            </p>
          </div>
          <Button variant='outline' onClick={() => setTemplatesDialog(true)} className='hidden sm:inline-flex'>
            Templates
          </Button>
        </div>
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {documentationSkills.map((skill) => {
            const Icon = skill.icon

            return (
              <Card key={skill.title} className='group overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg'>
                <CardHeader>
                  <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                    <Icon className='h-5 w-5' />
                  </div>
                  <CardTitle className='text-base'>{skill.title}</CardTitle>
                  <CardDescription>{skill.description}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <Badge variant='secondary'>{skill.outcome}</Badge>
                  <Button variant='ghost' className='w-full justify-between px-0' onClick={() => startSkillDocument(skill)}>
                    Start skill
                    <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <Card className='shadow-sm'>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates in your documentation workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {recentDocuments.length === 0 ? (
              <div className='py-8 text-center text-sm text-muted-foreground'>No recent activity</div>
            ) : (
              recentDocuments.map((doc) => {
                const updatedDate = new Date(doc.updatedAt || doc.createdAt)
                const isRecentlyUpdated = doc.updatedAt && new Date(doc.updatedAt).getTime() !== new Date(doc.createdAt).getTime()

                return (
                  <div
                    key={doc.id}
                    className='flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-accent cursor-pointer'
                    onClick={() => {
                      window.location.hash = `document/${doc.id}`
                    }}
                  >
                    <div className='rounded-full bg-muted p-2 text-blue-500'>
                      <FileText className='h-4 w-4' />
                    </div>
                    <div className='flex-1 space-y-1'>
                      <p className='text-sm font-medium leading-none'>
                        {isRecentlyUpdated ? `${doc.title} Updated` : `${doc.title} Created`}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {formatTimeAgo(updatedDate)} - {doc.category}
                      </p>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 text-xs'
                      onClick={(e) => {
                        e.stopPropagation()
                        window.location.hash = `document/${doc.id}`
                      }}
                    >
                      View
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={newDocDialog} onOpenChange={setNewDocDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create documentation</DialogTitle>
            <DialogDescription>Start with a focused record for your IT environment.</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='doc-title'>Document Title</Label>
              <Input
                id='doc-title'
                placeholder='e.g. Server baseline - DC01'
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='doc-category'>Category</Label>
              <Select value={newDocCategory} onValueChange={setNewDocCategory}>
                <SelectTrigger id='doc-category'>
                  <SelectValue placeholder='Select a category' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='DOCUMENTATION'>Documentation</SelectItem>
                  <SelectItem value='KNOWLEDGE_BASE'>Knowledge Base</SelectItem>
                  <SelectItem value='TEMPLATE'>Template</SelectItem>
                  <SelectItem value='API_SPEC'>Technical Specification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setNewDocDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleNewDocument}>Create Document</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={templatesDialog} onOpenChange={setTemplatesDialog}>
        <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <div>
              <DialogTitle>Expert templates</DialogTitle>
              <DialogDescription>Choose a structured template for infrastructure documentation.</DialogDescription>
            </div>
          </DialogHeader>
          {templatesLoading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-lg'>Loading templates...</div>
            </div>
          ) : templates.length === 0 ? (
            <div className='flex flex-col items-center justify-center space-y-4 py-8'>
              <p className='text-muted-foreground'>No templates available</p>
              <Button
                variant='outline'
                onClick={async () => {
                  try {
                    await seedTemplates(false)
                  } catch {
                    // handled in hook
                  }
                }}
              >
                Install expert templates
              </Button>
            </div>
          ) : (
            <div className='grid gap-4 py-4 md:grid-cols-2 lg:grid-cols-3'>
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className='cursor-pointer transition-colors hover:border-primary'
                  onClick={() => {
                    setSelectedTemplate(template)
                    setTemplateFormOpen(true)
                    setTemplatesDialog(false)
                  }}
                >
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-base'>
                      {template.isNistCompliant && (
                        <Badge variant='default' className='text-xs'>NIST</Badge>
                      )}
                      {template.name}
                    </CardTitle>
                    <CardDescription className='text-xs line-clamp-2'>
                      {template.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='pt-0'>
                    <div className='flex items-center justify-between text-xs text-muted-foreground'>
                      <span>{template.category}</span>
                      <span>{template.usageCount} uses</span>
                    </div>
                    {template.nistFramework && (
                      <Badge variant='outline' className='mt-2 text-xs'>
                        {template.nistFramework}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedTemplate && (
        <TemplateForm
          template={selectedTemplate}
          open={templateFormOpen}
          onClose={() => {
            setTemplateFormOpen(false)
            setSelectedTemplate(null)
          }}
          onSubmit={async (title, customFields) => {
            const document = await createFromTemplate(selectedTemplate.id, title, customFields)
            if (document?.id) {
              window.location.hash = `document/${document.id}`
            }
            toast.success(`Dokument "${title}" erfolgreich erstellt!`)
          }}
        />
      )}
    </div>
  )
}

export default Dashboard