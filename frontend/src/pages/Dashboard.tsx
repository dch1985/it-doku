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
  Plus,
  FileText,
  Bot,
  LayoutTemplate,
  Server,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDocuments } from '@/hooks/useDocuments'
import { useTemplates } from '@/hooks/useTemplates'
import { useAnalytics } from '@/hooks/useAnalytics'
import { TemplateForm } from '@/components/TemplateForm'

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: 'bg-emerald-500',
  REVIEW: 'bg-amber-500',
  DRAFT: 'bg-sky-500',
  ARCHIVED: 'bg-muted-foreground/40',
}

export function Dashboard() {
  const [newDocDialog, setNewDocDialog] = useState(false)
  const [templatesDialog, setTemplatesDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [templateFormOpen, setTemplateFormOpen] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newDocCategory, setNewDocCategory] = useState('DOCUMENTATION')
  const { documents, createDocument, refetch } = useDocuments()
  const { templates, loading: templatesLoading, useTemplate, seedTemplates } = useTemplates()
  const { data: analytics } = useAnalytics()

  const docMetrics = analytics?.documents
  const agentMetrics = analytics?.agent

  const handleNewDocument = async () => {
    if (!newDocTitle.trim() || !newDocCategory) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const newDoc = await createDocument({
        title: newDocTitle,
        category: newDocCategory,
        content: '',
      })
      setNewDocDialog(false)
      setNewDocTitle('')
      setNewDocCategory('DOCUMENTATION')
      await refetch()
      if (newDoc?.id) {
        window.location.hash = `document/${newDoc.id}`
      }
    } catch (error) {
      // handled in hook
    }
  }

  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 6)

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

  const healthScore = agentMetrics?.healthScore ?? 100
  const healthTone =
    healthScore >= 85 ? 'text-emerald-500' : healthScore >= 60 ? 'text-amber-500' : 'text-red-500'

  const statusEntries = Object.entries(docMetrics?.byStatus ?? {}).sort(([a], [b]) => a.localeCompare(b))
  const totalForBar = statusEntries.reduce((sum, [, count]) => sum + count, 0)

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Dashboard</h2>
          <p className='text-muted-foreground'>Your IT documentation workspace at a glance.</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => setTemplatesDialog(true)} className='gap-2'>
            <LayoutTemplate className='h-4 w-4' />
            Templates
          </Button>
          <Button onClick={() => setNewDocDialog(true)} className='gap-2'>
            <Plus className='h-4 w-4' />
            New Document
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Documents</CardTitle>
            <FileText className='h-4 w-4 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{docMetrics?.total ?? documents.length}</div>
            <p className='text-xs text-muted-foreground'>
              {docMetrics?.published ?? 0} published · {docMetrics?.drafts ?? 0} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Documentation Health</CardTitle>
            <ShieldCheck className={cn('h-4 w-4', healthTone)} />
          </CardHeader>
          <CardContent>
            <div className={cn('text-3xl font-bold', healthTone)}>{healthScore}%</div>
            <p className='text-xs text-muted-foreground'>
              {agentMetrics?.openFindings ?? 0} open finding(s) from the agent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Needs Attention</CardTitle>
            <Clock className='h-4 w-4 text-amber-500' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{(docMetrics?.stale ?? 0) + (docMetrics?.inReview ?? 0)}</div>
            <p className='text-xs text-muted-foreground'>
              {docMetrics?.stale ?? 0} stale · {docMetrics?.inReview ?? 0} in review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Infrastructure</CardTitle>
            <Server className='h-4 w-4 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{analytics?.assets.total ?? 0}</div>
            <p className='text-xs text-muted-foreground'>{analytics?.templates.total ?? 0} templates available</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Recent activity */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Activity className='h-4 w-4' />
              Recent Documents
            </CardTitle>
            <CardDescription>Latest updates to your documentation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-1'>
              {recentDocuments.length === 0 ? (
                <div className='py-10 text-center text-sm text-muted-foreground'>
                  No documents yet — create your first one or start from a template.
                </div>
              ) : (
                recentDocuments.map((doc) => {
                  const updatedDate = new Date(doc.updatedAt || doc.createdAt)
                  return (
                    <div
                      key={doc.id}
                      className='group flex cursor-pointer items-center gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent'
                      onClick={() => {
                        window.location.hash = `document/${doc.id}`
                      }}
                    >
                      <div className='rounded-lg bg-primary/10 p-2'>
                        <FileText className='h-4 w-4 text-primary' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-medium'>{doc.title}</p>
                        <p className='text-xs text-muted-foreground'>
                          {formatTimeAgo(updatedDate)} · {doc.category}
                        </p>
                      </div>
                      <Badge variant='outline' className='shrink-0 text-[11px]'>
                        {doc.status}
                      </Badge>
                      <ArrowUpRight className='h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <div className='space-y-6'>
          {/* Status breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Status Overview</CardTitle>
              <CardDescription>Documents by lifecycle status</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {totalForBar === 0 ? (
                <p className='py-4 text-center text-sm text-muted-foreground'>No data yet.</p>
              ) : (
                <>
                  <div className='flex h-2.5 w-full overflow-hidden rounded-full bg-muted'>
                    {statusEntries.map(([status, count]) => (
                      <div
                        key={status}
                        className={cn('h-full', STATUS_COLORS[status] ?? 'bg-primary')}
                        style={{ width: `${(count / totalForBar) * 100}%` }}
                      />
                    ))}
                  </div>
                  <div className='space-y-2'>
                    {statusEntries.map(([status, count]) => (
                      <div key={status} className='flex items-center gap-2 text-sm'>
                        <span className={cn('h-2 w-2 rounded-full', STATUS_COLORS[status] ?? 'bg-primary')} />
                        <span className='flex-1 capitalize text-muted-foreground'>{status.toLowerCase()}</span>
                        <span className='font-medium'>{count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Agent shortcut */}
          <Card className='border-primary/20 bg-gradient-to-br from-primary/5 to-transparent'>
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Bot className='h-4 w-4 text-primary' />
                Documentation Agent
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <p className='text-sm text-muted-foreground'>
                {agentMetrics?.lastRun
                  ? `Last audit: ${new Date(agentMetrics.lastRun.startedAt).toLocaleString()}`
                  : 'No audit yet. Let the agent check your documentation against best practice.'}
              </p>
              <Button variant='outline' className='w-full gap-2' onClick={() => (window.location.hash = 'agent')}>
                <Bot className='h-4 w-4' />
                Open Agent
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New document dialog */}
      <Dialog open={newDocDialog} onOpenChange={setNewDocDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
            <DialogDescription>Start a new documentation document from scratch</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='doc-title'>Document Title</Label>
              <Input
                id='doc-title'
                placeholder='e.g. Server Configuration'
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
                  <SelectItem value='MEETING_NOTES'>Meeting Notes</SelectItem>
                  <SelectItem value='TUTORIAL'>Tutorial</SelectItem>
                  <SelectItem value='API_SPEC'>API Specification</SelectItem>
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

      {/* Templates dialog */}
      <Dialog open={templatesDialog} onOpenChange={setTemplatesDialog}>
        <DialogContent className='max-h-[80vh] max-w-4xl overflow-y-auto'>
          <DialogHeader>
            <div className='flex items-center justify-between'>
              <div>
                <DialogTitle>Document Templates</DialogTitle>
                <DialogDescription>Choose a template to create a new document quickly</DialogDescription>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={async () => {
                  try {
                    await seedTemplates(false)
                  } catch (error) {}
                }}
              >
                Seed Templates
              </Button>
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
                  } catch (error) {}
                }}
              >
                Seed Templates
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
                        <Badge variant='default' className='text-xs'>
                          NIST
                        </Badge>
                      )}
                      {template.name}
                    </CardTitle>
                    <CardDescription className='line-clamp-2 text-xs'>
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
            try {
              const document = await useTemplate(selectedTemplate.id, title, customFields)
              if (document?.id) {
                window.location.hash = `document/${document.id}`
              }
              toast.success(`Document "${title}" created successfully!`)
            } catch (error) {
              throw error
            }
          }}
        />
      )}
    </div>
  )
}

export default Dashboard
