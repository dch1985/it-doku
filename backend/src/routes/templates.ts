import { Router, Request, Response } from 'express';
import { templateService } from '../services/templateService';

const router = Router();

/**
 * GET /api/templates
 * Alle Templates auflisten (mit optionalen Filtern)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, type } = req.query;

    const templates = await templateService.getAllTemplates({
      category: category as string | undefined,
      type: type as string | undefined,
    });

    res.json({
      success: true,
      count: templates.length,
      templates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    });
  }
});

/**
 * GET /api/templates/:id
 * Einzelnes Template abrufen
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await templateService.getTemplateById(id);

    res.json({
      success: true,
      template,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Template nicht gefunden',
    });
  }
});

/**
 * POST /api/templates
 * Neues Template erstellen (Admin-Funktion)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, category, content, type } = req.body;

    // Validation
    if (!title || !category || !content || !type) {
      return res.status(400).json({
        success: false,
        error: 'Alle Felder sind erforderlich',
      });
    }

    const template = await templateService.createTemplate({
      title,
      category,
      content,
      type,
    });

    res.status(201).json({
      success: true,
      message: 'Template erfolgreich erstellt',
      template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Fehler beim Erstellen des Templates',
    });
  }
});

/**
 * PUT /api/templates/:id
 * Template aktualisieren (Admin-Funktion)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, category, content, type } = req.body;

    const template = await templateService.updateTemplate(id, {
      title,
      category,
      content,
      type,
    });

    res.json({
      success: true,
      message: 'Template erfolgreich aktualisiert',
      template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Fehler beim Aktualisieren des Templates',
    });
  }
});

/**
 * DELETE /api/templates/:id
 * Template löschen (Admin-Funktion)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await templateService.deleteTemplate(id);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Fehler beim Löschen des Templates',
    });
  }
});

/**
 * POST /api/templates/seed
 * NIST-konforme Templates seeden
 */
router.post('/seed', async (req: Request, res: Response) => {
  try {
    const result = await templateService.seedTemplates();

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Fehler beim Seeden der Templates',
    });
  }
});

export default router;
