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
import { toast } from 'sonner'
import { Plus, MessageSquare, FileText } from 'lucide-react'
import { useDocuments } from '@/hooks/useDocuments'
import { useTemplates } from '@/hooks/useTemplates'
import { useAnalytics } from '@/hooks/useAnalytics'
import { TemplateForm } from '@/components/TemplateForm'

export function Dashboard() {
  const [newDocDialog, setNewDocDialog] = useState(false)
  const [templatesDialog, setTemplatesDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [templateFormOpen, setTemplateFormOpen] = useState(false)
  const { toggleChat } = useSidebarStore()
  const { documents, createDocument, refetch } = useDocuments()
  const { templates, loading: templatesLoading, useTemplate, seedTemplates } = useTemplates()
  const { data: analyticsData } = useAnalytics()

  const handleNewDocument = async () => {
    const titleInput = document.getElementById('doc-title') as HTMLInputElement
    const categoryInput = document.getElementById('doc-category') as HTMLInputElement
    
    if (!titleInput?.value || !categoryInput?.value) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      await createDocument({
        title: titleInput.value,
        category: categoryInput.value,
        content: ''
      })
      setNewDocDialog(false)
      titleInput.value = ''
      categoryInput.value = ''
      await refetch() // Refresh documents list
    } catch (error) {
      // Error handled in hook
    }
  }

  // Get real statistics from analytics
  const totalUsers = analyticsData?.stats?.totalUsers || 0
  const growthRate = analyticsData?.stats?.growthRate || 0
  
  // Calculate documents from this week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const documentsThisWeek = documents.filter(doc => {
    const docDate = new Date(doc.createdAt)
    return docDate >= oneWeekAgo
  }).length

  // Get recent documents for activity feed
  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 5)

  // Format time ago
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
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Welcome back, Driss!</h2>
        <p className='text-muted-foreground'>
          Here's what's happening with your documentation today.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
    <CardTitle className='text-sm font-medium'>Total Documents</CardTitle>
    <span className='text-2xl'>📄</span>
  </CardHeader>
  <CardContent>
    <div className='text-2xl font-bold'>{documents.length}</div>
    <p className='text-xs text-muted-foreground'>
      {documents.filter(d => d.status === 'Published').length} published
    </p>
  </CardContent>
</Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Templates</CardTitle>
            <span className='text-2xl'>📋</span>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{templates.length}</div>
            <p className='text-xs text-muted-foreground'>{analyticsData?.stats?.totalTemplates || 0} available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Users</CardTitle>
            <span className='text-2xl'>👥</span>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalUsers}</div>
            <p className='text-xs text-muted-foreground'>{documentsThisWeek} docs this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Growth Rate</CardTitle>
            <span className='text-2xl'>📈</span>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%</div>
            <p className='text-xs text-muted-foreground'>vs. last month</p>
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
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent className='flex gap-2'>
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
              <div className='text-center py-8 text-sm text-muted-foreground'>
                No recent activity
              </div>
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
            <DialogDescription>
              Start a new documentation document from scratch
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='doc-title'>Document Title</Label>
              <Input id='doc-title' placeholder='e.g. Server Configuration' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='doc-category'>Category</Label>
              <Input id='doc-category' placeholder='e.g. Infrastructure' />
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
                <DialogDescription>
                  Choose a template to create a new document quickly
                </DialogDescription>
              </div>
              <div className='flex gap-2'>
                <Button 
                  variant='outline' 
                  size='sm'
                  onClick={async () => {
                    try {
                      await seedTemplates(false)
                    } catch (error) {
                      // Error handled in hook
                    }
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
                      } catch (error) {
                        // Error handled in hook
                      }
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
            <div className='flex flex-col items-center justify-center py-8 space-y-4'>
              <p className='text-muted-foreground'>No templates available</p>
              <div className='flex gap-2'>
                <Button 
                  variant='outline'
                  onClick={async () => {
                    try {
                      await seedTemplates(false)
                    } catch (error) {
                      // Error handled in hook
                    }
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
                      } catch (error) {
                        // Error handled in hook
                      }
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
                  className='cursor-pointer hover:border-primary transition-colors'
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

      {/* Template Form Dialog */}
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
              // Navigate to the new document
              if (document?.id) {
                window.location.hash = `document/${document.id}`
              }
              toast.success(`Dokument "${title}" erfolgreich erstellt!`)
            } catch (error) {
              // Error handled in hook
              throw error
            }
          }}
        />
      )}
    </div>
  )
}

export default Dashboard