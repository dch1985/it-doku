import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface TemplateFormProps {
  template: {
    id: string
    name: string
    description?: string | null
    content: string
    structure?: string | null
    category: string
    isNistCompliant: boolean
    nistFramework?: string | null
  }
  open: boolean
  onClose: () => void
  onSubmit: (title: string, customFields: Record<string, any>) => Promise<void>
}

/**
 * Extrahiert alle Platzhalter aus dem Template-Content
 */
function extractPlaceholders(content: string): string[] {
  const placeholderRegex = /\{\{(\w+)\}\}/g
  const placeholders = new Set<string>()

  let match
  while ((match = placeholderRegex.exec(content)) !== null) {
    placeholders.add(match[1])
  }

  // System-Platzhalter ignorieren (werden automatisch ersetzt)
  const systemPlaceholders = ['createdDate', 'updatedDate', 'version']
  return Array.from(placeholders).filter(p => !systemPlaceholders.includes(p))
}

/**
 * Generiert einen benutzerfreundlichen Label aus einem Platzhalter-Namen
 */
function formatLabel(placeholder: string): string {
  // Ersetze camelCase mit Leerzeichen
  return placeholder
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

/**
 * Erkennt den Feldtyp basierend auf dem Platzhalter-Namen
 */
function detectFieldType(placeholder: string, value: string): 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date' {
  const lower = placeholder.toLowerCase()
  
  if (lower.includes('email')) return 'text'
  if (lower.includes('date') || lower.includes('datum')) return 'date'
  if (lower.includes('count') || lower.includes('zahl') || lower.includes('number')) return 'number'
  if (lower.includes('bool') || lower.includes('enabled') || lower.includes('aktiv')) return 'checkbox'
  if (lower.includes('select') || lower.includes('type') || lower.includes('kategorie')) return 'select'
  if (lower.includes('description') || lower.includes('beschreibung') || lower.includes('notes') || lower.includes('notes') || value.length > 50) return 'textarea'
  
  return 'text'
}

/**
 * Generiert Optionen für Select-Felder basierend auf Platzhalter-Namen
 */
function getSelectOptions(placeholder: string): string[] {
  const lower = placeholder.toLowerCase()
  
  if (lower.includes('environment') || lower.includes('umgebung')) {
    return ['Produktion', 'Staging', 'Entwicklung', 'Test']
  }
  if (lower.includes('category') || lower.includes('kategorie')) {
    return ['DOCUMENTATION', 'CODE_ANALYSIS', 'TEMPLATE', 'KNOWLEDGE_BASE', 'MEETING_NOTES', 'TUTORIAL', 'API_SPEC']
  }
  if (lower.includes('status')) {
    return ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'REVIEW']
  }
  if (lower.includes('location') || lower.includes('standort')) {
    return ['Datacenter 1 - Frankfurt', 'Datacenter 2 - München', 'Azure Cloud', 'AWS Cloud', 'On-Premise']
  }
  if (lower.includes('role') || lower.includes('rolle')) {
    return ['Administrator', 'Operator', 'Benutzer', 'Gast']
  }
  
  return []
}

