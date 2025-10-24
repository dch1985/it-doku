import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Upload, FileText, Download, Trash2 } from 'lucide-react'

interface FileUploadProps {
  documentId: number
  onUploadComplete?: () => void
}

interface Attachment {
  id: number
  filename: string
  originalName: string
  mimeType: string
  size: number
  createdAt: string
}

export function FileUpload({ documentId, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAttachments()
  }, [documentId])

  const fetchAttachments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/api/upload/document/${documentId}`)
      if (!response.ok) throw new Error('Failed to fetch attachments')
      const data = await response.json()
      setAttachments(data)
    } catch (error) {
      console.error('Error fetching attachments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentId', documentId.toString())

    try {
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      toast.success('File uploaded successfully!')
      await fetchAttachments()
      onUploadComplete?.()
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await fetch(`http://localhost:3001/api/upload/${attachment.id}`)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.originalName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('File downloaded successfully!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download file')
    }
  }

  const handleDelete = async (attachmentId: number) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return

    try {
      const response = await fetch(`http://localhost:3001/api/upload/${attachmentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Delete failed')

      toast.success('Attachment deleted successfully!')
      await fetchAttachments()
      onUploadComplete?.()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete attachment')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className='space-y-4'>
      <div>
        <input
          ref={fileInputRef}
          type='file'
          onChange={handleFileSelect}
          className='hidden'
          accept='.pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.jpg,.jpeg,.png,.gif'
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className='w-full'
        >
          <Upload className='mr-2 h-4 w-4' />
          {uploading ? 'Uploading...' : 'Upload File'}
        </Button>
        <p className='text-xs text-muted-foreground mt-2'>
          Supported: PDF, Word, Excel, Images, Text (Max 10MB)
        </p>
      </div>

      {loading ? (
        <div className='text-center py-4 text-sm text-muted-foreground'>
          Loading attachments...
        </div>
      ) : attachments.length === 0 ? (
        <div className='text-center py-8 text-sm text-muted-foreground'>
          No attachments yet
        </div>
      ) : (
        <div className='space-y-2'>
          {attachments.map((attachment) => (
            <Card key={attachment.id} className='hover:border-primary transition-colors'>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3 flex-1'>
                    <FileText className='h-5 w-5 text-muted-foreground' />
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium truncate'>
                        {attachment.originalName}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {formatFileSize(attachment.size)} · {new Date(attachment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleDownload(attachment)}
                    >
                      <Download className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleDelete(attachment.id)}
                    >
                      <Trash2 className='h-4 w-4 text-destructive' />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}