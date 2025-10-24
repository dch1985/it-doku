import { Octokit } from '@octokit/rest'

export class GitHubService {
  private octokit: Octokit

  constructor(token?: string) {
    // Octokit funktioniert auch ohne Token für public repos
    this.octokit = new Octokit(token ? { auth: token } : {})
  }

  async listRepositories(username: string) {
    const { data } = await this.octokit.repos.listForUser({
      username,
      sort: 'updated',
      per_page: 20
    })

    return data.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      updatedAt: repo.updated_at
    }))
  }

  async getRepositoryReadme(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.repos.getReadme({
        owner,
        repo
      })

      const content = Buffer.from(data.content, 'base64').toString('utf-8')
      
      return {
        content,
        name: data.name,
        path: data.path,
        sha: data.sha,
        url: data.html_url
      }
    } catch (error) {
      return null
    }
  }

  async getRepositoryStructure(owner: string, repo: string, path: string = '') {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path
    })

    if (Array.isArray(data)) {
      return data.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size,
        url: item.html_url
      }))
    }

    return []
  }

  async getFileContent(owner: string, repo: string, path: string) {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path
    })

    if ('content' in data) {
      return {
        content: Buffer.from(data.content, 'base64').toString('utf-8'),
        name: data.name,
        path: data.path,
        sha: data.sha
      }
    }

    return null
  }

  async searchCode(query: string) {
    const { data } = await this.octokit.search.code({
      q: query,
      per_page: 10
    })

    return data.items.map(item => ({
      name: item.name,
      path: item.path,
      repository: item.repository.full_name,
      url: item.html_url,
      score: item.score
    }))
  }
}