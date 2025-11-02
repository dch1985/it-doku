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
import { Search, Plus, Edit, Trash2, Calendar, AlertTriangle, TrendingUp, Server } from 'lucide-react';
import { toast } from 'sonner';
import { useContracts, Contract } from '@/hooks/useContracts';
import { useAssets } from '@/hooks/useAssets';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

function Contracts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [showExpiring, setShowExpiring] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('SOFTWARE');
  const [vendor, setVendor] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [autoRenew, setAutoRenew] = useState(false);
  const [monthlyCost, setMonthlyCost] = useState('');
  const [annualCost, setAnnualCost] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [notifyDays, setNotifyDays] = useState('30');
  const [notes, setNotes] = useState('');
  const [assetId, setAssetId] = useState<string>('');

  const { assets } = useAssets();

  const {
    contracts,
    expiringContracts,
    isLoading,
    isLoadingExpiring,
    createContract,
    isCreating,
    updateContract,
    isUpdating,
    renewContract,
    isRenewing,
    deleteContract,
    isDeleting,
  } = useContracts({
    type: filterType !== 'all' ? filterType : undefined,
    expiring: showExpiring,
  });

  const displayContracts = showExpiring ? expiringContracts : contracts;

  const handleCreateContract = async () => {
    if (!name.trim() || !type) {
      toast.error('Name und Typ sind erforderlich');
      return;
    }

    createContract({
      name: name.trim(),
      type,
      vendor: vendor.trim() || undefined,
      contractNumber: contractNumber.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      autoRenew,
      monthlyCost: monthlyCost ? parseFloat(monthlyCost) : undefined,
      annualCost: annualCost ? parseFloat(annualCost) : undefined,
      currency: currency || 'EUR',
      assetId: assetId || undefined,
      notifyDays: notifyDays ? parseInt(notifyDays) : 30,
      notes: notes.trim() || undefined,
    }, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        resetForm();
      }
    });
  };

  const handleEditContract = async () => {
    if (!selectedContract || !name.trim()) {
      toast.error('Name ist erforderlich');
      return;
    }

    updateContract({
      id: selectedContract.id,
      data: {
        name: name.trim(),
        type,
        vendor: vendor.trim() || undefined,
        contractNumber: contractNumber.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        autoRenew,
        monthlyCost: monthlyCost ? parseFloat(monthlyCost) : undefined,
        annualCost: annualCost ? parseFloat(annualCost) : undefined,
        currency: currency || 'EUR',
        assetId: assetId || undefined,
        notifyDays: notifyDays ? parseInt(notifyDays) : 30,
        notes: notes.trim() || undefined,
      }
    }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setSelectedContract(null);
        resetForm();
      }
    });
  };

  const handleRenewContract = async (contractId: string) => {
    renewContract({
      id: contractId,
    }, {
      onSuccess: () => {
        toast.success('Vertrag erfolgreich verlängert (1 Jahr)');
      }
    });
  };

  const handleDeleteContract = async (contractId: string) => {
    if (confirm('Möchten Sie diesen Vertrag wirklich löschen?')) {
      deleteContract(contractId);
    }
  };

  const resetForm = () => {
    setName('');
    setType('SOFTWARE');
    setVendor('');
    setContractNumber('');
    setStartDate('');
    setEndDate('');
    setAutoRenew(false);
    setMonthlyCost('');
    setAnnualCost('');
    setCurrency('EUR');
    setNotifyDays('30');
    setNotes('');
    setAssetId('');
  };

  const openEditDialog = (contract: Contract) => {
    setSelectedContract(contract);
    setName(contract.name);
    setType(contract.type);
    setVendor(contract.vendor || '');
    setContractNumber(contract.contractNumber || '');
    setStartDate(contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '');
    setEndDate(contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : '');
    setAutoRenew(contract.autoRenew);
    setMonthlyCost(contract.monthlyCost?.toString() || '');
    setAnnualCost(contract.annualCost?.toString() || '');
    setCurrency(contract.currency || 'EUR');
    setNotifyDays(contract.notifyDays?.toString() || '30');
    setNotes(contract.notes || '');
    setAssetId(contract.assetId || '');
    setEditDialogOpen(true);
  };

  const getContractStatus = (contract: Contract) => {
    if (!contract.endDate) return null;
    const endDate = new Date(contract.endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { label: 'Abgelaufen', variant: 'destructive' as const, icon: AlertTriangle };
    }
    if (daysUntilExpiry <= 7) {
      return { label: `Läuft ab in ${daysUntilExpiry} Tagen`, variant: 'destructive' as const, icon: AlertTriangle };
    }
    if (daysUntilExpiry <= 30) {
      return { label: `Läuft ab in ${daysUntilExpiry} Tagen`, variant: 'default' as const, icon: Calendar };
    }
    return null;
  };

  const filteredContracts = displayContracts.filter((contract) => {
    const query = searchQuery.toLowerCase();
    return (
      contract.name.toLowerCase().includes(query) ||
      (contract.vendor && contract.vendor.toLowerCase().includes(query)) ||
      (contract.contractNumber && contract.contractNumber.toLowerCase().includes(query))
    );
  });

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Verträge</h2>
        <p className='text-muted-foreground'>
          Verwalten Sie Ihre Verträge und Ablaufdaten
        </p>
      </div>

      {/* Expiring Contracts Alert */}
      {expiringContracts.length > 0 && !showExpiring && (
        <Card className='glass-card border-destructive'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <AlertTriangle className='h-5 w-5 text-destructive' />
                <div>
                  <p className='font-medium'>
                    {expiringContracts.length} Vertrag{expiringContracts.length > 1 ? 'e' : ''} laufen bald ab
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    In den nächsten 30 Tagen
                  </p>
                </div>
              </div>
              <Button variant='outline' onClick={() => setShowExpiring(true)}>
                Anzeigen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions Bar */}
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Verträge durchsuchen...'
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
              <SelectItem value='SOFTWARE'>Software</SelectItem>
              <SelectItem value='HARDWARE'>Hardware</SelectItem>
              <SelectItem value='SUPPORT'>Support</SelectItem>
              <SelectItem value='SSL'>SSL</SelectItem>
              <SelectItem value='DOMAIN'>Domain</SelectItem>
              <SelectItem value='LICENSE'>Lizenz</SelectItem>
              <SelectItem value='MAINTENANCE'>Wartung</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={showExpiring ? 'default' : 'outline'}
            onClick={() => setShowExpiring(!showExpiring)}
          >
            <AlertTriangle className='mr-2 h-4 w-4' />
            Ablaufend
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Neuer Vertrag
          </Button>
        </div>
      </div>

      {/* Contracts Table */}
      <Card className='glass-card'>
        <CardHeader>
          <CardTitle>
            Verträge ({filteredContracts.length})
            {showExpiring && ' - Ablaufend'}
          </CardTitle>
          <CardDescription>
            {showExpiring
              ? 'Verträge die in den nächsten 30 Tagen ablaufen'
              : 'Alle verwalteten Verträge'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || (showExpiring && isLoadingExpiring) ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-muted-foreground'>Lade Verträge...</div>
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <Calendar className='h-12 w-12 text-muted-foreground mb-4' />
              <p className='text-lg font-medium mb-2'>Keine Verträge gefunden</p>
              <p className='text-sm text-muted-foreground mb-4'>
                {searchQuery || filterType !== 'all' || showExpiring
                  ? 'Versuchen Sie eine andere Suche'
                  : 'Erstellen Sie Ihren ersten Vertrag'}
              </p>
              {!searchQuery && filterType === 'all' && !showExpiring && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className='mr-2 h-4 w-4' />
                  Neuen Vertrag erstellen
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Laufzeit</TableHead>
                  <TableHead>Kosten</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => {
                  const status = getContractStatus(contract);
                  return (
                    <TableRow key={contract.id}>
                      <TableCell className='font-medium'>{contract.name}</TableCell>
                      <TableCell>
                        <Badge variant='outline'>{contract.type}</Badge>
                      </TableCell>
                      <TableCell>{contract.vendor || '-'}</TableCell>
                      <TableCell>
                        {contract.asset ? (
                          <div className='flex items-center gap-1 text-sm'>
                            <Server className='h-3 w-3 text-muted-foreground' />
                            <span>{contract.asset.name}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className='text-sm'>
                          {contract.endDate ? (
                            <div>
                              <div>bis {new Date(contract.endDate).toLocaleDateString('de-DE')}</div>
                              {contract.endDate && (
                                <div className='text-muted-foreground text-xs'>
                                  {formatDistanceToNow(new Date(contract.endDate), {
                                    addSuffix: true,
                                    locale: de,
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contract.annualCost ? (
                          <div>
                            <div className='font-medium'>{contract.annualCost.toFixed(2)} {contract.currency || 'EUR'}/Jahr</div>
                            {contract.monthlyCost && (
                              <div className='text-xs text-muted-foreground'>
                                {contract.monthlyCost.toFixed(2)} {contract.currency || 'EUR'}/Monat
                              </div>
                            )}
                          </div>
                        ) : contract.monthlyCost ? (
                          <div className='font-medium'>{contract.monthlyCost.toFixed(2)} {contract.currency || 'EUR'}/Monat</div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {status && (
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        )}
                        {!status && contract.autoRenew && (
                          <Badge variant='secondary'>Auto-Verlängerung</Badge>
                        )}
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-2'>
                          {status && status.variant === 'destructive' && (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleRenewContract(contract.id)}
                              disabled={isRenewing}
                            >
                              <TrendingUp className='h-4 w-4 mr-1' />
                              Verlängern
                            </Button>
                          )}
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => openEditDialog(contract)}
                          >
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleDeleteContract(contract.id)}
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
            <DialogTitle>Neuer Vertrag</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Vertrag
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='create-name'>Name *</Label>
              <Input
                id='create-name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='z.B. Microsoft 365 Business Standard'
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
                    <SelectItem value='SOFTWARE'>Software</SelectItem>
                    <SelectItem value='HARDWARE'>Hardware</SelectItem>
                    <SelectItem value='SUPPORT'>Support</SelectItem>
                    <SelectItem value='SSL'>SSL</SelectItem>
                    <SelectItem value='DOMAIN'>Domain</SelectItem>
                    <SelectItem value='LICENSE'>Lizenz</SelectItem>
                    <SelectItem value='MAINTENANCE'>Wartung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='create-vendor'>Vendor</Label>
                <Input
                  id='create-vendor'
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder='z.B. Microsoft'
                />
              </div>
            </div>
            <div>
              <Label htmlFor='create-contract-number'>Vertragsnummer</Label>
              <Input
                id='create-contract-number'
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='create-start-date'>Startdatum</Label>
                <Input
                  id='create-start-date'
                  type='date'
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='create-end-date'>Enddatum</Label>
                <Input
                  id='create-end-date'
                  type='date'
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='create-monthly'>Monatliche Kosten</Label>
                <Input
                  id='create-monthly'
                  type='number'
                  step='0.01'
                  value={monthlyCost}
                  onChange={(e) => setMonthlyCost(e.target.value)}
                  placeholder='0.00'
                />
              </div>
              <div>
                <Label htmlFor='create-annual'>Jährliche Kosten</Label>
                <Input
                  id='create-annual'
                  type='number'
                  step='0.01'
                  value={annualCost}
                  onChange={(e) => setAnnualCost(e.target.value)}
                  placeholder='0.00'
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='create-currency'>Währung</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='EUR'>EUR</SelectItem>
                    <SelectItem value='USD'>USD</SelectItem>
                    <SelectItem value='GBP'>GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='create-notify'>Benachrichtigung (Tage)</Label>
                <Input
                  id='create-notify'
                  type='number'
                  value={notifyDays}
                  onChange={(e) => setNotifyDays(e.target.value)}
                  placeholder='30'
                />
              </div>
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
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='create-auto-renew'
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className='rounded border-gray-300'
              />
              <Label htmlFor='create-auto-renew'>Automatische Verlängerung</Label>
            </div>
            <div>
              <Label htmlFor='create-notes'>Notizen</Label>
              <Textarea
                id='create-notes'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='Zusätzliche Informationen...'
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateContract} disabled={isCreating}>
              {isCreating ? 'Erstellen...' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='glass-card max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Vertrag bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Vertragsinformationen
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
                    <SelectItem value='SOFTWARE'>Software</SelectItem>
                    <SelectItem value='HARDWARE'>Hardware</SelectItem>
                    <SelectItem value='SUPPORT'>Support</SelectItem>
                    <SelectItem value='SSL'>SSL</SelectItem>
                    <SelectItem value='DOMAIN'>Domain</SelectItem>
                    <SelectItem value='LICENSE'>Lizenz</SelectItem>
                    <SelectItem value='MAINTENANCE'>Wartung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='edit-vendor'>Vendor</Label>
                <Input
                  id='edit-vendor'
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor='edit-contract-number'>Vertragsnummer</Label>
              <Input
                id='edit-contract-number'
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='edit-start-date'>Startdatum</Label>
                <Input
                  id='edit-start-date'
                  type='date'
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='edit-end-date'>Enddatum</Label>
                <Input
                  id='edit-end-date'
                  type='date'
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='edit-monthly'>Monatliche Kosten</Label>
                <Input
                  id='edit-monthly'
                  type='number'
                  step='0.01'
                  value={monthlyCost}
                  onChange={(e) => setMonthlyCost(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='edit-annual'>Jährliche Kosten</Label>
                <Input
                  id='edit-annual'
                  type='number'
                  step='0.01'
                  value={annualCost}
                  onChange={(e) => setAnnualCost(e.target.value)}
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='edit-currency'>Währung</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='EUR'>EUR</SelectItem>
                    <SelectItem value='USD'>USD</SelectItem>
                    <SelectItem value='GBP'>GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='edit-notify'>Benachrichtigung (Tage)</Label>
                <Input
                  id='edit-notify'
                  type='number'
                  value={notifyDays}
                  onChange={(e) => setNotifyDays(e.target.value)}
                />
              </div>
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
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='edit-auto-renew'
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className='rounded border-gray-300'
              />
              <Label htmlFor='edit-auto-renew'>Automatische Verlängerung</Label>
            </div>
            <div>
              <Label htmlFor='edit-notes'>Notizen</Label>
              <Textarea
                id='edit-notes'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEditContract} disabled={isUpdating}>
              {isUpdating ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Contracts;

