import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

// Get all templates
router.get('/', async (req: Request, res: Response) => {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { name: 'asc' }
    })
    res.json(templates)
  } catch (error) {
    console.error('[Templates] Error:', error)
    res.status(500).json({ error: 'Failed to fetch templates' })
  }
})

// Seed templates if empty
router.post('/seed', async (req: Request, res: Response) => {
  try {
    const count = await prisma.template.count()
    
    if (count > 0) {
      return res.json({ message: 'Templates already exist' })
    }
    
    const templates = [
      {
        name: 'Server Dokumentation',
        icon: '🖥️',
        description: 'Vollstaendige Server-Dokumentation',
        category: 'Infrastructure',
        content: '<h1>Server Dokumentation</h1><p>Template fuer Server-Dokumentation...</p>'
      },
      {
        name: 'Netzwerk-Diagramm',
        icon: '🌐',
        description: 'Netzwerk-Topologie und Konfiguration',
        category: 'Network',
        content: '<h1>Netzwerk-Diagramm</h1><p>Template fuer Netzwerk-Dokumentation...</p>'
      },
      {
        name: 'Backup-Plan',
        icon: '💾',
        description: 'Backup-Strategie und Wiederherstellung',
        category: 'Operations',
        content: '<h1>Backup-Plan</h1><p>Template fuer Backup-Dokumentation...</p>'
      },
      {
        name: 'Runbook',
        icon: '📖',
        description: 'Schritt-fuer-Schritt Anleitungen',
        category: 'Operations',
        content: '<h1>Runbook</h1><p>Template fuer Runbook-Dokumentation...</p>'
      },
      {
        name: 'Security Policy',
        icon: '🔒',
        description: 'Sicherheitsrichtlinien',
        category: 'Security',
        content: '<h1>Security Policy</h1><p>Template fuer Security-Dokumentation...</p>'
      },
      {
        name: 'Change Log',
        icon: '📝',
        description: 'Aenderungsprotokoll',
        category: 'Documentation',
        content: '<h1>Change Log</h1><p>Template fuer Change Log...</p>'
      }
    ]
    
    await prisma.template.createMany({ data: templates })
    
    res.json({ message: 'Templates seeded successfully', count: templates.length })
  } catch (error) {
    console.error('[Templates] Error:', error)
    res.status(500).json({ error: 'Failed to seed templates' })
  }
})

export default router