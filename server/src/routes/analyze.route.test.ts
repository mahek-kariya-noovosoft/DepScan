import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'

// Mock all external API services
vi.mock('../services/npm.service.js', () => ({
  fetchNpmData: vi.fn().mockResolvedValue({
    lastPublishDate: '2024-01-15T00:00:00.000Z',
    weeklyDownloads: 500_000,
    license: 'MIT',
    latestVersion: '4.18.2',
    description: 'Fast web framework',
    repositoryUrl: 'https://github.com/expressjs/express',
  }),
}))

vi.mock('../services/github.service.js', () => ({
  fetchGithubData: vi.fn().mockResolvedValue({
    contributorCount: 100,
    openIssueCount: 50,
    closedIssueCount: 500,
    stars: 60000,
    lastCommitDate: '2024-01-10T00:00:00.000Z',
    repoUrl: 'https://github.com/expressjs/express',
  }),
}))

vi.mock('../services/osv.service.js', () => ({
  fetchOsvData: vi.fn().mockResolvedValue({
    vulnerabilities: [],
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/analyze', () => {
  it('should return 200 with AnalysisResult shape for valid package.json', async () => {
    const packageJson = JSON.stringify({
      dependencies: {
        express: '^4.18.2',
        lodash: '^4.17.21',
      },
    })

    const response = await request(app)
      .post('/api/analyze')
      .send({ content: packageJson })
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data).toBeDefined()

    const data = response.body.data
    expect(data).toHaveProperty('overallScore')
    expect(data).toHaveProperty('grade')
    expect(data).toHaveProperty('totalDependencies', 2)
    expect(data).toHaveProperty('analyzedCount', 2)
    expect(data).toHaveProperty('wasTruncated', false)
    expect(data).toHaveProperty('riskCounts')
    expect(data.riskCounts).toHaveProperty('critical')
    expect(data.riskCounts).toHaveProperty('high')
    expect(data.riskCounts).toHaveProperty('medium')
    expect(data.riskCounts).toHaveProperty('low')
    expect(data).toHaveProperty('dependencies')
    expect(data.dependencies).toHaveLength(2)
    expect(data).toHaveProperty('aiRecommendation')
    expect(typeof data.overallScore).toBe('number')
    expect(typeof data.grade).toBe('string')
  })

  it('should return 400 with error for invalid JSON content', async () => {
    const response = await request(app)
      .post('/api/analyze')
      .send({ content: 'not valid json {' })
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toMatch(/Invalid JSON/)
  })

  it('should return 400 with validation error for empty body', async () => {
    const response = await request(app)
      .post('/api/analyze')
      .send({})
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toBeDefined()
  })

  it('should return 400 when no dependencies are found', async () => {
    const packageJson = JSON.stringify({
      name: 'empty-project',
      version: '1.0.0',
    })

    const response = await request(app)
      .post('/api/analyze')
      .send({ content: packageJson })
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toMatch(/No dependencies found/)
  })

  it('should include both riskScore and metadata for each dependency', async () => {
    const packageJson = JSON.stringify({
      dependencies: {
        express: '^4.18.2',
      },
    })

    const response = await request(app)
      .post('/api/analyze')
      .send({ content: packageJson })
      .expect(200)

    const dep = response.body.data.dependencies[0]
    expect(dep).toHaveProperty('name', 'express')
    expect(dep).toHaveProperty('version', '^4.18.2')
    expect(dep).toHaveProperty('type', 'dependency')
    expect(dep).toHaveProperty('riskScore')
    expect(typeof dep.riskScore).toBe('number')
    expect(dep).toHaveProperty('riskLevel')
    expect(dep).toHaveProperty('signals')
    expect(dep.signals).toHaveLength(7)
    expect(dep).toHaveProperty('metadata')
    expect(dep.metadata).toHaveProperty('npmData')
    expect(dep.metadata).toHaveProperty('githubData')
    expect(dep.metadata).toHaveProperty('osvData')
    expect(dep).toHaveProperty('hasPartialData', false)
  })

  it('should set wasTruncated to true for package.json with 50+ dependencies', async () => {
    const dependencies: Record<string, string> = {}
    for (let idx = 0; idx < 55; idx++) {
      dependencies[`pkg-${idx}`] = `^1.0.${idx}`
    }

    const packageJson = JSON.stringify({ dependencies })

    const response = await request(app)
      .post('/api/analyze')
      .send({ content: packageJson })
      .expect(200)

    const data = response.body.data
    expect(data.wasTruncated).toBe(true)
    expect(data.analyzedCount).toBe(50)
    expect(data.totalDependencies).toBe(55)
    expect(data.dependencies).toHaveLength(50)
  })
})
