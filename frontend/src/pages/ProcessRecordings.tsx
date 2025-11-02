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
import { Search, Plus, Edit, Trash2, Video, PlayCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useProcessRecordings, ProcessRecording } from '@/hooks/useProcessRecordings';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

function ProcessRecordings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<ProcessRecording | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [processType, setProcessType] = useState('PROCEDURE');
  const [status, setStatus] = useState('RECORDING');
  const [steps, setSteps] = useState('');

  const {
    recordings,
    isLoading,
    createRecording,
    isCreating,
    updateRecording,
    isUpdating,
    deleteRecording,
    isDeleting,
  } = useProcessRecordings({
    processType: filterType !== 'all' ? filterType : undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    search: searchQuery || undefined,
  });

  const handleCreateRecording = async () => {
    if (!title.trim() || !processType) {
      toast.error('Titel und Prozess-Typ sind erforderlich');
      return;
    }

    createRecording({
      title: title.trim(),
      description: description.trim() || undefined,
      processType,
      steps: steps.trim() ? JSON.parse(steps) : undefined,
      status: status || 'RECORDING',
    }, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        resetForm();
      }
    });
  };

  const handleEditRecording = async () => {
    if (!selectedRecording || !title.trim()) {
      toast.error('Titel ist erforderlich');
      return;
    }

    updateRecording({
      id: selectedRecording.id,
      data: {
        title: title.trim(),
        description: description.trim() || undefined,
        processType,
        steps: steps.trim() ? JSON.parse(steps) : undefined,
        status,
      }
    }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setSelectedRecording(null);
        resetForm();
      }
    });
  };

  const handleDeleteRecording = async (recordingId: string) => {
    if (confirm('Möchten Sie diese Prozessaufzeichnung wirklich löschen?')) {
      deleteRecording(recordingId);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setProcessType('PROCEDURE');
    setStatus('RECORDING');
    setSteps('');
  };

  const openEditDialog = (recording: ProcessRecording) => {
    setSelectedRecording(recording);
    setTitle(recording.title);
    setDescription(recording.description || '');
    setProcessType(recording.processType);
    setStatus(recording.status);
    setSteps(recording.steps ? JSON.stringify(JSON.parse(recording.steps), null, 2) : '');
    setEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      RECORDING: 'default',
      PROCESSING: 'secondary',
      COMPLETED: 'default',
      FAILED: 'destructive',
    };
    return variants[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      RECORDING: 'Aufzeichnung',
      PROCESSING: 'Verarbeitung',
      COMPLETED: 'Abgeschlossen',
      FAILED: 'Fehlgeschlagen',
    };
    return labels[status] || status;
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Prozessaufzeichnungen</h2>
        <p className='text-muted-foreground'>
          Verwalten Sie Ihre Prozessaufzeichnungen und SOP-Generierung
        </p>
      </div>

      {/* Actions Bar */}
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Aufzeichnungen durchsuchen...'
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
              <SelectItem value='PROCEDURE'>Prozedur</SelectItem>
              <SelectItem value='TUTORIAL'>Tutorial</SelectItem>
              <SelectItem value='TROUBLESHOOTING'>Fehlerbehebung</SelectItem>
              <SelectItem value='INSTALLATION'>Installation</SelectItem>
              <SelectItem value='CONFIGURATION'>Konfiguration</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Alle Status</SelectItem>
              <SelectItem value='RECORDING'>Aufzeichnung</SelectItem>
              <SelectItem value='PROCESSING'>Verarbeitung</SelectItem>
              <SelectItem value='COMPLETED'>Abgeschlossen</SelectItem>
              <SelectItem value='FAILED'>Fehlgeschlagen</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Neue Aufzeichnung
          </Button>
        </div>
      </div>

      {/* Recordings Table */}
      <Card className='glass-card'>
        <CardHeader>
          <CardTitle>Prozessaufzeichnungen ({recordings.length})</CardTitle>
          <CardDescription>Alle Prozessaufzeichnungen und SOPs</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-muted-foreground'>Lade Aufzeichnungen...</div>
            </div>
          ) : recordings.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <Video className='h-12 w-12 text-muted-foreground mb-4' />
              <p className='text-lg font-medium mb-2'>Keine Aufzeichnungen gefunden</p>
              <p className='text-sm text-muted-foreground mb-4'>
                {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Versuchen Sie eine andere Suche'
                  : 'Erstellen Sie Ihre erste Prozessaufzeichnung'}
              </p>
              {!searchQuery && filterType === 'all' && filterStatus === 'all' && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className='mr-2 h-4 w-4' />
                  Neue Aufzeichnung erstellen
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erstellt von</TableHead>
                  <TableHead>Erstellt am</TableHead>
                  <TableHead className='text-right'>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordings.map((recording) => (
                  <TableRow key={recording.id}>
                    <TableCell className='font-medium'>{recording.title}</TableCell>
                    <TableCell>
                      <Badge variant='outline'>{recording.processType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(recording.status)}>
                        {getStatusLabel(recording.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {recording.user ? recording.user.name : '-'}
                    </TableCell>
                    <TableCell className='text-muted-foreground text-sm'>
                      {formatDistanceToNow(new Date(recording.createdAt), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        {recording.documentId && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                              window.location.hash = `document/${recording.documentId}`;
                            }}
                            title='Dokument anzeigen'
                          >
                            <FileText className='h-4 w-4' />
                          </Button>
                        )}
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => openEditDialog(recording)}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDeleteRecording(recording.id)}
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
            <DialogTitle>Neue Prozessaufzeichnung</DialogTitle>
            <DialogDescription>
              Erstellen Sie eine neue Prozessaufzeichnung
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='create-title'>Titel *</Label>
              <Input
                id='create-title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='z.B. Server Installation'
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='create-type'>Prozess-Typ *</Label>
                <Select value={processType} onValueChange={setProcessType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='PROCEDURE'>Prozedur</SelectItem>
                    <SelectItem value='TUTORIAL'>Tutorial</SelectItem>
                    <SelectItem value='TROUBLESHOOTING'>Fehlerbehebung</SelectItem>
                    <SelectItem value='INSTALLATION'>Installation</SelectItem>
                    <SelectItem value='CONFIGURATION'>Konfiguration</SelectItem>
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
                    <SelectItem value='RECORDING'>Aufzeichnung</SelectItem>
                    <SelectItem value='PROCESSING'>Verarbeitung</SelectItem>
                    <SelectItem value='COMPLETED'>Abgeschlossen</SelectItem>
                    <SelectItem value='FAILED'>Fehlgeschlagen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor='create-description'>Beschreibung</Label>
              <Textarea
                id='create-description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Beschreibung des Prozesses...'
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor='create-steps'>Schritte (JSON Array)</Label>
              <Textarea
                id='create-steps'
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder='["Schritt 1", "Schritt 2", ...]'
                rows={6}
                className='font-mono text-sm'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateRecording} disabled={isCreating}>
              {isCreating ? 'Erstellen...' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='glass-card max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Prozessaufzeichnung bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Aufzeichnungs-Informationen
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='edit-title'>Titel *</Label>
              <Input
                id='edit-title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='edit-type'>Prozess-Typ *</Label>
                <Select value={processType} onValueChange={setProcessType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='PROCEDURE'>Prozedur</SelectItem>
                    <SelectItem value='TUTORIAL'>Tutorial</SelectItem>
                    <SelectItem value='TROUBLESHOOTING'>Fehlerbehebung</SelectItem>
                    <SelectItem value='INSTALLATION'>Installation</SelectItem>
                    <SelectItem value='CONFIGURATION'>Konfiguration</SelectItem>
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
                    <SelectItem value='RECORDING'>Aufzeichnung</SelectItem>
                    <SelectItem value='PROCESSING'>Verarbeitung</SelectItem>
                    <SelectItem value='COMPLETED'>Abgeschlossen</SelectItem>
                    <SelectItem value='FAILED'>Fehlgeschlagen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <div>
              <Label htmlFor='edit-steps'>Schritte (JSON Array)</Label>
              <Textarea
                id='edit-steps'
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                rows={6}
                className='font-mono text-sm'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEditRecording} disabled={isUpdating}>
              {isUpdating ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProcessRecordings;

