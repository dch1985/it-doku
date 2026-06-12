import { useState } from 'react'
import { DocumentsChart } from '@/features/dashboard/components/DocumentsChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, FileText, Bot, ArrowRight, Shield, Server, Layers } from 'lucide-react'
import { useDocuments } from '@/hooks/useDocuments'
import { useTemplates } from '@/hooks/useTemplates'
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
      <div className='flex items-start justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
          <p className='text-muted-foreground mt-1'>
            Your IT documentation at a glance.
          </p>
        </div>
        <Button onClick={() => setNewDocDialog(true)} className='rounded-xl'>
          <Plus className='mr-2 h-4 w-4' />
          New Document
        </Button>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card className='trust-card'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Documents</CardTitle>
            <FileText className='h-4 w-4 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{documents.length}</div>
            <p className='text-xs text-muted-foreground mt-1'>{templates.length} templates available</p>
          </CardContent>
        </Card>

        <Card className='trust-card'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Agent Skills</CardTitle>
            <Bot className='h-4 w-4 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>6</div>
            <p className='text-xs text-muted-foreground mt-1'>IT documentation experts</p>
          </CardContent>
        </Card>

        <Card className='trust-card'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Templates</CardTitle>
            <Layers className='h-4 w-4 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{templates.length}</div>
            <p className='text-xs text-muted-foreground mt-1'>NIST-compliant standards</p>
          </CardContent>
        </Card>

        <Card className='trust-card'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Compliance</CardTitle>
            <Shield className='h-4 w-4 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>NIST</div>
            <p className='text-xs text-muted-foreground mt-1'>Audit-ready documentation</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <DocumentsChart />
        </div>

        <Card className='trust-card'>
          <CardHeader>
            <CardTitle className='text-base'>Quick Actions</CardTitle>
            <CardDescription>Common documentation workflows</CardDescription>
          </CardHeader>
          <CardContent className='space-y-2'>
            <Button
              variant='outline'
              className='w-full justify-start rounded-xl'
              onClick={() => setNewDocDialog(true)}
            >
              <Plus className='mr-2 h-4 w-4' />
              New Document
            </Button>
            <Button
              variant='outline'
              className='w-full justify-start rounded-xl'
              onClick={() => window.location.hash = 'agents'}
            >
              <Bot className='mr-2 h-4 w-4' />
              Run Agent Skill
            </Button>
            <Button
              variant='outline'
              className='w-full justify-start rounded-xl'
              onClick={() => setTemplatesDialog(true)}
            >
              <FileText className='mr-2 h-4 w-4' />
              Browse Templates
            </Button>
            <Button
              variant='outline'
              className='w-full justify-start rounded-xl'
              onClick={() => window.location.hash = 'infrastructure'}
            >
              <Server className='mr-2 h-4 w-4' />
              Infrastructure
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className='trust-card'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>Latest updates to your documentation</CardDescription>
          </div>
          <Button variant='ghost' size='sm' onClick={() => window.location.hash = 'docs'}>
            View all
            <ArrowRight className='ml-1 h-3 w-3' />
          </Button>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            {recentDocuments.length === 0 ? (
              <div className='py-12 text-center'>
                <FileText className='h-10 w-10 text-muted-foreground/40 mx-auto mb-3' />
                <p className='text-sm text-muted-foreground'>No documents yet</p>
                <Button variant='link' size='sm' onClick={() => setNewDocDialog(true)} className='mt-2'>
                  Create your first document
                </Button>
              </div>
            ) : (
              recentDocuments.map((doc) => {
                const updatedDate = new Date(doc.updatedAt || doc.createdAt)
                const isRecentlyUpdated = doc.updatedAt && new Date(doc.updatedAt).getTime() !== new Date(doc.createdAt).getTime()

                return (
                  <div
                    key={doc.id}
                    className='flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-accent cursor-pointer'
                    onClick={() => { window.location.hash = `document/${doc.id}` }}
                  >
                    <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10'>
                      <FileText className='h-4 w-4 text-primary' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium truncate'>{doc.title}</p>
                      <p className='text-xs text-muted-foreground'>
                        {isRecentlyUpdated ? 'Updated' : 'Created'} {formatTimeAgo(updatedDate)} · {doc.category}
                      </p>
                    </div>
                    <Badge variant='outline' className='text-xs shrink-0'>{doc.status || 'DRAFT'}</Badge>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={newDocDialog} onOpenChange={setNewDocDialog}>
        <DialogContent className='rounded-2xl'>
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
            <DialogDescription>Start a new IT documentation document</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='doc-title'>Document Title</Label>
              <Input
                id='doc-title'
                placeholder='e.g. Production Server Configuration'
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                className='rounded-xl'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='doc-category'>Category</Label>
              <Select value={newDocCategory} onValueChange={setNewDocCategory}>
                <SelectTrigger id='doc-category' className='rounded-xl'>
                  <SelectValue placeholder='Select a category' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='DOCUMENTATION'>Documentation</SelectItem>
                  <SelectItem value='KNOWLEDGE_BASE'>Knowledge Base</SelectItem>
                  <SelectItem value='TEMPLATE'>From Template</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setNewDocDialog(false)} className='rounded-xl'>Cancel</Button>
            <Button onClick={handleNewDocument} className='rounded-xl'>Create Document</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={templatesDialog} onOpenChange={setTemplatesDialog}>
        <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto rounded-2xl'>
          <DialogHeader>
            <DialogTitle>Document Templates</DialogTitle>
            <DialogDescription>NIST-compliant templates for IT infrastructure</DialogDescription>
          </DialogHeader>
          {templatesLoading ? (
            <div className='flex items-center justify-center py-8 text-muted-foreground'>Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className='flex flex-col items-center justify-center space-y-4 py-8'>
              <p className='text-muted-foreground'>No templates available</p>
              <Button variant='outline' onClick={() => seedTemplates(false)} className='rounded-xl'>
                Initialize Templates
              </Button>
            </div>
          ) : (
            <div className='grid gap-4 py-4 md:grid-cols-2 lg:grid-cols-3'>
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className='trust-card cursor-pointer hover:border-primary/50'
                  onClick={() => {
                    setSelectedTemplate(template)
                    setTemplateFormOpen(true)
                    setTemplatesDialog(false)
                  }}
                >
                  <CardHeader className='pb-2'>
                    <CardTitle className='flex items-center gap-2 text-sm'>
                      {template.isNistCompliant && (
                        <Badge className='text-xs'>NIST</Badge>
                      )}
                      {template.name}
                    </CardTitle>
                    <CardDescription className='text-xs line-clamp-2'>
                      {template.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
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
            const document = await useTemplate(selectedTemplate.id, title, customFields)
            if (document?.id) {
              window.location.hash = `document/${document.id}`
            }
            toast.success(`Document "${title}" created`)
          }}
        />
      )}
    </div>
  )
}

export default Dashboard
