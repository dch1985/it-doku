import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, FileText, Download, Trash2, Eye, Filter } from 'lucide-react'
import { toast } from 'sonner'

export function Documents() {
  const [searchQuery, setSearchQuery] = useState('')

  const documents = [
    { id: 1, title: 'Server Configuration Guide', category: 'Infrastructure', updated: '2 hours ago', size: '2.4 MB', status: 'Published' },
    { id: 2, title: 'Network Topology Documentation', category: 'Network', updated: '5 hours ago', size: '1.8 MB', status: 'Published' },
    { id: 3, title: 'Backup and Recovery Strategy', category: 'Operations', updated: '1 day ago', size: '3.2 MB', status: 'Published' },
    { id: 4, title: 'Security Policy 2024', category: 'Security', updated: '2 days ago', size: '1.1 MB', status: 'Published' },
    { id: 5, title: 'API Documentation', category: 'Development', updated: '3 days ago', size: '4.5 MB', status: 'Draft' },
    { id: 6, title: 'Database Schema Overview', category: 'Development', updated: '4 days ago', size: '892 KB', status: 'Published' },
    { id: 7, title: 'Incident Response Runbook', category: 'Operations', updated: '5 days ago', size: '2.1 MB', status: 'Published' },
    { id: 8, title: 'Cloud Migration Plan', category: 'Infrastructure', updated: '1 week ago', size: '5.3 MB', status: 'Draft' },
    { id: 9, title: 'User Access Management', category: 'Security', updated: '1 week ago', size: '1.5 MB', status: 'Published' },
    { id: 10, title: 'Monitoring and Alerting Setup', category: 'Operations', updated: '2 weeks ago', size: '2.8 MB', status: 'Published' },
  ]

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleView = (doc: typeof documents[0]) => {
    toast.info(`Opening: ${doc.title}`)
  }

  const handleDownload = (doc: typeof documents[0]) => {
    toast.success(`Downloading: ${doc.title}`)
  }

  const handleDelete = (doc: typeof documents[0]) => {
    toast.error(`Deleted: ${doc.title}`)
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Documentation</h2>
        <p className='text-muted-foreground'>
          Manage and organize all your IT documentation
        </p>
      </div>

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
          </div>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='text-center py-8 text-muted-foreground'>
                      No documents found
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
                        <Badge variant={doc.status === 'Published' ? 'default' : 'secondary'}>
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-muted-foreground'>{doc.size}</TableCell>
                      <TableCell className='text-muted-foreground'>{doc.updated}</TableCell>
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
              {documents.filter(d => d.status === 'Published').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {documents.filter(d => d.status === 'Draft').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}