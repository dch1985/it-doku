import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { DocumentEditor } from '@/components/DocumentEditor'
import { toast } from 'sonner'
import { ArrowLeft, Save, Eye, Edit, Download, Trash2, MessageSquare } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDocuments } from '@/hooks/useDocuments'
import { useComments } from '@/hooks/useComments'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { exportSingleDocumentPDF, exportSingleDocumentWord, exportSingleDocumentMarkdown, downloadMarkdown, exportSingleDocumentJSON } from '@/lib/exportUtils'

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
  const [versionHistory, setVersionHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [newComment, setNewComment] = useState('')
  const { getDocument, updateDocument, deleteDocument, getVersionHistory, restoreVersion, refetch } = useDocuments()
  const { comments, loading: loadingComments, createComment, updateComment, deleteComment } = useComments(documentId)

  useEffect(() => {
    loadDocument()
    loadVersionHistory()
  }, [documentId])

  const loadVersionHistory = async () => {
    setLoadingHistory(true)
    try {
      const history = await getVersionHistory(documentId)
      setVersionHistory(history)
    } catch (error) {
      // Error already handled in hook
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleRestoreVersion = async (versionId: string) => {
    if (confirm('Are you sure you want to restore this version? This will create a new version.')) {
      try {
        await restoreVersion(documentId, versionId)
        await loadDocument()
        await loadVersionHistory()
      } catch (error) {
        // Error already handled in hook
      }
    }
  }

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

  const handleExportPDF = () => {
    const docData = {
      title,
      category,
      status: 'Published',
      updated: '2 hours ago',
      content,
    }
    exportSingleDocumentPDF(docData as any)
    toast.success('Document exported to PDF!')
  }

  const handleExportWord = async () => {
    try {
      const docData = {
        title,
        category,
        status: 'Published',
        updated: '2 hours ago',
        content,
      }
      await exportSingleDocumentWord(docData as any)
      toast.success('Document exported to Word!')
    } catch (error) {
      toast.error('Failed to export to Word')
    }
  }

  const handleExportMarkdown = () => {
    const docData = {
      title,
      category,
      status: 'Published',
      updated: '2 hours ago',
      content,
    }
    const markdown = exportSingleDocumentMarkdown(docData as any)
    downloadMarkdown(markdown, title)
    toast.success('Document exported to Markdown!')
  }

  const handleExportJSON = () => {
    const docData = {
      title,
      category,
      status: 'Published',
      updated: '2 hours ago',
      content,
    }
    exportSingleDocumentJSON(docData as any)
    toast.success('Document exported to JSON!')
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline'>
                    <Download className='mr-2 h-4 w-4' />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportMarkdown}>
                    Export as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportJSON}>
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportWord}>
                    Export as Word
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
          <TabsTrigger value='comments'>
            <MessageSquare className='mr-2 h-4 w-4' />
            Comments
          </TabsTrigger>
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
              {loadingHistory ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='text-sm text-muted-foreground'>Loading version history...</div>
                </div>
              ) : versionHistory.length === 0 ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='text-sm text-muted-foreground'>No version history available</div>
                </div>
              ) : (
                <div className='space-y-4'>
                  {versionHistory.map((version, i) => (
                    <div key={version.id} className='flex items-start gap-4 pb-4 border-b last:border-0'>
                      <div className={`rounded-full p-2 ${version.isCurrent ? 'bg-primary/20' : 'bg-primary/10'}`}>
                        <span className='text-xs font-medium'>v{version.version}</span>
                      </div>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2'>
                          <p className='text-sm font-medium'>
                            {version.action} - {version.changeSummary?.changes ? Object.keys(version.changeSummary.changes).join(', ') : 'No changes'}
                          </p>
                          {version.isCurrent && (
                            <Badge variant='outline' className='text-xs'>Current</Badge>
                          )}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          {version.user?.name || 'Unknown'} · {formatTimeAgo(new Date(version.createdAt))}
                        </p>
                      </div>
                      {!version.isCurrent && (
                        <Button 
                          variant='ghost' 
                          size='sm'
                          onClick={() => handleRestoreVersion(version.id)}
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='comments' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <CardDescription>Discuss and collaborate on this document</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {/* Comment input */}
                <div className='space-y-2'>
                  <Label htmlFor='comment'>Add a comment</Label>
                  <textarea
                    id='comment'
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder='Write your comment...'
                    className='w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                  />
                  <Button 
                    onClick={async () => {
                      if (newComment.trim()) {
                        try {
                          await createComment(newComment)
                          setNewComment('')
                        } catch (error) {
                          // Error already handled in hook
                        }
                      }
                    }}
                    disabled={!newComment.trim()}
                  >
                    Post Comment
                  </Button>
                </div>

                {/* Comments list */}
                {loadingComments ? (
                  <div className='flex items-center justify-center py-8'>
                    <div className='text-sm text-muted-foreground'>Loading comments...</div>
                  </div>
                ) : comments.length === 0 ? (
                  <div className='flex items-center justify-center py-8'>
                    <div className='text-sm text-muted-foreground'>No comments yet. Start the conversation!</div>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {comments.map((comment) => (
                      <div key={comment.id} className='border rounded-lg p-4 space-y-2'>
                        <div className='flex items-start justify-between'>
                          <div className='flex items-center gap-2'>
                            <div className='rounded-full bg-primary/10 p-2'>
                              <span className='text-xs font-medium'>{comment.user.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className='text-sm font-medium'>{comment.user.name}</p>
                              <p className='text-xs text-muted-foreground'>{formatTimeAgo(new Date(comment.createdAt))}</p>
                            </div>
                          </div>
                          {comment.resolved && (
                            <Badge variant='outline' className='text-xs'>Resolved</Badge>
                          )}
                        </div>
                        <p className='text-sm'>{comment.content}</p>
                        {comment.replies && comment.replies.length > 0 && (
                          <div className='ml-8 mt-2 space-y-2'>
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className='border-l-2 pl-4 space-y-2'>
                                <div className='flex items-center gap-2'>
                                  <div className='rounded-full bg-primary/10 p-1'>
                                    <span className='text-xs font-medium'>{reply.user.name.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <p className='text-xs font-medium'>{reply.user.name}</p>
                                  <p className='text-xs text-muted-foreground'>{formatTimeAgo(new Date(reply.createdAt))}</p>
                                </div>
                                <p className='text-xs'>{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}

export default DocumentDetail