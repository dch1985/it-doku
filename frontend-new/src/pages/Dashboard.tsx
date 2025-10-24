import { useState } from 'react'
import { useSidebarStore } from '@/stores/sidebarStore'
import { DocumentsChart } from '@/features/dashboard/components/DocumentsChart'
import { AIUsageChart } from '@/features/dashboard/components/AIUsageChart'
import { StorageChart } from '@/features/dashboard/components/StorageChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, MessageSquare, FileText } from 'lucide-react'
import { useDocuments } from '@/hooks/useDocuments'

export function Dashboard() {
  const [newDocDialog, setNewDocDialog] = useState(false)
  const [templatesDialog, setTemplatesDialog] = useState(false)
  const { toggleChat } = useSidebarStore()
  const { documents, createDocument } = useDocuments()

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
      content: '<h1>' + titleInput.value + '</h1><p>Start writing...</p>'
    })
    setNewDocDialog(false)
    titleInput.value = ''
    categoryInput.value = ''
  } catch (error) {
    // Error handled in hook
  }
}

  const handleAskAI = () => {
    toggleChat()
    toast.info('AI Chat opened!')
  }

  const templates = [
    { id: 1, name: 'Server Dokumentation', icon: '🖥️', description: 'Vollstaendige Server-Dokumentation' },
    { id: 2, name: 'Netzwerk-Diagramm', icon: '🌐', description: 'Netzwerk-Topologie und Konfiguration' },
    { id: 3, name: 'Backup-Plan', icon: '💾', description: 'Backup-Strategie und Wiederherstellung' },
    { id: 4, name: 'Runbook', icon: '📖', description: 'Schritt-fuer-Schritt Anleitungen' },
    { id: 5, name: 'Security Policy', icon: '🔒', description: 'Sicherheitsrichtlinien' },
    { id: 6, name: 'Change Log', icon: '📝', description: 'Aenderungsprotokoll' },
  ]

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
            <CardTitle className='text-sm font-medium'>AI Queries</CardTitle>
            <span className='text-2xl'>💬</span>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>1,284</div>
            <p className='text-xs text-muted-foreground'>+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Users</CardTitle>
            <span className='text-2xl'>👥</span>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>42</div>
            <p className='text-xs text-muted-foreground'>+4 new this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Storage Used</CardTitle>
            <span className='text-2xl'>💾</span>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>2.4 GB</div>
            <p className='text-xs text-muted-foreground'>18% of 15 GB</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <DocumentsChart />
        <AIUsageChart />
      </div>

      <StorageChart />

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
      {[
        { 
          title: 'Server Documentation Updated', 
          time: '2 hours ago', 
          type: 'update',
          icon: FileText,
          color: 'text-blue-500'
        },
        { 
          title: 'New AI Chat Session', 
          time: '4 hours ago', 
          type: 'chat',
          icon: MessageSquare,
          color: 'text-green-500'
        },
        { 
          title: 'Template Created', 
          time: '1 day ago', 
          type: 'create',
          icon: Plus,
          color: 'text-purple-500'
        },
        { 
          title: 'Security Policy Updated', 
          time: '2 days ago', 
          type: 'update',
          icon: FileText,
          color: 'text-blue-500'
        },
        { 
          title: 'Backup Plan Modified', 
          time: '3 days ago', 
          type: 'update',
          icon: FileText,
          color: 'text-blue-500'
        },
      ].map((activity, i) => {
        const Icon = activity.icon
        return (
          <div 
            key={i} 
            className='flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-accent cursor-pointer'
          >
            <div className={`rounded-full bg-muted p-2 ${activity.color}`}>
              <Icon className='h-4 w-4' />
            </div>
            <div className='flex-1 space-y-1'>
              <p className='text-sm font-medium leading-none'>{activity.title}</p>
              <p className='text-xs text-muted-foreground'>{activity.time}</p>
            </div>
            <Button variant='ghost' size='sm' className='h-8 text-xs'>
              View
            </Button>
          </div>
        )
      })}
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
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Document Templates</DialogTitle>
            <DialogDescription>
              Choose a template to get started quickly
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4 md:grid-cols-2'>
            {templates.map((template) => (
              <Card 
                key={template.id} 
                className='cursor-pointer hover:border-primary transition-colors'
                onClick={() => {
                  toast.success(`Template ${template.name} selected!`)
                  setTemplatesDialog(false)
                }}
              >
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <span className='text-2xl'>{template.icon}</span>
                    {template.name}
                  </CardTitle>
                  <CardDescription className='text-xs'>
                    {template.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}