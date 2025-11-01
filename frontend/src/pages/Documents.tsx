import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, FileText, Download, Trash2, Eye, Filter, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { exportToPDF, exportToMarkdown, downloadMarkdown, exportToJSON } from '@/lib/exportUtils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDocuments } from '@/hooks/useDocuments'
import { useTemplates } from '@/hooks/useTemplates'
import { TemplateForm } from '@/components/TemplateForm'

export function Documents() {
  const [searchQuery, setSearchQuery] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [templateFormOpen, setTemplateFormOpen] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newDocCategory, setNewDocCategory] = useState('DOCUMENTATION')
  const { documents, loading, deleteDocument, createDocument, refetch } = useDocuments()
  const { templates, loading: templatesLoading, useTemplate, seedTemplates } = useTemplates()

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleView = (doc: typeof documents[0]) => {
    window.location.hash = `document/${doc.id}`
  }

  const handleDownload = (doc: typeof documents[0]) => {
    toast.success(`Downloading: ${doc.title}`)
  }

  const handleDelete = async (doc: typeof documents[0]) => {
    if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      await deleteDocument(doc.id)
    }
  }

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) {
      toast.error('Bitte geben Sie einen Dokument-Titel ein')
      return
    }

    try {
      // If category is TEMPLATE, show template selection dialog
      if (newDocCategory === 'TEMPLATE') {
        // Close create dialog and open template dialog
        setCreateDialogOpen(false)
        setTemplateDialogOpen(true)
        return
      }

      // For other categories, create document with category-based template
      const newDoc = await createDocument({
        title: newDocTitle,
        category: newDocCategory,
        // content will be empty - backend will apply category template automatically
        content: ''
      })
      setCreateDialogOpen(false)
      setNewDocTitle('')
      setNewDocCategory('DOCUMENTATION')
      await refetch()
      
      // Automatically open the newly created document
      if (newDoc?.id) {
        window.location.hash = `document/${newDoc.id}`
      }
      
      toast.success('Dokument erfolgreich erstellt!')
    } catch (error) {
      // Error already handled in hook
    }
  }

  const handleExportPDF = () => {
    exportToPDF(filteredDocuments as any, 'IT Documentation')
    toast.success('Exported to PDF successfully!')
  }

  const handleExportMarkdown = () => {
    const markdown = exportToMarkdown(filteredDocuments as any)
    downloadMarkdown(markdown, 'it-documentation')
    toast.success('Exported to Markdown successfully!')
  }

  const handleExportJSON = () => {
    exportToJSON(filteredDocuments as any)
    toast.success('Exported to JSON successfully!')
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-lg font-medium'>Loading documents...</div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header with Create Button */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Documentation</h2>
          <p className='text-muted-foreground'>
            Manage and organize all your IT documentation
          </p>
        </div>
        <div className='flex gap-2'>
          <Button 
            size='lg' 
            variant='outline'
            onClick={() => setTemplateDialogOpen(true)}
            className='gap-2'
          >
            <FileText className='h-5 w-5' />
            From Template
          </Button>
          <Button 
            size='lg' 
            onClick={() => setCreateDialogOpen(true)}
            className='gap-2'
          >
            <Plus className='h-5 w-5' />
            New Document
          </Button>
        </div>
      </div>

      {/* Create Document Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
            <DialogDescription>
              Create a new documentation document. You can edit it after creation.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='doc-title'>Document Title *</Label>
              <Input
                id='doc-title'
                placeholder='e.g. Server Configuration Guide'
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleCreateDocument()
                  }
                }}
                autoFocus
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='doc-category'>Category *</Label>
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
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDocument} disabled={!newDocTitle.trim()}>
              Create Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className='sm:max-w-[600px] max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Create Document from Template</DialogTitle>
            <DialogDescription>
              Select a template to create a new document
            </DialogDescription>
          </DialogHeader>
          {templatesLoading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-lg'>Loading templates...</div>
            </div>
          ) : templates.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8 space-y-4'>
              <p className='text-muted-foreground'>No templates available</p>
              <p className='text-xs text-muted-foreground mb-4'>
                Templates werden nur geladen, wenn ein Tenant ausgewählt ist oder im Dev-Mode.
              </p>
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
                Templates erstellen
              </Button>
            </div>
          ) : (
            <div className='grid gap-3 py-4'>
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className='cursor-pointer hover:border-primary transition-colors'
                  onClick={() => {
                    setSelectedTemplate(template)
                    setTemplateFormOpen(true)
                    setTemplateDialogOpen(false)
                  }}
                >
                  <CardContent className='p-4'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <h4 className='font-semibold'>{template.name}</h4>
                          {template.isNistCompliant && (
                            <Badge variant='default' className='text-xs'>NIST</Badge>
                          )}
                        </div>
                        <p className='text-sm text-muted-foreground line-clamp-2'>
                          {template.description || 'No description'}
                        </p>
                        <div className='flex items-center gap-2 mt-2'>
                          <Badge variant='outline' className='text-xs'>{template.category}</Badge>
                          {template.nistFramework && (
                            <Badge variant='outline' className='text-xs'>
                              {template.nistFramework}
                            </Badge>
                          )}
                          <span className='text-xs text-muted-foreground'>
                            {template.usageCount} uses
                          </span>
                        </div>
                      </div>
                    </div>
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
              await refetch() // Refresh documents list
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

      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
          <CardDescription>
            {filteredDocuments.length} documents found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-4 mb-6'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search documents...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
            <Button variant='outline'>
              <Filter className='mr-2 h-4 w-4' />
              Filter
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='text-center py-8 text-muted-foreground'>
                      {searchQuery ? 'No documents match your search' : 'No documents yet. Create your first document!'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id} className='cursor-pointer hover:bg-muted/50'>
                      <TableCell className='font-medium'>
                        <div className='flex items-center gap-2'>
                          <FileText className='h-4 w-4 text-muted-foreground' />
                          {doc.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>{doc.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={doc.status === 'PUBLISHED' ? 'default' : doc.status === 'DRAFT' ? 'secondary' : 'outline'}>
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        v{doc.version || 1}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button 
                            variant='ghost' 
                            size='icon'
                            onClick={() => handleView(doc)}
                          >
                            <Eye className='h-4 w-4' />
                          </Button>
                          <Button 
                            variant='ghost' 
                            size='icon'
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className='h-4 w-4' />
                          </Button>
                          <Button 
                            variant='ghost' 
                            size='icon'
                            onClick={() => handleDelete(doc)}
                          >
                            <Trash2 className='h-4 w-4 text-destructive' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{documents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {documents.filter(d => d.status === 'PUBLISHED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {documents.filter(d => d.status === 'DRAFT').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Documents