import { useState } from 'react'
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
import { Plus, FileText, Database, ShieldCheck, Sparkles, Server } from 'lucide-react'
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
  const { documents, createDocument, refetch } = useDocuments()
  const { templates, loading: templatesLoading, useTemplate, seedTemplates } = useTemplates()
  const { data: analyticsData } = useAnalytics()

  const systemMetrics = analyticsData?.system
  const centralizeMetrics = analyticsData?.centralize
  const complyMetrics = analyticsData?.comply
  const openFindings = complyMetrics?.findings.openBySeverity.reduce((sum, item) => sum + item.count, 0) ?? 0
  const documentsInReview = documents.filter((document) => document.status === 'REVIEW').length

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

  return (
    <div className='space-y-8'>
      <section className='overflow-hidden rounded-3xl border bg-card shadow-sm'>
        <div className='grid gap-6 p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10'>
          <div className='space-y-5'>
            <Badge variant='secondary' className='w-fit rounded-full px-3 py-1'>
              Trust Doc workspace
            </Badge>
            <div className='space-y-3'>
              <h2 className='max-w-3xl text-4xl font-semibold tracking-tight lg:text-5xl'>
                Build IT documentation that operators can trust.
              </h2>
              <p className='max-w-2xl text-lg text-muted-foreground'>
                A focused workspace for servers, infrastructure, networks, backup, security controls, and review-ready evidence.
              </p>
            </div>
            <div className='flex flex-wrap gap-3'>
              <Button size='lg' onClick={() => setNewDocDialog(true)}>
                <Plus className='mr-2 h-4 w-4' />
                New Document
              </Button>
              <Button size='lg' variant='outline' onClick={() => { window.location.hash = 'skills' }}>
                <Sparkles className='mr-2 h-4 w-4' />
                Open Expert Skills
              </Button>
            </div>
          </div>
          <div className='rounded-3xl border bg-muted/40 p-6'>
            <p className='text-sm font-medium text-muted-foreground'>Documentation focus</p>
            <div className='mt-4 space-y-3'>
              {['Servers and virtual machines', 'Infrastructure dependencies', 'Network and security baselines', 'Backup, DR, and operations runbooks'].map((item) => (
                <div key={item} className='flex items-center gap-3 rounded-2xl bg-background/70 p-3 text-sm'>
                  <Server className='h-4 w-4 text-primary' />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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
            <CardTitle className='text-sm font-medium'>Expert Skills</CardTitle>
            <Sparkles className='h-5 w-5 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>5</div>
            <p className='text-xs text-muted-foreground'>Server, infrastructure, security, DR, knowledge</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Knowledge Coverage</CardTitle>
            <Database className='h-5 w-5 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{centralizeMetrics?.knowledge.documentsWithCoverage ?? 0}</div>
            <p className='text-xs text-muted-foreground'>Documents linked to knowledge nodes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Open Findings</CardTitle>
            <ShieldCheck className='h-5 w-5 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{openFindings}</div>
            <p className='text-xs text-muted-foreground'>{documentsInReview} documents currently in review</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <DocumentsChart />
        <StorageChart />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Focused Actions</CardTitle>
          <CardDescription>Start the workflows that make IT documentation easier to maintain</CardDescription>
        </CardHeader>
        <CardContent className='flex gap-2 flex-wrap'>
          <Button onClick={() => setNewDocDialog(true)}>
            <Plus className='mr-2 h-4 w-4' />
            New Document
          </Button>
          <Button variant='outline' onClick={() => { window.location.hash = 'skills' }}>
            <Sparkles className='mr-2 h-4 w-4' />
            Open Expert Skills
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