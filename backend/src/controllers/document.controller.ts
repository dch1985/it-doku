import { Request, Response } from 'express';
import { DocumentService } from '../services/document.service';

const documentService = new DocumentService();

export class DocumentController {
  async create(req: Request, res: Response) {
  try {
    console.log('[Document Create] Request body:', req.body);
    const document = await documentService.createDocument(req.body);
    console.log('[Document Create] Success!', document);
    res.status(201).json({ success: true, data: document });
  } catch (error) {
    console.error('[Document Create] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create document',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

  async getAll(req: Request, res: Response) {
    try {
      const documents = await documentService.getAllDocuments();
      res.json({ success: true, data: documents });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch documents' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = req.params.id; // String UUID, kein parseInt()
      const document = await documentService.getDocumentById(id);
      if (!document) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }
      res.json({ success: true, data: document });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch document' });
    }
  }

  async getByCategory(req: Request, res: Response) {
    try {
      const category = req.params.category.toUpperCase();
      const documents = await documentService.getDocumentsByCategory(category);
      res.json({ success: true, data: documents });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch documents' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = req.params.id; // String UUID, kein parseInt()
      const document = await documentService.updateDocument(id, req.body);
      res.json({ success: true, data: document });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update document' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = req.params.id; // String UUID, kein parseInt()
      await documentService.deleteDocument(id);
      res.json({ success: true, message: 'Document deleted' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete document' });
    }
  }
}