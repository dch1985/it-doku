import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Search, Plus, FileText, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useTrustDocStore } from '../store'
import { DOC_CATEGORIES, type DocCategory } from '../types'
import { CategoryTag, StatusPill } from '../ui'
import { timeAgo } from '../format'

function navigate(hash: string) {
  window.location.hash = hash
}

export function Library() {
  const documents = useTrustDocStore((s) => s.documents)
  const createDocument = useTrustDocStore((s) => s.createDocument)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'Server' as DocCategory, owner: '', content: '' })

  const filtered = useMemo(() => {
    return documents
      .filter((d) => (category === 'all' ? true : d.category === category))
      .filter((d) => {
        const q = query.trim().toLowerCase()
        if (!q) return true
        return (
          d.title.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)) ||
          d.owner.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [documents, category, query])

  const handleCreate = () => {
    if (!form.title.trim()) {
      toast.error('Please enter a document title')
      return
    }
    const doc = createDocument({
      title: form.title.trim(),
      category: form.category,
      status: 'Draft',
      owner: form.owner.trim() || 'IT Administrator',
      tags: [],
      content: form.content.trim() || `# ${form.title.trim()}\n\n_Start documenting…_`,
      linkedAssetId: null,
    })
    setDialogOpen(false)
    setForm({ title: '', category: 'Server', owner: '', content: '' })
    toast.success('Document created')
    navigate(`document/${doc.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documentation Library</h1>
          <p className="text-muted-foreground">{documents.length} documents across your environments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('agent')} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate with Agent
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Document
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, owner or tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-52">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {DOC_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No documents match your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((doc) => (
            <button
              key={doc.id}
              onClick={() => navigate(`document/${doc.id}`)}
              className="card-hover flex flex-col rounded-xl border bg-card p-5 text-left"
            >
              <div className="mb-3 flex items-center justify-between">
                <CategoryTag category={doc.category} />
                <StatusPill status={doc.status} />
              </div>
              <h3 className="mb-1 line-clamp-2 font-semibold leading-snug">{doc.title}</h3>
              <p className="mb-4 text-xs text-muted-foreground">
                {doc.owner} · Updated {timeAgo(doc.updatedAt)}
              </p>
              <div className="mt-auto flex flex-wrap gap-1.5">
                {doc.generatedByAgent && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    <Sparkles className="h-3 w-3" /> Agent
                  </span>
                )}
                {doc.tags.slice(0, 3).map((t) => (
                  <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Document</DialogTitle>
            <DialogDescription>Create a documentation entry from scratch.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. APP-PROD-02 Runbook"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v as DocCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner">Owner</Label>
                <Input
                  id="owner"
                  placeholder="Team or person"
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Initial content (Markdown, optional)</Label>
              <Textarea
                id="content"
                rows={4}
                placeholder="# Heading…"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
