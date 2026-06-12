import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search, Server, Trash2, FileText, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useTrustDocStore } from '../store'
import {
  ASSET_TYPES,
  ENVIRONMENTS,
  ASSET_STATUSES,
  type AssetType,
  type Environment,
  type AssetStatus,
} from '../types'
import { AssetStatusPill } from '../ui'

function navigate(hash: string) {
  window.location.hash = hash
}

const emptyForm = {
  name: '',
  type: 'Virtual Machine' as AssetType,
  environment: 'Production' as Environment,
  status: 'Operational' as AssetStatus,
  ip: '',
  os: '',
  location: '',
  owner: '',
}

export function Infrastructure() {
  const assets = useTrustDocStore((s) => s.assets)
  const documents = useTrustDocStore((s) => s.documents)
  const createAsset = useTrustDocStore((s) => s.createAsset)
  const deleteAsset = useTrustDocStore((s) => s.deleteAsset)

  const [query, setQuery] = useState('')
  const [env, setEnv] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const docByAsset = useMemo(() => {
    const map = new Map<string, string>()
    documents.forEach((d) => {
      if (d.linkedAssetId && !map.has(d.linkedAssetId)) map.set(d.linkedAssetId, d.id)
    })
    return map
  }, [documents])

  const filtered = useMemo(
    () =>
      assets
        .filter((a) => (env === 'all' ? true : a.environment === env))
        .filter((a) => {
          const q = query.trim().toLowerCase()
          if (!q) return true
          return (
            a.name.toLowerCase().includes(q) ||
            a.ip.includes(q) ||
            a.type.toLowerCase().includes(q) ||
            (a.os || '').toLowerCase().includes(q)
          )
        }),
    [assets, env, query]
  )

  const handleCreate = () => {
    if (!form.name.trim()) {
      toast.error('Please enter an asset name')
      return
    }
    createAsset({
      ...form,
      name: form.name.trim(),
      ip: form.ip.trim(),
      os: form.os.trim(),
      location: form.location.trim() || '—',
      owner: form.owner.trim() || 'IT Administrator',
    })
    setForm(emptyForm)
    setDialogOpen(false)
    toast.success('Asset added')
  }

  const documentedCount = assets.filter((a) => docByAsset.has(a.id)).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Infrastructure</h1>
          <p className="text-muted-foreground">
            {assets.length} assets · {documentedCount} documented
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Asset
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, IP, type or OS…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={env} onValueChange={setEnv}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All environments</SelectItem>
            {ENVIRONMENTS.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden lg:table-cell">Environment</TableHead>
                <TableHead className="hidden sm:table-cell">IP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Docs</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    No assets match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((a) => {
                  const docId = docByAsset.get(a.id)
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                            <Server className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{a.name}</p>
                            <p className="text-xs text-muted-foreground">{a.os || a.location}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{a.type}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{a.environment}</TableCell>
                      <TableCell className="hidden sm:table-cell font-mono text-sm">{a.ip}</TableCell>
                      <TableCell>
                        <AssetStatusPill status={a.status} />
                      </TableCell>
                      <TableCell>
                        {docId ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={() => navigate(`document/${docId}`)}
                          >
                            <FileText className="h-3.5 w-3.5" /> View
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs text-primary"
                            onClick={() => navigate('agent/server-runbook')}
                          >
                            <Sparkles className="h-3.5 w-3.5" /> Document
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            deleteAsset(a.id)
                            toast.success('Asset removed')
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Asset</DialogTitle>
            <DialogDescription>Track a server, network device or other infrastructure.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="APP-PROD-02"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as AssetType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Environment</Label>
              <Select
                value={form.environment}
                onValueChange={(v) => setForm({ ...form, environment: v as Environment })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENVIRONMENTS.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ip">IP Address</Label>
              <Input
                id="ip"
                placeholder="10.10.2.22"
                value={form.ip}
                onChange={(e) => setForm({ ...form, ip: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as AssetStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="os">Operating System</Label>
              <Input
                id="os"
                placeholder="Ubuntu 24.04"
                value={form.os}
                onChange={(e) => setForm({ ...form, os: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                placeholder="Platform Team"
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Add Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
