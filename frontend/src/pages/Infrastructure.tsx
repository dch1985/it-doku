import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bot, Pencil, Plus, Search, Server, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { ASSET_TYPES, CRITICALITIES, type Asset } from '@/lib/types'
import { titleCase } from '@/lib/utils'
import { navigate } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
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
import { CriticalityBadge, StatusBadge } from '@/components/badges'

interface AssetFormState {
  name: string
  type: string
  hostname: string
  ipAddress: string
  os: string
  location: string
  owner: string
  criticality: string
  status: string
  notes: string
}

const emptyForm: AssetFormState = {
  name: '',
  type: 'SERVER',
  hostname: '',
  ipAddress: '',
  os: '',
  location: '',
  owner: '',
  criticality: 'MEDIUM',
  status: 'ACTIVE',
  notes: '',
}

export function Infrastructure() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Asset | null>(null)
  const [form, setForm] = useState<AssetFormState>(emptyForm)
  const [deleting, setDeleting] = useState<Asset | null>(null)

  const { data: assets, isLoading } = useQuery({ queryKey: ['assets'], queryFn: () => api.assets.list() })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['assets'] })
    queryClient.invalidateQueries({ queryKey: ['documents'] })
    queryClient.invalidateQueries({ queryKey: ['stats'] })
    queryClient.invalidateQueries({ queryKey: ['agent-runs'] })
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        type: form.type as Asset['type'],
        hostname: form.hostname.trim() || null,
        ipAddress: form.ipAddress.trim() || null,
        os: form.os.trim() || null,
        location: form.location.trim() || null,
        owner: form.owner.trim() || null,
        criticality: form.criticality as Asset['criticality'],
        status: form.status as Asset['status'],
        notes: form.notes.trim() || null,
      }
      return editing ? api.assets.update(editing.id, payload) : api.assets.create(payload)
    },
    onSuccess: () => {
      invalidate()
      setFormOpen(false)
      toast.success(editing ? 'Asset updated' : 'Asset added')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.assets.remove(id),
    onSuccess: () => {
      invalidate()
      setDeleting(null)
      toast.success('Asset deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const generateMutation = useMutation({
    mutationFn: (assetId: string) => api.agent.run('asset-doc-generator', { assetId }),
    onSuccess: (run) => {
      invalidate()
      toast.success(run.summary ?? 'Agent finished')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (asset: Asset) => {
    setEditing(asset)
    setForm({
      name: asset.name,
      type: asset.type,
      hostname: asset.hostname ?? '',
      ipAddress: asset.ipAddress ?? '',
      os: asset.os ?? '',
      location: asset.location ?? '',
      owner: asset.owner ?? '',
      criticality: asset.criticality,
      status: asset.status,
      notes: asset.notes ?? '',
    })
    setFormOpen(true)
  }

  const filtered = useMemo(
    () =>
      (assets ?? []).filter(
        (a) => !query || a.name.toLowerCase().includes(query.toLowerCase())
      ),
    [assets, query]
  )

  const set = (key: keyof AssetFormState) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Infrastructure</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The asset inventory the agent documents: servers, network gear, storage and services.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add asset
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search assets…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}

        {!isLoading && filtered.length === 0 && (
          <div className="rounded-lg border border-dashed py-16 text-center md:col-span-2">
            <Server className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium">No assets yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your servers and network devices so the agent can document them.
            </p>
          </div>
        )}

        {filtered.map((asset) => (
          <div
            key={asset.id}
            className="flex flex-col rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Server className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-semibold leading-tight">{asset.name}</p>
                  <p className="text-xs text-muted-foreground">{titleCase(asset.type)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <CriticalityBadge criticality={asset.criticality} />
                <StatusBadge status={asset.status} />
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              {asset.hostname && <Fact label="Hostname" value={asset.hostname} />}
              {asset.ipAddress && <Fact label="IP" value={asset.ipAddress} />}
              {asset.os && <Fact label="OS" value={asset.os} />}
              {asset.location && <Fact label="Location" value={asset.location} />}
              {asset.owner && <Fact label="Owner" value={asset.owner} />}
            </dl>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {asset.documents.length === 0 ? (
                <span className="text-xs text-muted-foreground">No documentation linked yet</span>
              ) : (
                asset.documents.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => navigate(`document/${d.id}`)}
                    className="rounded-full border bg-background px-2.5 py-1 text-[11px] font-medium transition-colors hover:border-primary hover:text-primary"
                    title={d.title}
                  >
                    {titleCase(d.category)}
                  </button>
                ))
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateMutation.mutate(asset.id)}
                disabled={generateMutation.isPending}
                title="The agent generates every missing required document for this asset"
              >
                <Bot className="h-3.5 w-3.5" />
                Generate docs
              </Button>
              <div className="flex-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(asset)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setDeleting(asset)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit asset' : 'Add asset'}</DialogTitle>
            <DialogDescription>
              The more facts you record, the more complete the agent-generated documentation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="asset-name">Name</Label>
              <Input
                id="asset-name"
                placeholder="e.g. web-02"
                value={form.name}
                onChange={(e) => set('name')(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={set('type')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {titleCase(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Criticality</Label>
              <Select value={form.criticality} onValueChange={set('criticality')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRITICALITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {titleCase(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-hostname">Hostname</Label>
              <Input
                id="asset-hostname"
                placeholder="web-02.corp.local"
                value={form.hostname}
                onChange={(e) => set('hostname')(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-ip">IP address</Label>
              <Input
                id="asset-ip"
                placeholder="10.0.10.12"
                value={form.ipAddress}
                onChange={(e) => set('ipAddress')(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-os">Operating system</Label>
              <Input
                id="asset-os"
                placeholder="Ubuntu 24.04 LTS"
                value={form.os}
                onChange={(e) => set('os')(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-location">Location</Label>
              <Input
                id="asset-location"
                placeholder="DC1 / Rack A3"
                value={form.location}
                onChange={(e) => set('location')(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-owner">Owner</Label>
              <Input
                id="asset-owner"
                placeholder="Platform Team"
                value={form.owner}
                onChange={(e) => set('owner')(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={set('status')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['ACTIVE', 'MAINTENANCE', 'RETIRED'].map((s) => (
                    <SelectItem key={s} value={s}>
                      {titleCase(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="asset-notes">Notes</Label>
              <Textarea
                id="asset-notes"
                placeholder="Role of this asset, dependencies, special handling…"
                value={form.notes}
                onChange={(e) => set('notes')(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!form.name.trim() || saveMutation.isPending}
            >
              {editing ? 'Save changes' : 'Add asset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete asset</DialogTitle>
            <DialogDescription>
              "{deleting?.name}" will be removed from the inventory. Linked documents are kept but
              unlinked.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div className="flex gap-2 overflow-hidden">
        <dt className="shrink-0 font-medium text-muted-foreground">{label}</dt>
        <dd className="truncate font-medium">{value}</dd>
      </div>
    </>
  )
}
