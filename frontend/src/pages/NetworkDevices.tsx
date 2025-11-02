import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, Trash2, Radio, Filter, Server, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { useNetworkDevices, NetworkDevice } from '@/hooks/useNetworkDevices';
import { useAssets } from '@/hooks/useAssets';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

function NetworkDevices() {
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  
  // Form states
  const [name, setName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [hostname, setHostname] = useState('');
  const [deviceType, setDeviceType] = useState('SWITCH');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [firmware, setFirmware] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [subnet, setSubnet] = useState('');
  const [gateway, setGateway] = useState('');
  const [dnsServers, setDnsServers] = useState('');
  const [assetId, setAssetId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  const { assets } = useAssets();

  const {
    devices,
    deviceTypes,
    isLoading,
    createDevice,
    isCreating,
    updateDevice,
    isUpdating,
    pingDevice,
    isPinging,
    deleteDevice,
    isDeleting,
  } = useNetworkDevices({
    deviceType: filterType !== 'all' ? filterType : undefined,
    isActive: filterActive !== 'all' ? filterActive === 'true' : undefined,
    search: searchQuery || undefined,
  });

  const handleCreateDevice = async () => {
    if (!name.trim() || !ipAddress.trim() || !deviceType) {
      toast.error('Name, IP-Adresse und Typ sind erforderlich');
      return;
    }

    createDevice({
      name: name.trim(),
      ipAddress: ipAddress.trim(),
      macAddress: macAddress.trim() || undefined,
      hostname: hostname.trim() || undefined,
      deviceType,
      manufacturer: manufacturer.trim() || undefined,
      model: model.trim() || undefined,
      firmware: firmware.trim() || undefined,
      serialNumber: serialNumber.trim() || undefined,
      subnet: subnet.trim() || undefined,
      gateway: gateway.trim() || undefined,
      dnsServers: dnsServers ? dnsServers.split(',').map(s => s.trim()) : undefined,
      assetId: assetId || undefined,
      isActive,
    }, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        resetForm();
      }
    });
  };

  const handleEditDevice = async () => {
    if (!selectedDevice || !name.trim() || !ipAddress.trim()) {
      toast.error('Name und IP-Adresse sind erforderlich');
      return;
    }

    updateDevice({
      id: selectedDevice.id,
      data: {
        name: name.trim(),
        ipAddress: ipAddress.trim(),
        macAddress: macAddress.trim() || undefined,
        hostname: hostname.trim() || undefined,
        deviceType,
        manufacturer: manufacturer.trim() || undefined,
        model: model.trim() || undefined,
        firmware: firmware.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        subnet: subnet.trim() || undefined,
        gateway: gateway.trim() || undefined,
        dnsServers: dnsServers ? dnsServers.split(',').map(s => s.trim()) : undefined,
        assetId: assetId || undefined,
        isActive,
      }
    }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setSelectedDevice(null);
        resetForm();
      }
    });
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (confirm('Möchten Sie dieses Netzwerkgerät wirklich löschen?')) {
      deleteDevice(deviceId);
    }
  };

  const handlePingDevice = async (deviceId: string) => {
    pingDevice(deviceId);
  };

  const resetForm = () => {
    setName('');
    setIpAddress('');
    setMacAddress('');
    setHostname('');
    setDeviceType('SWITCH');
    setManufacturer('');
    setModel('');
    setFirmware('');
    setSerialNumber('');
    setSubnet('');
    setGateway('');
    setDnsServers('');
    setAssetId('');
    setIsActive(true);
  };

  const openEditDialog = (device: NetworkDevice) => {
    setSelectedDevice(device);
    setName(device.name);
    setIpAddress(device.ipAddress);
    setMacAddress(device.macAddress || '');
    setHostname(device.hostname || '');
    setDeviceType(device.deviceType);
    setManufacturer(device.manufacturer || '');
    setModel(device.model || '');
    setFirmware(device.firmware || '');
    setSerialNumber(device.serialNumber || '');
    setSubnet(device.subnet || '');
    setGateway(device.gateway || '');
    setDnsServers(device.dnsServers ? JSON.parse(device.dnsServers).join(', ') : '');
    setAssetId(device.assetId || '');
    setIsActive(device.isActive);
    setEditDialogOpen(true);
  };

  const getStatusBadge = (active: boolean, lastSeen: string) => {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const hoursSinceLastSeen = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60);
    
    if (!active) {
      return { label: 'Inaktiv', variant: 'secondary' as const };
    }
    if (hoursSinceLastSeen > 24) {
      return { label: 'Offline', variant: 'destructive' as const };
    }
    if (hoursSinceLastSeen > 1) {
      return { label: 'Unbekannt', variant: 'default' as const };
    }
    return { label: 'Online', variant: 'default' as const };
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Netzwerkgeräte</h2>
        <p className='text-muted-foreground'>
          Verwalten Sie Ihre Netzwerkgeräte und Entdeckungen
        </p>
      </div>

      {/* Actions Bar */}
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Geräte durchsuchen...'
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
              {deviceTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterActive} onValueChange={setFilterActive}>
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Alle</SelectItem>
              <SelectItem value='true'>Aktiv</SelectItem>
              <SelectItem value='false'>Inaktiv</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Neues Gerät
          </Button>
        </div>
      </div>

      {/* Devices Table */}
      <Card className='glass-card'>
        <CardHeader>
          <CardTitle>Netzwerkgeräte ({devices.length})</CardTitle>
          <CardDescription>Alle entdeckten und verwalteten Netzwerkgeräte</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-muted-foreground'>Lade Geräte...</div>
            </div>
          ) : devices.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <Radio className='h-12 w-12 text-muted-foreground mb-4' />
              <p className='text-lg font-medium mb-2'>Keine Geräte gefunden</p>
              <p className='text-sm text-muted-foreground mb-4'>
                {searchQuery || filterType !== 'all' || filterActive !== 'all'
                  ? 'Versuchen Sie eine andere Suche'
                  : 'Erstellen Sie Ihr erstes Netzwerkgerät'}
              </p>
              {!searchQuery && filterType === 'all' && filterActive === 'all' && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className='mr-2 h-4 w-4' />
                  Neues Gerät erstellen
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>IP-Adresse</TableHead>
                  <TableHead>Hostname</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Zuletzt gesehen</TableHead>
                  <TableHead className='text-right'>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => {
                  const status = getStatusBadge(device.isActive, device.lastSeen);
                  return (
                    <TableRow key={device.id}>
                      <TableCell className='font-medium'>{device.name}</TableCell>
                      <TableCell>
                        <Badge variant='outline'>{device.deviceType}</Badge>
                      </TableCell>
                      <TableCell className='font-mono text-sm'>{device.ipAddress}</TableCell>
                      <TableCell className='font-mono text-sm'>{device.hostname || '-'}</TableCell>
                      <TableCell>
                        {device.asset ? (
                          <div className='flex items-center gap-1 text-sm'>
                            <Server className='h-3 w-3 text-muted-foreground' />
                            <span>{device.asset.name}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>
                          <Activity className='h-3 w-3 mr-1' />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-muted-foreground text-sm'>
                        {formatDistanceToNow(new Date(device.lastSeen), {
                          addSuffix: true,
                          locale: de,
                        })}
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handlePingDevice(device.id)}
                            disabled={isPinging}
                            title='Gerät pingen'
                          >
                            <Activity className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => openEditDialog(device)}
                          >
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleDeleteDevice(device.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className='h-4 w-4 text-destructive' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className='glass-card max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Neues Netzwerkgerät</DialogTitle>
            <DialogDescription>
              Erstellen oder aktualisieren Sie ein Netzwerkgerät
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='create-name'>Name *</Label>
                <Input
                  id='create-name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='z.B. Switch 01'
                />
              </div>
              <div>
                <Label htmlFor='create-type'>Typ *</Label>
                <Select value={deviceType} onValueChange={setDeviceType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='create-ip'>IP-Adresse *</Label>
                <Input
                  id='create-ip'
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder='192.168.1.1'
                />
              </div>
              <div>
                <Label htmlFor='create-hostname'>Hostname</Label>
                <Input
                  id='create-hostname'
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  placeholder='switch01.example.com'
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='create-mac'>MAC-Adresse</Label>
                <Input
                  id='create-mac'
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value)}
                  placeholder='00:11:22:33:44:55'
                />
              </div>
              <div>
                <Label htmlFor='create-asset'>Asset (optional)</Label>
                <Select value={assetId || 'none'} onValueChange={(v) => setAssetId(v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder='Kein Asset ausgewählt' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>Kein Asset</SelectItem>
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name} ({asset.type})
                      </SelectItem>
                    ))}
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
                  placeholder='z.B. Cisco'
                />
              </div>
              <div>
                <Label htmlFor='create-model'>Modell</Label>
                <Input
                  id='create-model'
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder='z.B. Catalyst 2960'
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='create-firmware'>Firmware</Label>
                <Input
                  id='create-firmware'
                  value={firmware}
                  onChange={(e) => setFirmware(e.target.value)}
                  placeholder='z.B. 15.0(2)SE7'
                />
              </div>
              <div>
                <Label htmlFor='create-serial'>Seriennummer</Label>
                <Input
                  id='create-serial'
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='create-subnet'>Subnetz</Label>
                <Input
                  id='create-subnet'
                  value={subnet}
                  onChange={(e) => setSubnet(e.target.value)}
                  placeholder='192.168.1.0/24'
                />
              </div>
              <div>
                <Label htmlFor='create-gateway'>Gateway</Label>
                <Input
                  id='create-gateway'
                  value={gateway}
                  onChange={(e) => setGateway(e.target.value)}
                  placeholder='192.168.1.1'
                />
              </div>
            </div>
            <div>
              <Label htmlFor='create-dns'>DNS-Server (kommagetrennt)</Label>
              <Input
                id='create-dns'
                value={dnsServers}
                onChange={(e) => setDnsServers(e.target.value)}
                placeholder='8.8.8.8, 8.8.4.4'
              />
            </div>
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='create-active'
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className='rounded border-gray-300'
              />
              <Label htmlFor='create-active'>Aktiv</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateDevice} disabled={isCreating}>
              {isCreating ? 'Erstellen...' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='glass-card max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Netzwerkgerät bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Geräteinformationen
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='edit-name'>Name *</Label>
                <Input
                  id='edit-name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='edit-type'>Typ *</Label>
                <Select value={deviceType} onValueChange={setDeviceType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='edit-ip'>IP-Adresse *</Label>
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
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='edit-mac'>MAC-Adresse</Label>
                <Input
                  id='edit-mac'
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='edit-asset'>Asset</Label>
                <Select value={assetId || 'none'} onValueChange={(v) => setAssetId(v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder='Kein Asset ausgewählt' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>Kein Asset</SelectItem>
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name} ({asset.type})
                      </SelectItem>
                    ))}
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
                <Label htmlFor='edit-firmware'>Firmware</Label>
                <Input
                  id='edit-firmware'
                  value={firmware}
                  onChange={(e) => setFirmware(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='edit-serial'>Seriennummer</Label>
                <Input
                  id='edit-serial'
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='edit-subnet'>Subnetz</Label>
                <Input
                  id='edit-subnet'
                  value={subnet}
                  onChange={(e) => setSubnet(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='edit-gateway'>Gateway</Label>
                <Input
                  id='edit-gateway'
                  value={gateway}
                  onChange={(e) => setGateway(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor='edit-dns'>DNS-Server (kommagetrennt)</Label>
              <Input
                id='edit-dns'
                value={dnsServers}
                onChange={(e) => setDnsServers(e.target.value)}
              />
            </div>
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='edit-active'
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className='rounded border-gray-300'
              />
              <Label htmlFor='edit-active'>Aktiv</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEditDevice} disabled={isUpdating}>
              {isUpdating ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default NetworkDevices;