export function TemplateForm({ template, open, onClose, onSubmit }: TemplateFormProps) {
  const [title, setTitle] = useState('')
  const [fields, setFields] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  // Extrahiere Platzhalter beim Öffnen
  useEffect(() => {
    if (open && template.content) {
      const placeholders = extractPlaceholders(template.content)
      const initialFields: Record<string, any> = {}
      
      placeholders.forEach(placeholder => {
        initialFields[placeholder] = ''
      })
      
      setFields(initialFields)
      setTitle(template.name)
    }
  }, [open, template])

  const placeholders = extractPlaceholders(template.content)
  
  // Gruppiere Felder nach Sections (wenn structure vorhanden)
  let sections: Array<{ id: string; title: string; fields: string[] }> = []
  
  // Versuche zuerst aus Structure zu extrahieren
  if (template.structure) {
    try {
      const structure = JSON.parse(template.structure)
      if (structure.sections && Array.isArray(structure.sections)) {
        // Wenn Sections definiert sind, verteile alle Platzhalter gleichmäßig
        const placeholdersPerSection = Math.ceil(placeholders.length / structure.sections.length)
        
        structure.sections.forEach((sec: any, index: number) => {
          const startIndex = index * placeholdersPerSection
          const endIndex = Math.min(startIndex + placeholdersPerSection, placeholders.length)
          const sectionFields = placeholders.slice(startIndex, endIndex)
          
          if (sectionFields.length > 0) {
            sections.push({
              id: sec.id || `section-${sec.order}`,
              title: sec.title || `Section ${sec.order}`,
              fields: sectionFields
            })
          }
        })
      }
    } catch (e) {
      // Structure nicht parsbar, verwende Standard
      console.warn('Could not parse template structure:', e)
    }
  }

  // Wenn keine Sections aus Structure, erstelle intelligente Gruppierung
  if (sections.length === 0) {
    // Versuche intelligente Gruppierung basierend auf Feldnamen
    const basicFields = placeholders.filter(p => {
      const lower = p.toLowerCase()
      return ['name', 'title', 'system', 'hostname', 'ip', 'location', 'owner', 'contact', 'responsible', 'server'].some(
        keyword => lower.includes(keyword)
      )
    })
    
    const configFields = placeholders.filter(p => {
      const lower = p.toLowerCase()
      return ['config', 'setting', 'parameter', 'option', 'deployment', 'installation'].some(
        keyword => lower.includes(keyword)
      )
    })
    
    const securityFields = placeholders.filter(p => {
      const lower = p.toLowerCase()
      return ['security', 'encryption', 'authentication', 'firewall', 'access', 'permission'].some(
        keyword => lower.includes(keyword)
      )
    })
    
    const backupFields = placeholders.filter(p => {
      const lower = p.toLowerCase()
      return ['backup', 'restore', 'retention', 'rpo', 'rto', 'schedule'].some(
        keyword => lower.includes(keyword)
      )
    })
    
    const monitoringFields = placeholders.filter(p => {
      const lower = p.toLowerCase()
      return ['monitoring', 'alert', 'metric', 'threshold', 'tool'].some(
        keyword => lower.includes(keyword)
      )
    })
    
    // Alle anderen Felder
    const otherFields = placeholders.filter(p => 
      !basicFields.includes(p) && 
      !configFields.includes(p) && 
      !securityFields.includes(p) && 
      !backupFields.includes(p) &&
      !monitoringFields.includes(p)
    )
    
    // Erstelle Sections nur wenn Felder vorhanden
    if (basicFields.length > 0) {
      sections.push({ id: 'basic', title: 'Basis-Informationen', fields: basicFields })
    }
    if (configFields.length > 0) {
      sections.push({ id: 'config', title: 'Konfiguration', fields: configFields })
    }
    if (securityFields.length > 0) {
      sections.push({ id: 'security', title: 'Sicherheit', fields: securityFields })
    }
    if (backupFields.length > 0) {
      sections.push({ id: 'backup', title: 'Backup & Disaster Recovery', fields: backupFields })
    }
    if (monitoringFields.length > 0) {
      sections.push({ id: 'monitoring', title: 'Monitoring & Überwachung', fields: monitoringFields })
    }
    if (otherFields.length > 0) {
      sections.push({ id: 'other', title: 'Weitere Informationen', fields: otherFields })
    }
    
    // Wenn immer noch keine Sections, alle Felder in eine Section
    if (sections.length === 0 && placeholders.length > 0) {
      sections.push({ id: 'all', title: 'Eingaben', fields: placeholders })
    }
  }

  // Stelle sicher, dass ALLE Platzhalter in Sections sind
  const allPlaceholdersInSections = sections.flatMap(s => s.fields)
  const missingPlaceholders = placeholders.filter(p => !allPlaceholdersInSections.includes(p))
  
  if (missingPlaceholders.length > 0) {
    // Füge fehlende Platzhalter zur letzten Section hinzu (oder erstelle neue)
    if (sections.length > 0) {
      sections[sections.length - 1].fields.push(...missingPlaceholders)
    } else {
      sections.push({ id: 'all', title: 'Eingaben', fields: missingPlaceholders })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await onSubmit(title, fields)
      onClose()
      // Reset form
      setTitle('')
      setFields({})
    } catch (error) {
      console.error('Error submitting template form:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateField = (placeholder: string, value: any) => {
    setFields(prev => ({ ...prev, [placeholder]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Dokument aus Template erstellen</DialogTitle>
          <DialogDescription>
            {template.description || 'Bitte füllen Sie alle Felder aus'}
          </DialogDescription>
          {template.isNistCompliant && (
            <Badge variant="default" className="mt-2">
              {template.nistFramework || 'NIST'}
            </Badge>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 space-y-6">
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* Titel */}
          <div className="space-y-2">
            <Label htmlFor="document-title">Dokument-Titel *</Label>
            <Input
              id="document-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Server-Produktion-01"
              required
            />
          </div>

          {/* Felder nach Sections gruppiert */}
          <Tabs defaultValue={sections[0]?.id || 'all'}>
            <TabsList>
              {sections.map((section) => (
                <TabsTrigger key={section.id} value={section.id}>
                  {section.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {sections.map((section) => (
              <TabsContent key={section.id} value={section.id} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>
                      {section.fields.length} Feld{section.fields.length !== 1 ? 'er' : ''} in dieser Section
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {section.fields.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Keine Felder in dieser Section</p>
                    ) : (
                      section.fields.map((placeholder) => {
                        const fieldType = detectFieldType(placeholder, fields[placeholder] || '')
                        const label = formatLabel(placeholder)
                        const value = fields[placeholder] || ''

                        return (
                          <div key={placeholder} className="space-y-2">
                            <Label htmlFor={placeholder}>
                              {label}
                              {placeholder.toLowerCase().includes('required') && <span className="text-red-500"> *</span>}
                            </Label>
                            
                            {fieldType === 'textarea' ? (
                              <Textarea
                                id={placeholder}
                                value={value}
                                onChange={(e) => updateField(placeholder, e.target.value)}
                                placeholder={`${label} eingeben...`}
                                rows={4}
                              />
                            ) : fieldType === 'select' ? (
                              <Select
                                value={value}
                                onValueChange={(val) => updateField(placeholder, val)}
                              >
                                <SelectTrigger id={placeholder}>
                                  <SelectValue placeholder={`${label} auswählen...`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {getSelectOptions(placeholder).length > 0 ? (
                                    getSelectOptions(placeholder).map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <>
                                      <SelectItem value="ja">Ja</SelectItem>
                                      <SelectItem value="nein">Nein</SelectItem>
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                            ) : fieldType === 'checkbox' ? (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={placeholder}
                                  checked={value === true || value === 'true'}
                                  onCheckedChange={(checked) => updateField(placeholder, checked)}
                                />
                                <Label htmlFor={placeholder} className="font-normal cursor-pointer">
                                  {label}
                                </Label>
                              </div>
                            ) : fieldType === 'number' ? (
                              <Input
                                id={placeholder}
                                type="number"
                                value={value}
                                onChange={(e) => updateField(placeholder, e.target.value)}
                                placeholder={`${label} eingeben...`}
                              />
                            ) : fieldType === 'date' ? (
                              <Input
                                id={placeholder}
                                type="date"
                                value={value}
                                onChange={(e) => updateField(placeholder, e.target.value)}
                              />
                            ) : (
                              <Input
                                id={placeholder}
                                type="text"
                                value={value}
                                onChange={(e) => updateField(placeholder, e.target.value)}
                                placeholder={`${label} eingeben...`}
                              />
                            )}
                            
                            <p className="text-xs text-muted-foreground">
                              Platzhalter: <code className="text-xs bg-muted px-1 rounded">{`{{${placeholder}}}`}</code>
                            </p>
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
          </div>

          {/* Buttons - Always visible at bottom */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Wird erstellt...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

