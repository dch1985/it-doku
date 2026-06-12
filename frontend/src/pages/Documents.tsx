import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bot, FileText, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { DOCUMENT_CATEGORIES, DOCUMENT_STATUSES } from '@/lib/types'
import { timeAgo, titleCase } from '@/lib/utils'
import { navigate } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { CategoryBadge, StatusBadge } from '@/components/badges'

export function Documents() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('ALL')
  const [status, setStatus] = useState<string>('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<string>('SERVER')

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.documents.list(),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      api.documents.create({
        title: newTitle.trim(),
        category: newCategory as (typeof DOCUMENT_CATEGORIES)[number],
      }),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      setCreateOpen(false)
      setNewTitle('')
      toast.success('Document created')
      navigate(`document/${doc.id}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const filtered = useMemo(() => {
    return (documents ?? []).filter((doc) => {
      if (category !== 'ALL' && doc.category !== category) return false
      if (status !== 'ALL' && doc.status !== status) return false
      if (query && !doc.title.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [documents, category, status, query])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your documentation library - structured, versioned and audited by the agent.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New document
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {DOCUMENT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {titleCase(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {DOCUMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {titleCase(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}

        {!isLoading && filtered.length === 0 && (
          <div className="rounded-lg border border-dashed py-16 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium">No documents found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create one manually or let the agent generate drafts from your inventory.
            </p>
          </div>
        )}

        {filtered.map((doc) => (
          <button
            key={doc.id}
            onClick={() => navigate(`document/${doc.id}`)}
            className="flex w-full items-center gap-4 rounded-lg border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
              <FileText className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold">{doc.title}</p>
                {doc.generatedBy && (
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
                    title="Draft generated by the Trust Doc agent"
                  >
                    <Bot className="h-3 w-3" />
                    Agent
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {doc.asset ? `${doc.asset.name} · ` : ''}v{doc.version} · updated{' '}
                {timeAgo(doc.updatedAt)}
              </p>
            </div>
            <CategoryBadge category={doc.category} className="hidden sm:inline-flex" />
            <StatusBadge status={doc.status} />
          </button>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New document</DialogTitle>
            <DialogDescription>
              Pick the category - the structure rules for that category are enforced by the agent's
              health audit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                placeholder="e.g. System Documentation – app-01"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger>
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!newTitle.trim() || createMutation.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
