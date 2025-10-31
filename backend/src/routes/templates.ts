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
        description: 'Vollstaendige Server-Dokumentation',
        category: 'Infrastructure',
        content: '<h1>Server Dokumentation</h1><p>Template fuer Server-Dokumentation...</p>',
        structure: JSON.stringify({ sections: ['basic-info', 'hardware', 'software', 'services'] })
      },
      {
        name: 'Netzwerk-Diagramm',
        description: 'Netzwerk-Topologie und Konfiguration',
        category: 'Network',
        content: '<h1>Netzwerk-Diagramm</h1><p>Template fuer Netzwerk-Dokumentation...</p>',
        structure: JSON.stringify({ sections: ['topology', 'addressing', 'devices'] })
      },
      {
        name: 'Backup-Plan',
        description: 'Backup-Strategie und Wiederherstellung',
        category: 'Operations',
        content: '<h1>Backup-Plan</h1><p>Template fuer Backup-Dokumentation...</p>',
        structure: JSON.stringify({ sections: ['strategy', 'schedule', 'retention'] })
      },
      {
        name: 'Runbook',
        description: 'Schritt-fuer-Schritt Anleitungen',
        category: 'Operations',
        content: '<h1>Runbook</h1><p>Template fuer Runbook-Dokumentation...</p>',
        structure: JSON.stringify({ sections: ['procedure', 'steps', 'troubleshooting'] })
      },
      {
        name: 'Security Policy',
        description: 'Sicherheitsrichtlinien',
        category: 'Security',
        content: '<h1>Security Policy</h1><p>Template fuer Security-Dokumentation...</p>',
        structure: JSON.stringify({ sections: ['policy', 'controls', 'compliance'] })
      },
      {
        name: 'Change Log',
        description: 'Aenderungsprotokoll',
        category: 'Documentation',
        content: '<h1>Change Log</h1><p>Template fuer Change Log...</p>',
        structure: JSON.stringify({ sections: ['changes', 'history', 'notes'] })
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