import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, Trash2, Server, Filter, MapPin, Tag, Lock, FileSignature } from 'lucide-react';
import { toast } from 'sonner';
import { useAssets, Asset } from '@/hooks/useAssets';

function Assets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('SERVER');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [hostname, setHostname] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [warrantyExp, setWarrantyExp] = useState('');

  const {
    assets,
    assetTypes,
    isLoading,
    createAsset,
    isCreating,
    updateAsset,
    isUpdating,
    deleteAsset,
    isDeleting,
  } = useAssets({
    type: filterType !== 'all' ? filterType : undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    search: searchQuery || undefined,
  });

  const handleCreateAsset = async () => {
    if (!name.trim() || !type) {
      toast.error('Name und Typ sind erforderlich');
      return;
    }

    createAsset({
      name: name.trim(),
      type,
      manufacturer: manufacturer.trim() || undefined,
      model: model.trim() || undefined,
      serialNumber: serialNumber.trim() || undefined,
      assetTag: assetTag.trim() || undefined,
      ipAddress: ipAddress.trim() || undefined,
      hostname: hostname.trim() || undefined,
      location: location.trim() || undefined,
      status: status || 'ACTIVE',
      warrantyExp: warrantyExp || undefined,
    }, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        resetForm();
      }
    });
  };

  const handleEditAsset = async () => {
    if (!selectedAsset || !name.trim()) {
      toast.error('Name ist erforderlich');
      return;
    }

    updateAsset({
      id: selectedAsset.id,
      data: {
        name: name.trim(),
        type,
        manufacturer: manufacturer.trim() || undefined,
        model: model.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        assetTag: assetTag.trim() || undefined,
        ipAddress: ipAddress.trim() || undefined,
        hostname: hostname.trim() || undefined,
        location: location.trim() || undefined,
        status,
        warrantyExp: warrantyExp || undefined,
      }
    }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setSelectedAsset(null);
        resetForm();
      }
    });
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (confirm('Möchten Sie dieses Asset wirklich löschen?')) {
      deleteAsset(assetId);
    }
  };

  const resetForm = () => {
    setName('');
    setType('SERVER');
    setManufacturer('');
    setModel('');
    setSerialNumber('');
    setAssetTag('');
    setIpAddress('');
    setHostname('');
    setLocation('');
    setStatus('ACTIVE');
    setWarrantyExp('');
  };

  const openEditDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setName(asset.name);
    setType(asset.type);
    setManufacturer(asset.manufacturer || '');
    setModel(asset.model || '');
    setSerialNumber(asset.serialNumber || '');
    setAssetTag(asset.assetTag || '');
    setIpAddress(asset.ipAddress || '');
    setHostname(asset.hostname || '');
    setLocation(asset.location || '');
    setStatus(asset.status);
    setWarrantyExp(asset.warrantyExp ? new Date(asset.warrantyExp).toISOString().split('T')[0] : '');
    setEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      ACTIVE: 'default',
      RETIRED: 'secondary',
      SPARE: 'outline',
      MAINTENANCE: 'destructive',
    };
    return variants[status] || 'default';
  };

  const getTypeIcon = (type: string) => {
    return <Server className='h-4 w-4' />;
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Assets</h2>
        <p className='text-muted-foreground'>
          Verwalten Sie Ihre IT-Assets und Hardware
        </p>
      </div>

      {/* Actions Bar */}
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Assets durchsuchen...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>
        <div className='flex items-center gap-2'>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='Typ' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Alle Typen</SelectItem>
              {assetTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Alle Status</SelectItem>
              <SelectItem value='ACTIVE'>Aktiv</SelectItem>
              <SelectItem value='RETIRED'>Außer Betrieb</SelectItem>
              <SelectItem value='SPARE'>Ersatz</SelectItem>
              <SelectItem value='MAINTENANCE'>Wartung</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Neues Asset
          </Button>
        </div>
      </div>

      {/* Assets Table */}
      <Card className='glass-card'>
        <CardHeader>
          <CardTitle>Assets ({assets.length})</CardTitle>
          <CardDescription>Alle verwalteten IT-Assets</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-muted-foreground'>Lade Assets...</div>
            </div>
          ) : assets.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <Server className='h-12 w-12 text-muted-foreground mb-4' />
              <p className='text-lg font-medium mb-2'>Keine Assets gefunden</p>
              <p className='text-sm text-muted-foreground mb-4'>
                {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Versuchen Sie eine andere Suche'
                  : 'Erstellen Sie Ihr erstes Asset'}
              </p>
              {!searchQuery && filterType === 'all' && filterStatus === 'all' && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className='mr-2 h-4 w-4' />
                  Neues Asset erstellen
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Hersteller</TableHead>
                  <TableHead>IP-Adresse</TableHead>
                  <TableHead>Standort</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className='font-medium'>{asset.name}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        {getTypeIcon(asset.type)}
                        <span className='text-sm'>{asset.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {asset.manufacturer && asset.model
                        ? `${asset.manufacturer} ${asset.model}`
                        : asset.manufacturer || asset.model || '-'}
                    </TableCell>
                    <TableCell className='font-mono text-sm'>{asset.ipAddress || '-'}</TableCell>
                    <TableCell>
                      {asset.location && (
                        <div className='flex items-center gap-1 text-muted-foreground'>
                          <MapPin className='h-3 w-3' />
                          <span>{asset.location}</span>
                        </div>
                      )}
                      {!asset.location && '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(asset.status)}>{asset.status}</Badge>
                      {asset._count && (asset._count.contracts > 0 || asset._count.passwords > 0) && (
                        <div className='flex items-center gap-2 mt-1'>
                          {asset._count.contracts > 0 && (
                            <Badge variant='outline' className='text-xs'>
                              <FileSignature className='h-3 w-3 mr-1' />
                              {asset._count.contracts}
                            </Badge>
                          )}
                          {asset._count.passwords > 0 && (
                            <Badge variant='outline' className='text-xs'>
                              <Lock className='h-3 w-3 mr-1' />
                              {asset._count.passwords}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => openEditDialog(asset)}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDeleteAsset(asset.id)}
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
            <DialogTitle>Neues Asset</DialogTitle>
            <DialogDescription>
              Erstellen Sie ein neues IT-Asset
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='create-name'>Name *</Label>
              <Input
                id='create-name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='z.B. Production Server 01'
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='create-type'>Typ *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='create-status'>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ACTIVE'>Aktiv</SelectItem>
                    <SelectItem value='RETIRED'>Außer Betrieb</SelectItem>
                    <SelectItem value='SPARE'>Ersatz</SelectItem>
                    <SelectItem value='MAINTENANCE'>Wartung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='create-manufacturer'>Hersteller</Label>
                <Input
                  id='create-manufacturer'
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder='z.B. Dell'
                />
              </div>
              <div>
                <Label htmlFor='create-model'>Modell</Label>
                <Input
                  id='create-model'
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder='z.B. PowerEdge R740'
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='create-serial'>Seriennummer</Label>
                <Input
                  id='create-serial'
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='create-tag'>Asset Tag</Label>
                <Input
                  id='create-tag'
                  value={assetTag}
                  onChange={(e) => setAssetTag(e.target.value)}
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='create-ip'>IP-Adresse</Label>
                <Input
                  id='create-ip'
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder='192.168.1.100'
                />
              </div>
              <div>
                <Label htmlFor='create-hostname'>Hostname</Label>
                <Input
                  id='create-hostname'
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  placeholder='server01.example.com'
                />
              </div>
            </div>
            <div>
              <Label htmlFor='create-location'>Standort</Label>
              <Input
                id='create-location'
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder='z.B. Rechenzentrum, Rack 42'
              />
            </div>
            <div>
              <Label htmlFor='create-warranty'>Garantie bis</Label>
              <Input
                id='create-warranty'
                type='date'
                value={warrantyExp}
                onChange={(e) => setWarrantyExp(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateAsset} disabled={isCreating}>
              {isCreating ? 'Erstellen...' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='glass-card max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Asset bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Asset-Informationen
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
                <Label htmlFor='edit-type'>Typ *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='edit-status'>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ACTIVE'>Aktiv</SelectItem>
                    <SelectItem value='RETIRED'>Außer Betrieb</SelectItem>
                    <SelectItem value='SPARE'>Ersatz</SelectItem>
                    <SelectItem value='MAINTENANCE'>Wartung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='edit-manufacturer'>Hersteller</Label>
                <Input
                  id='edit-manufacturer'
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='edit-model'>Modell</Label>
                <Input
                  id='edit-model'
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='edit-serial'>Seriennummer</Label>
                <Input
                  id='edit-serial'
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='edit-tag'>Asset Tag</Label>
                <Input
                  id='edit-tag'
                  value={assetTag}
                  onChange={(e) => setAssetTag(e.target.value)}
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='edit-ip'>IP-Adresse</Label>
                <Input
                  id='edit-ip'
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='edit-hostname'>Hostname</Label>
                <Input
                  id='edit-hostname'
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor='edit-location'>Standort</Label>
              <Input
                id='edit-location'
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor='edit-warranty'>Garantie bis</Label>
              <Input
                id='edit-warranty'
                type='date'
                value={warrantyExp}
                onChange={(e) => setWarrantyExp(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEditAsset} disabled={isUpdating}>
              {isUpdating ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Assets;

