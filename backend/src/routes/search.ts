import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { devAuthenticate } from '../middleware/auth.dev.middleware.js';
import { calculateRelevanceScore, highlightSearchTerms, getBestMatchContext } from '../utils/searchUtils.js';

const router = Router();

// Apply authentication and tenant middleware
const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
router.use(isDevMode ? devAuthenticate : authenticate);
router.use(tenantMiddleware);

// GET /api/search - Global search across all entities
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q, type, limit = 20 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Query parameter "q" is required'
      });
    }

    const searchQuery = q.trim();
    if (searchQuery.length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Query cannot be empty'
      });
    }

    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    const tenantId = req.tenant?.id;
    const results: any = {
      documents: [],
      knowledge: [],
      total: 0,
    };

    // Search documents with ranking and highlighting
    if (!type || type === 'documents') {
      const whereDocument: any = {};
      if (tenantId) {
        whereDocument.tenantId = tenantId;
      }
      
      const documents = await prisma.document.findMany({
        where: {
          ...whereDocument,
          OR: [
            { title: { contains: searchQuery } },
            { content: { contains: searchQuery } },
            { category: { contains: searchQuery } },
          ],
        },
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          content: true,
          updatedAt: true,
          user: {
            select: {
              name: true,
            },
          },
        },
        take: (limit ? parseInt(limit as string) : 20) * 2, // Get more to filter by score
      });
      
      // Calculate relevance scores and add highlighting
      const documentsWithScore = documents.map(doc => {
        const titleScore = calculateRelevanceScore(doc.title, searchQuery, 'title');
        const contentScore = doc.content 
          ? calculateRelevanceScore(doc.content.replace(/<[^>]*>/g, ' '), searchQuery, 'content')
          : 0;
        const totalScore = titleScore + contentScore;
        
        return {
          ...doc,
          score: totalScore,
          highlightedTitle: highlightSearchTerms(doc.title, searchQuery),
          preview: getBestMatchContext(doc.content, searchQuery),
        };
      });
      
      // Sort by score descending and limit results
      const sortedDocuments = documentsWithScore
        .sort((a, b) => b.score - a.score)
        .slice(0, limit ? parseInt(limit as string) : 20);
      
      results.documents = sortedDocuments;
      results.total += sortedDocuments.length;
    }

    if (!type || type === 'knowledge') {
      const knowledgeNodes = await prisma.knowledgeNode.findMany({
        where: {
          document: tenantId ? { tenantId } : undefined,
          OR: [
            { content: { contains: searchQuery } },
            { type: { contains: searchQuery } },
            { tags: { contains: searchQuery } },
            { metadata: { contains: searchQuery } },
          ],
        },
        select: {
          id: true,
          type: true,
          content: true,
          updatedAt: true,
          documentId: true,
          document: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        take: (limit ? parseInt(limit as string) : 20) * 2,
      });

      const knowledgeWithScore = knowledgeNodes.map(node => {
        const label = node.document?.title ?? node.type ?? 'Knowledge Node';
        const titleScore = label ? calculateRelevanceScore(label, searchQuery, 'title') : 0;
        const contentScore = node.content
          ? calculateRelevanceScore(node.content, searchQuery, 'content')
          : 0;
        const totalScore = titleScore + contentScore;

        return {
          id: node.id,
          type: node.type,
          documentId: node.documentId,
          documentTitle: node.document?.title ?? null,
          updatedAt: node.updatedAt,
          score: totalScore,
          highlightedTitle: highlightSearchTerms(label, searchQuery),
          snippet: getBestMatchContext(node.content ?? '', searchQuery),
        };
      });

      const sortedKnowledge = knowledgeWithScore
        .sort((a, b) => b.score - a.score)
        .slice(0, limit ? parseInt(limit as string) : 20);

      results.knowledge = sortedKnowledge;
      results.total += sortedKnowledge.length;
    }

    res.json(results);
  } catch (error: any) {
    console.error('[Search] Error:', error);
    res.status(500).json({
      error: 'Failed to perform search',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

export default router;

