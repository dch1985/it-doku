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
import { Search, Plus, Eye, EyeOff, Edit, Trash2, Link as LinkIcon, Lock, Server } from 'lucide-react';
import { toast } from 'sonner';
import { usePasswords } from '@/hooks/usePasswords';
import { useAssets } from '@/hooks/useAssets';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

function Passwords() {
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [revealDialogOpen, setRevealDialogOpen] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<any>(null);
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [assetId, setAssetId] = useState<string>('');

  const { assets } = useAssets();

  const {
    passwords,
    isLoading,
    revealPassword,
    isRevealing,
    createPassword,
    isCreating,
    updatePassword,
    isUpdating,
    deletePassword,
    isDeleting,
  } = usePasswords();

  // Filter passwords by search query
  const filteredPasswords = passwords.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      (p.username && p.username.toLowerCase().includes(query)) ||
      (p.url && p.url.toLowerCase().includes(query))
    );
  });

  const handleCreatePassword = async () => {
    if (!name.trim() || !password.trim()) {
      toast.error('Name und Passwort sind erforderlich');
      return;
    }

    createPassword({
      name: name.trim(),
      username: username.trim() || undefined,
      password,
      url: url.trim() || undefined,
      notes: notes.trim() || undefined,
      expiresAt: expiresAt || undefined,
      assetId: assetId || undefined,
    }, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setName('');
        setUsername('');
        setPassword('');
        setUrl('');
        setNotes('');
        setExpiresAt('');
      }
    });
  };

  const handleEditPassword = async () => {
    if (!selectedPassword || !name.trim()) {
      toast.error('Name ist erforderlich');
      return;
    }

    updatePassword({
      id: selectedPassword.id,
      data: {
        name: name.trim(),
        username: username.trim() || undefined,
        password: password || undefined,
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
        expiresAt: expiresAt || undefined,
        assetId: assetId || undefined,
      }
    }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setSelectedPassword(null);
        setName('');
        setUsername('');
        setPassword('');
        setUrl('');
        setNotes('');
        setExpiresAt('');
      }
    });
  };

  const handleRevealPassword = async (passwordId: string) => {
    revealPassword(passwordId, {
      onSuccess: (data) => {
        setRevealedPassword(data.password);
        setRevealDialogOpen(true);
        // Auto-hide after 30 seconds
        setTimeout(() => {
          setRevealedPassword(null);
          setRevealDialogOpen(false);
        }, 30000);
      }
    });
  };

  const handleDeletePassword = async (passwordId: string) => {
    if (confirm('Möchten Sie dieses Passwort wirklich löschen?')) {
      deletePassword(passwordId);
    }
  };

  const openEditDialog = (pwd: any) => {
    setSelectedPassword(pwd);
    setName(pwd.name);
    setUsername(pwd.username || '');
    setPassword(''); // Don't pre-fill password for security
    setUrl(pwd.url || '');
    setNotes(pwd.notes || '');
    setExpiresAt(pwd.expiresAt ? new Date(pwd.expiresAt).toISOString().split('T')[0] : '');
    setAssetId(pwd.assetId || '');
    setEditDialogOpen(true);
  };

  // Check if password is expired or expiring soon
  const getPasswordStatus = (pwd: any) => {
    if (!pwd.expiresAt) return null;
    const expiryDate = new Date(pwd.expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { label: 'Abgelaufen', variant: 'destructive' as const };
    if (daysUntilExpiry <= 7) return { label: `Läuft ab in ${daysUntilExpiry} Tagen`, variant: 'destructive' as const };
    if (daysUntilExpiry <= 30) return { label: `Läuft ab in ${daysUntilExpiry} Tagen`, variant: 'default' as const };
    return null;
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Passwörter</h2>
        <p className='text-muted-foreground'>
          Verwalten Sie Ihre Passwörter sicher und verschlüsselt
        </p>
      </div>

      {/* Actions Bar */}
      <div className='flex items-center justify-between gap-4'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Passwörter durchsuchen...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Neues Passwort
        </Button>
      </div>

      {/* Passwords Table */}
      <Card className='glass-card'>
        <CardHeader>
          <CardTitle>Passwörter ({filteredPasswords.length})</CardTitle>
          <CardDescription>Alle gespeicherten Passwörter</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-muted-foreground'>Lade Passwörter...</div>
            </div>
          ) : filteredPasswords.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <Lock className='h-12 w-12 text-muted-foreground mb-4' />
              <p className='text-lg font-medium mb-2'>Keine Passwörter gefunden</p>
              <p className='text-sm text-muted-foreground mb-4'>
                {searchQuery ? 'Versuchen Sie eine andere Suche' : 'Erstellen Sie Ihr erstes Passwort'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className='mr-2 h-4 w-4' />
                  Neues Passwort erstellen
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Benutzername</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Zuletzt geändert</TableHead>
                  <TableHead className='text-right'>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPasswords.map((pwd) => {
                  const status = getPasswordStatus(pwd);
                  return (
                    <TableRow key={pwd.id}>
                      <TableCell className='font-medium'>{pwd.name}</TableCell>
                      <TableCell>{pwd.username || '-'}</TableCell>
                      <TableCell>
                        {pwd.asset ? (
                          <div className='flex items-center gap-1 text-sm'>
                            <Server className='h-3 w-3 text-muted-foreground' />
                            <span>{pwd.asset.name}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {pwd.url ? (
                          <a
                            href={pwd.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex items-center gap-1 text-primary hover:underline'
                          >
                            <LinkIcon className='h-3 w-3' />
                            {pwd.url.length > 30 ? `${pwd.url.substring(0, 30)}...` : pwd.url}
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {status && (
                          <Badge variant={status.variant}>{status.label}</Badge>
                        )}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {pwd.lastChanged
                          ? formatDistanceToNow(new Date(pwd.lastChanged), {
                              addSuffix: true,
                              locale: de,
                            })
                          : '-'}
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleRevealPassword(pwd.id)}
                            disabled={isRevealing}
                          >
                            <Eye className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => openEditDialog(pwd)}
                          >
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleDeletePassword(pwd.id)}
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
            <DialogTitle>Neues Passwort</DialogTitle>
            <DialogDescription>
              Erstellen Sie ein neues Passwort. Es wird verschlüsselt gespeichert.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='create-name'>Name *</Label>
              <Input
                id='create-name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='z.B. Server Admin Login'
              />
            </div>
            <div>
              <Label htmlFor='create-username'>Benutzername</Label>
              <Input
                id='create-username'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder='admin'
              />
            </div>
            <div>
              <Label htmlFor='create-password'>Passwort *</Label>
              <Input
                id='create-password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='••••••••'
              />
            </div>
            <div>
              <Label htmlFor='create-url'>URL</Label>
              <Input
                id='create-url'
                type='url'
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder='https://example.com'
              />
            </div>
            <div>
              <Label htmlFor='create-expires'>Ablaufdatum (optional)</Label>
              <Input
                id='create-expires'
                type='date'
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
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
            <div>
              <Label htmlFor='create-notes'>Notizen</Label>
              <Textarea
                id='create-notes'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='Zusätzliche Informationen...'
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreatePassword} disabled={isCreating}>
              {isCreating ? 'Erstellen...' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='glass-card max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Passwort bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie das Passwort. Leer lassen, um das aktuelle Passwort zu behalten.
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
            <div>
              <Label htmlFor='edit-username'>Benutzername</Label>
              <Input
                id='edit-username'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor='edit-password'>Neues Passwort (optional)</Label>
              <Input
                id='edit-password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Leer lassen, um aktuelles Passwort zu behalten'
              />
            </div>
            <div>
              <Label htmlFor='edit-url'>URL</Label>
              <Input
                id='edit-url'
                type='url'
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor='edit-expires'>Ablaufdatum</Label>
              <Input
                id='edit-expires'
                type='date'
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
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
            <div>
              <Label htmlFor='edit-notes'>Notizen</Label>
              <Textarea
                id='edit-notes'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEditPassword} disabled={isUpdating}>
              {isUpdating ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reveal Dialog */}
      <Dialog open={revealDialogOpen} onOpenChange={setRevealDialogOpen}>
        <DialogContent className='glass-card max-w-md'>
          <DialogHeader>
            <DialogTitle>Passwort anzeigen</DialogTitle>
            <DialogDescription>
              Zugriff wurde protokolliert. Das Passwort wird in 30 Sekunden automatisch ausgeblendet.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='p-4 bg-muted rounded-lg font-mono text-center text-lg'>
              {revealedPassword || '••••••••'}
            </div>
            <Button
              variant='outline'
              onClick={() => {
                navigator.clipboard.writeText(revealedPassword || '');
                toast.success('Passwort in Zwischenablage kopiert');
              }}
              className='w-full'
            >
              In Zwischenablage kopieren
            </Button>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => {
              setRevealedPassword(null);
              setRevealDialogOpen(false);
            }}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Passwords;

