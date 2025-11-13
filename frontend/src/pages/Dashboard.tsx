import { useState } from 'react'
import { useSidebarStore } from '@/stores/sidebarStore'
import { DocumentsChart } from '@/features/dashboard/components/DocumentsChart'
import { StorageChart } from '@/features/dashboard/components/StorageChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, MessageSquare, FileText, Zap, Database, ShieldCheck } from 'lucide-react'
import { useDocuments } from '@/hooks/useDocuments'
import { useTemplates } from '@/hooks/useTemplates'
import { useAnalytics } from '@/hooks/useAnalytics'
import { TemplateForm } from '@/components/TemplateForm'

export function Dashboard() {
  const [newDocDialog, setNewDocDialog] = useState(false)
  const [templatesDialog, setTemplatesDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [templateFormOpen, setTemplateFormOpen] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newDocCategory, setNewDocCategory] = useState('DOCUMENTATION')
  const { toggleChat } = useSidebarStore()
  const { documents, createDocument, refetch } = useDocuments()
  const { templates, loading: templatesLoading, useTemplate, seedTemplates } = useTemplates()
  const { data: analyticsData } = useAnalytics()

  const systemMetrics = analyticsData?.system
  const automationMetrics = analyticsData?.automation
  const centralizeMetrics = analyticsData?.centralize
  const complyMetrics = analyticsData?.comply

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
    } catch (error) {
      // handled in hook
    }
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

  const handleAskAI = () => {
    toggleChat()
    toast.info('AI Chat opened!')
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Welcome back, Driss!</h2>
          <p className='text-muted-foreground'>Operational insights aligned with Automate · Centralize · Comply.</p>
        </div>
        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400'>
            <div className='h-2 w-2 animate-pulse rounded-full bg-green-500'></div>
            Live Updates
          </div>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Documents</CardTitle>
            <span className='text-2xl'>📁</span>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{systemMetrics?.totalDocuments ?? documents.length}</div>
            <p className='text-xs text-muted-foreground'>{templates.length} templates available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Automation Completion</CardTitle>
            <Zap className='h-5 w-5 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{automationMetrics?.jobs.completionRate ?? 0}%</div>
            <p className='text-xs text-muted-foreground'>Jobs completed in the last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Assistant Queries</CardTitle>
            <Database className='h-5 w-5 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{centralizeMetrics?.assistant.totalQueries ?? 0}</div>
            <p className='text-xs text-muted-foreground'>Questions handled in the last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Open Findings</CardTitle>
            <ShieldCheck className='h-5 w-5 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {complyMetrics?.findings.openBySeverity.reduce((sum, item) => sum + item.count, 0) ?? 0}
            </div>
            <p className='text-xs text-muted-foreground'>Across all severities</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <DocumentsChart />
        <StorageChart />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with core workflows</CardDescription>
        </CardHeader>
        <CardContent className='flex gap-2 flex-wrap'>
          <Button onClick={() => setNewDocDialog(true)}>
            <Plus className='mr-2 h-4 w-4' />
            New Document
          </Button>
          <Button variant='outline' onClick={handleAskAI}>
            <MessageSquare className='mr-2 h-4 w-4' />
            Ask AI
          </Button>
          <Button variant='outline' onClick={() => setTemplatesDialog(true)}>
            <FileText className='mr-2 h-4 w-4' />
            View Templates
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates to your documentation</CardDescription>
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
                        {formatTimeAgo(updatedDate)} · {doc.category}
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
                  <SelectItem value='CODE_ANALYSIS'>Code Analysis</SelectItem>
                  <SelectItem value='TEMPLATE'>Template</SelectItem>
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

      <Dialog open={templatesDialog} onOpenChange={setTemplatesDialog}>
        <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <div className='flex items-center justify-between'>
              <div>
                <DialogTitle>Document Templates</DialogTitle>
                <DialogDescription>Choose a template to create a new document quickly</DialogDescription>
              </div>
              <div className='flex gap-2'>
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
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={async () => {
                    if (confirm('Bestehende Templates werden ersetzt. Fortfahren?')) {
                      try {
                        await seedTemplates(true)
                      } catch (error) {}
                    }
                  }}
                >
                  Neu Seed (Force)
                </Button>
              </div>
            </div>
          </DialogHeader>
          {templatesLoading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-lg'>Loading templates...</div>
            </div>
          ) : templates.length === 0 ? (
            <div className='flex flex-col items-center justify-center space-y-4 py-8'>
              <p className='text-muted-foreground'>No templates available</p>
              <div className='flex gap-2'>
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
                <Button
                  variant='destructive'
                  onClick={async () => {
                    if (confirm('Bestehende Templates werden ersetzt. Alle 11 Templates werden erstellt. Fortfahren?')) {
                      try {
                        await seedTemplates(true)
                      } catch (error) {}
                    }
                  }}
                >
                  Neu Seed (Force)
                </Button>
              </div>
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
            try {
              const document = await useTemplate(selectedTemplate.id, title, customFields)
              if (document?.id) {
                window.location.hash = `document/${document.id}`
              }
              toast.success(`Dokument "${title}" erfolgreich erstellt!`)
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