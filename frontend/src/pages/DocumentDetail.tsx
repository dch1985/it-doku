import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { TableKit } from '@tiptap/extension-table'
import {
  ArrowLeft,
  Bot,
  Check,
  ShieldCheck,
  Save,
  Server,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { DOCUMENT_CATEGORIES, DOCUMENT_STATUSES, type Document } from '@/lib/types'
import { timeAgo, titleCase } from '@/lib/utils'
import { navigate } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/badges'

export function DocumentDetail({ documentId }: { documentId: string }) {
  const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: doc, isLoading } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => api.documents.get(documentId),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[480px] w-full" />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm font-medium">Document not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('documents')}>
          <ArrowLeft className="h-4 w-4" />
          Back to documents
        </Button>
      </div>
    )
  }

  return (
    <Editor
      key={doc.id + String(doc.updatedAt)}
      doc={doc}
      onDelete={() => setDeleteOpen(true)}
      deleteOpen={deleteOpen}
      setDeleteOpen={setDeleteOpen}
      invalidate={() => {
        queryClient.invalidateQueries({ queryKey: ['documents'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
      }}
    />
  )
}

function Editor({
  doc,
  deleteOpen,
  setDeleteOpen,
  invalidate,
}: {
  doc: Document
  onDelete: () => void
  deleteOpen: boolean
  setDeleteOpen: (open: boolean) => void
  invalidate: () => void
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(doc.title)
  const [category, setCategory] = useState<string>(doc.category)
  const [status, setStatus] = useState<string>(doc.status)
  const [dirty, setDirty] = useState(false)
  const contentRef = useRef(doc.content)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start documenting…' }),
      Link.configure({ openOnClick: false }),
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: doc.content,
    editorProps: {
      attributes: { class: 'prose-doc tiptap' },
    },
    onUpdate: ({ editor }) => {
      contentRef.current = editor.getHTML()
      setDirty(true)
    },
  })

  useEffect(() => {
    setDirty(
      title !== doc.title || category !== doc.category || status !== doc.status
    )
    // content dirtiness is tracked in onUpdate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, category, status])

  const saveMutation = useMutation({
    mutationFn: () =>
      api.documents.update(doc.id, {
        title: title.trim(),
        category: category as Document['category'],
        status: status as Document['status'],
        content: contentRef.current,
      }),
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['document', doc.id] })
      setDirty(false)
      toast.success('Document saved')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const reviewMutation = useMutation({
    mutationFn: () => api.documents.review(doc.id),
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['document', doc.id] })
      toast.success('Marked as reviewed - freshness clock reset')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.documents.remove(doc.id),
    onSuccess: () => {
      invalidate()
      toast.success('Document deleted')
      navigate('documents')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('documents')}>
          <ArrowLeft className="h-4 w-4" />
          Documents
        </Button>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => reviewMutation.mutate()}
          disabled={reviewMutation.isPending}
          title="Confirms this document is accurate today and resets the agent's freshness clock"
        >
          <ShieldCheck className="h-4 w-4" />
          Mark reviewed
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !title.trim()}>
          {dirty ? <Save className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          {dirty ? 'Save' : 'Saved'}
        </Button>
      </div>

      <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-0 px-0 text-2xl font-bold tracking-tight shadow-none focus-visible:ring-0"
          placeholder="Document title"
        />

        <div className="flex flex-wrap items-center gap-3 border-b pb-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {titleCase(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {titleCase(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <StatusBadge status={doc.status} />
          <div className="flex-1" />
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {doc.asset && (
              <span className="inline-flex items-center gap-1">
                <Server className="h-3.5 w-3.5" />
                {doc.asset.name}
              </span>
            )}
            {doc.generatedBy && (
              <span className="inline-flex items-center gap-1 text-primary">
                <Bot className="h-3.5 w-3.5" />
                agent-generated
              </span>
            )}
            <span>v{doc.version}</span>
            <span>updated {timeAgo(doc.updatedAt)}</span>
            {doc.reviewedAt && <span>reviewed {timeAgo(doc.reviewedAt)}</span>}
          </div>
        </div>

        <EditorContent editor={editor} />
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document</DialogTitle>
            <DialogDescription>
              "{doc.title}" will be permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
