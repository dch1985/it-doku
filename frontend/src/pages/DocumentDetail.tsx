import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { DocumentEditor } from '@/components/DocumentEditor'
import { toast } from 'sonner'
import { ArrowLeft, Save, Eye, Edit, Download, Trash2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDocuments } from '@/hooks/useDocuments'

interface DocumentDetailProps {
  documentId: string  // UUID String
  onBack: () => void
}

export function DocumentDetail({ documentId, onBack }: DocumentDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const { getDocument, updateDocument, deleteDocument } = useDocuments()

  useEffect(() => {
    loadDocument()
  }, [documentId])

  const loadDocument = async () => {
    setLoading(true)
    try {
      const doc = await getDocument(documentId)
      setTitle(doc.title)
      setCategory(doc.category)
      setContent(doc.content || '<p>No content yet...</p>')
    } catch (error) {
      toast.error('Failed to load document')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await updateDocument(documentId, { title, category, content })
      setIsEditing(false)
    } catch (error) {
      // Error already handled in hook
    }
  }

  const handleExport = () => {
    toast.success('Document exported!')
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteDocument(documentId)
        onBack()
      } catch (error) {
        // Error already handled in hook
      }
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <div className='text-lg font-medium'>Loading document...</div>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' onClick={onBack}>
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div>
            <h2 className='text-3xl font-bold tracking-tight'>{title}</h2>
            <div className='flex items-center gap-2 mt-1'>
              <Badge variant='outline'>{category}</Badge>
              <Badge variant='default'>Published</Badge>
              <span className='text-sm text-muted-foreground'>Last updated 2 hours ago</span>
            </div>
          </div>
        </div>

        <div className='flex gap-2'>
          {isEditing ? (
            <>
              <Button variant='outline' onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className='mr-2 h-4 w-4' />
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant='outline' onClick={handleExport}>
                <Download className='mr-2 h-4 w-4' />
                Export
              </Button>
              <Button variant='outline' onClick={() => setIsEditing(true)}>
                <Edit className='mr-2 h-4 w-4' />
                Edit
              </Button>
              <Button variant='destructive' onClick={handleDelete}>
                <Trash2 className='mr-2 h-4 w-4' />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue='content' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='content'>
            {isEditing ? <Edit className='mr-2 h-4 w-4' /> : <Eye className='mr-2 h-4 w-4' />}
            Content
          </TabsTrigger>
          <TabsTrigger value='metadata'>Metadata</TabsTrigger>
          <TabsTrigger value='history'>History</TabsTrigger>
        </TabsList>

        <TabsContent value='content' className='space-y-4'>
          <Card>
            <CardContent className='p-6'>
              {isEditing ? (
                <DocumentEditor
                  content={content}
                  onChange={setContent}
                  placeholder='Start writing your documentation...'
                />
              ) : (
                <div 
                  className='prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none template-content'
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='metadata' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Document Metadata</CardTitle>
              <CardDescription>Manage document information and settings</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='title'>Title</Label>
                <Input 
                  id='title' 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='category'>Category</Label>
                <Input 
                  id='category' 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className='space-y-2'>
                <Label>Document ID</Label>
                <Input value={`DOC-${documentId}`} disabled />
              </div>
              <div className='space-y-2'>
                <Label>Created</Label>
                <Input value='January 15, 2025' disabled />
              </div>
              <div className='space-y-2'>
                <Label>Last Modified</Label>
                <Input value='2 hours ago' disabled />
              </div>
              <div className='space-y-2'>
                <Label>Size</Label>
                <Input value='2.4 MB' disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='history' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
              <CardDescription>Track changes and revisions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {[
                  { version: 'v1.3', date: '2 hours ago', user: 'Driss Chaouat', changes: 'Updated configuration steps' },
                  { version: 'v1.2', date: '1 day ago', user: 'Driss Chaouat', changes: 'Added best practices section' },
                  { version: 'v1.1', date: '3 days ago', user: 'Driss Chaouat', changes: 'Fixed typos and formatting' },
                  { version: 'v1.0', date: '1 week ago', user: 'Driss Chaouat', changes: 'Initial version' },
                ].map((history, i) => (
                  <div key={i} className='flex items-start gap-4 pb-4 border-b last:border-0'>
                    <div className='rounded-full bg-primary/10 p-2'>
                      <span className='text-xs font-medium'>{history.version}</span>
                    </div>
                    <div className='flex-1'>
                      <p className='text-sm font-medium'>{history.changes}</p>
                      <p className='text-xs text-muted-foreground'>
                        {history.user} · {history.date}
                      </p>
                    </div>
                    <Button variant='ghost' size='sm'>Restore</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}

export default DocumentDetail