import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Edit, Trash2, Globe, Link as LinkIcon, Key } from 'lucide-react';
import { toast } from 'sonner';
import { useCustomerPortals, CustomerPortal } from '@/hooks/useCustomerPortals';

function CustomerPortals() {
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<CustomerPortal | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Form states
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [accessUrl, setAccessUrl] = useState('');

  const {
    portals,
    isLoading,
    createPortal,
    isCreating,
    updatePortal,
    isUpdating,
    deletePortal,
    isDeleting,
  } = useCustomerPortals({
    status: filterStatus !== 'all' ? filterStatus : undefined,
    search: searchQuery || undefined,
  });

  const handleCreatePortal = async () => {
    if (!name.trim() || !url.trim() || !customerName.trim()) {
      toast.error('Name, URL und Kundenname sind erforderlich');
      return;
    }

    createPortal({
      name: name.trim(),
      url: url.trim(),
      customerName: customerName.trim(),
      description: description.trim() || undefined,
      status: status || 'ACTIVE',
      accessUrl: accessUrl.trim() || undefined,
    }, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        resetForm();
      }
    });
  };

  const handleEditPortal = async () => {
    if (!selectedPortal || !name.trim() || !url.trim()) {
      toast.error('Name und URL sind erforderlich');
      return;
    }

    updatePortal({
      id: selectedPortal.id,
      data: {
        name: name.trim(),
        url: url.trim(),
        customerName: customerName.trim(),
        description: description.trim() || undefined,
        status,
        accessUrl: accessUrl.trim() || undefined,
      }
    }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setSelectedPortal(null);
        resetForm();
      }
    });
  };

  const handleDeletePortal = async (portalId: string) => {
    if (confirm('Möchten Sie dieses Kundenportal wirklich löschen?')) {
      deletePortal(portalId);
    }
  };

  const resetForm = () => {
    setName('');
    setUrl('');
    setCustomerName('');
    setDescription('');
    setStatus('ACTIVE');
    setAccessUrl('');
  };

  const openEditDialog = (portal: CustomerPortal) => {
    setSelectedPortal(portal);
    setName(portal.name);
    setUrl(portal.url || '');
    setCustomerName(portal.customerName || '');
    setDescription(portal.description || '');
    setStatus(portal.status || 'ACTIVE');
    setAccessUrl(portal.accessUrl || '');
    setEditDialogOpen(true);
  };

  const getStatusBadge = (status?: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      ACTIVE: 'default',
      INACTIVE: 'secondary',
      ARCHIVED: 'outline',
    };
    return variants[status || 'ACTIVE'] || 'default';
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Kundenportale</h2>
        <p className='text-muted-foreground'>
          Verwalten Sie Ihre Kundenportale und Zugänge
        </p>
      </div>

      {/* Actions Bar */}
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Portale durchsuchen...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>
        <div className='flex items-center gap-2'>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Alle Status</SelectItem>
              <SelectItem value='ACTIVE'>Aktiv</SelectItem>
              <SelectItem value='INACTIVE'>Inaktiv</SelectItem>
              <SelectItem value='ARCHIVED'>Archiviert</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Neues Portal
          </Button>
        </div>
      </div>

      {/* Portals Table */}
      <Card className='glass-card'>
        <CardHeader>
          <CardTitle>Kundenportale ({portals.length})</CardTitle>
          <CardDescription>Alle verwalteten Kundenportale</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-muted-foreground'>Lade Portale...</div>
            </div>
          ) : portals.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <Globe className='h-12 w-12 text-muted-foreground mb-4' />
              <p className='text-lg font-medium mb-2'>Keine Portale gefunden</p>
              <p className='text-sm text-muted-foreground mb-4'>
                {searchQuery || filterStatus !== 'all'
                  ? 'Versuchen Sie eine andere Suche'
                  : 'Erstellen Sie Ihr erstes Kundenportal'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className='mr-2 h-4 w-4' />
                  Neues Portal erstellen
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Access URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portals.map((portal) => (
                  <TableRow key={portal.id}>
                    <TableCell className='font-medium'>{portal.name}</TableCell>
                    <TableCell>{portal.customerName || '-'}</TableCell>
                    <TableCell>
                      {portal.url ? (
                        <a
                          href={portal.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='flex items-center gap-1 text-primary hover:underline'
                        >
                          <LinkIcon className='h-3 w-3' />
                          {portal.url.length > 30 ? `${portal.url.substring(0, 30)}...` : portal.url}
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {portal.accessUrl ? (
                        <a
                          href={portal.accessUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='flex items-center gap-1 text-primary hover:underline text-sm'
                        >
                          <Globe className='h-3 w-3' />
                          Zugriff
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(portal.status)}>
                        {portal.status || 'ACTIVE'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        {portal.publicKey && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                              navigator.clipboard.writeText(portal.publicKey || '');
                              toast.success('Public Key in Zwischenablage kopiert');
                            }}
                            title='Public Key kopieren'
                          >
                            <Key className='h-4 w-4' />
                          </Button>
                        )}
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => openEditDialog(portal)}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDeletePortal(portal.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className='h-4 w-4 text-destructive' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className='glass-card max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Neues Kundenportal</DialogTitle>
            <DialogDescription>
              Erstellen Sie ein neues Kundenportal
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='create-name'>Name *</Label>
              <Input
                id='create-name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='z.B. Kunde XYZ Portal'
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='create-customer'>Kundenname *</Label>
                <Input
                  id='create-customer'
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder='z.B. Firma XYZ GmbH'
                />
              </div>
              <div>
                <Label htmlFor='create-status'>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ACTIVE'>Aktiv</SelectItem>
                    <SelectItem value='INACTIVE'>Inaktiv</SelectItem>
                    <SelectItem value='ARCHIVED'>Archiviert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor='create-url'>URL *</Label>
              <Input
                id='create-url'
                type='url'
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder='https://portal.example.com'
              />
            </div>
            <div>
              <Label htmlFor='create-access-url'>Access URL (optional)</Label>
              <Input
                id='create-access-url'
                type='url'
                value={accessUrl}
                onChange={(e) => setAccessUrl(e.target.value)}
                placeholder='https://access.portal.example.com'
              />
            </div>
            <div>
              <Label htmlFor='create-description'>Beschreibung</Label>
              <Textarea
                id='create-description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Zusätzliche Informationen...'
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreatePortal} disabled={isCreating}>
              {isCreating ? 'Erstellen...' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='glass-card max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Kundenportal bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Portal-Informationen
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='edit-name'>Name *</Label>
              <Input
                id='edit-name'
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='edit-customer'>Kundenname *</Label>
                <Input
                  id='edit-customer'
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='edit-status'>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ACTIVE'>Aktiv</SelectItem>
                    <SelectItem value='INACTIVE'>Inaktiv</SelectItem>
                    <SelectItem value='ARCHIVED'>Archiviert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor='edit-url'>URL *</Label>
              <Input
                id='edit-url'
                type='url'
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor='edit-access-url'>Access URL</Label>
              <Input
                id='edit-access-url'
                type='url'
                value={accessUrl}
                onChange={(e) => setAccessUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor='edit-description'>Beschreibung</Label>
              <Textarea
                id='edit-description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEditPortal} disabled={isUpdating}>
              {isUpdating ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CustomerPortals;

