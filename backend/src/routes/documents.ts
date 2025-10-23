import { Router, Request, Response } from 'express';
import { documentService } from '../services/documentService';

const router = Router();

/**
 * GET /api/documents
 * Alle Dokumente auflisten (mit optionalen Filtern)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, status } = req.query;

    const documents = await documentService.getAllDocuments({
      category: category as string | undefined,
      status: status as string | undefined,
    });

    res.json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    });
  }
});

/**
 * GET /api/documents/stats
 * Statistiken über Dokumente
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await documentService.getDocumentStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    });
  }
});

/**
 * GET /api/documents/:id
 * Einzelnes Dokument abrufen
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const document = await documentService.getDocumentById(id);

    res.json({
      success: true,
      document,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Dokument nicht gefunden',
    });
  }
});

/**
 * POST /api/documents
 * Neues Dokument erstellen
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, content, category, templateId, status } = req.body;

    // Validation
    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        error: 'Titel, Inhalt und Kategorie sind erforderlich',
      });
    }

    const document = await documentService.createDocument({
      title,
      content,
      category,
      templateId,
      status,
    });

    res.status(201).json({
      success: true,
      message: 'Dokument erfolgreich erstellt',
      document,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Fehler beim Erstellen des Dokuments',
    });
  }
});

/**
 * PUT /api/documents/:id
 * Dokument aktualisieren
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, category, status } = req.body;

    const document = await documentService.updateDocument(id, {
      title,
      content,
      category,
      status,
    });

    res.json({
      success: true,
      message: 'Dokument erfolgreich aktualisiert',
      document,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Fehler beim Aktualisieren des Dokuments',
    });
  }
});

/**
 * DELETE /api/documents/:id
 * Dokument löschen
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await documentService.deleteDocument(id);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Fehler beim Löschen des Dokuments',
    });
  }
});

export default router;
