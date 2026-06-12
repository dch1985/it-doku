import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Pencil,
  Save,
  X,
  Download,
  Trash2,
  MoreVertical,
  Server,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTrustDocStore } from '../store'
import { DOC_STATUSES, type DocStatus } from '../types'
import { Markdown } from '../Markdown'
import { CategoryTag, StatusPill } from '../ui'
import { timeAgo } from '../format'

export function DocumentView({ documentId, onBack }: { documentId: string; onBack: () => void }) {
  const doc = useTrustDocStore((s) => s.documents.find((d) => d.id === documentId))
  const assets = useTrustDocStore((s) => s.assets)
  const updateDocument = useTrustDocStore((s) => s.updateDocument)
  const deleteDocument = useTrustDocStore((s) => s.deleteDocument)

  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-muted-foreground">This document no longer exists.</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Library
        </Button>
      </div>
    )
  }

  const linkedAsset = assets.find((a) => a.id === doc.linkedAssetId)

  const startEdit = () => {
    setDraftTitle(doc.title)
    setDraftContent(doc.content)
    setEditing(true)
  }

  const save = () => {
    if (!draftTitle.trim()) {
      toast.error('Title cannot be empty')
      return
    }
    updateDocument(doc.id, { title: draftTitle.trim(), content: draftContent })
    setEditing(false)
    toast.success('Document saved')
  }

  const exportMarkdown = () => {
    const blob = new Blob([doc.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported as Markdown')
  }

  const remove = () => {
    deleteDocument(doc.id)
    toast.success('Document deleted')
    onBack()
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Library
      </Button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          {editing ? (
            <Input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="h-auto border-0 border-b px-0 text-2xl font-bold focus-visible:ring-0"
            />
          ) : (
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{doc.title}</h1>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <CategoryTag category={doc.category} />
            <StatusPill status={doc.status} />
            <span className="text-xs text-muted-foreground">
              {doc.owner} · Updated {timeAgo(doc.updatedAt)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Select
            value={doc.status}
            onValueChange={(v) => {
              updateDocument(doc.id, { status: v as DocStatus })
              toast.success(`Status set to ${v}`)
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOC_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {editing ? (
            <>
              <Button onClick={save} className="gap-2">
                <Save className="h-4 w-4" /> Save
              </Button>
              <Button variant="outline" size="icon" onClick={() => setEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button onClick={startEdit} variant="outline" className="gap-2">
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportMarkdown}>
                <Download className="mr-2 h-4 w-4" /> Export Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={remove} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {linkedAsset && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-2.5 text-sm">
          <Server className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Linked asset:</span>
          <span className="font-medium">{linkedAsset.name}</span>
          <span className="text-muted-foreground">· {linkedAsset.ip}</span>
        </div>
      )}

      <Card>
        <CardContent className="p-6 lg:p-8">
          {editing ? (
            <Textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              rows={24}
              className="font-mono text-sm leading-relaxed"
            />
          ) : (
            <Markdown content={doc.content} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
