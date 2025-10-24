import { Router, Request, Response } from 'express'
import { GitHubService } from '../services/githubService.js'
import { prisma } from '../lib/prisma.js'

const router = Router()

// Get user repositories
router.get('/repos/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params
    const token = req.headers['x-github-token'] as string
    
    const github = new GitHubService(token)
    const repos = await github.listRepositories(username)
    
    res.json(repos)
  } catch (error: any) {
    console.error('[GitHub] Error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get repository README
router.get('/repos/:owner/:repo/readme', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params
    const token = req.headers['x-github-token'] as string
    
    const github = new GitHubService(token)
    const readme = await github.getRepositoryReadme(owner, repo)
    
    if (!readme) {
      return res.status(404).json({ error: 'README not found' })
    }
    
    res.json(readme)
  } catch (error: any) {
    console.error('[GitHub] Error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get repository structure
router.get('/repos/:owner/:repo/structure', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params
    const { path } = req.query
    const token = req.headers['x-github-token'] as string
    
    const github = new GitHubService(token)
    const structure = await github.getRepositoryStructure(owner, repo, path as string || '')
    
    res.json(structure)
  } catch (error: any) {
    console.error('[GitHub] Error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get file content
router.get('/repos/:owner/:repo/file', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params
    const { path } = req.query
    const token = req.headers['x-github-token'] as string
    
    if (!path) {
      return res.status(400).json({ error: 'Path parameter required' })
    }
    
    const github = new GitHubService(token)
    const file = await github.getFileContent(owner, repo, path as string)
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' })
    }
    
    res.json(file)
  } catch (error: any) {
    console.error('[GitHub] Error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Import repository as document
router.post('/repos/:owner/:repo/import', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params
    const token = req.headers['x-github-token'] as string
    
    const github = new GitHubService(token)
    const readme = await github.getRepositoryReadme(owner, repo)
    
    if (!readme) {
      return res.status(404).json({ error: 'README not found' })
    }
    
    const document = await prisma.document.create({
      data: {
        title: `${owner}/${repo} - README`,
        content: readme.content,
        category: 'Development',
        status: 'Published',
        size: `${Math.round(readme.content.length / 1024)} KB`
      }
    })
    
    res.status(201).json(document)
  } catch (error: any) {
    console.error('[GitHub] Error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Search code
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query
    const token = req.headers['x-github-token'] as string
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter required' })
    }
    
    const github = new GitHubService(token)
    const results = await github.searchCode(q as string)
    
    res.json(results)
  } catch (error: any) {
    console.error('[GitHub] Error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router