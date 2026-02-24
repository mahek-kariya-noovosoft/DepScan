// ── Risk classification ──────────────────────────────────────────────

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

export type DependencyType = 'dependency' | 'devDependency'

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'

// ── Parser output ────────────────────────────────────────────────────

export interface ParsedDependency {
  name: string
  version: string // raw version string from package.json (e.g. "^4.18.2")
  type: DependencyType
}

// ── External API data (processed for display) ────────────────────────

export interface NpmData {
  lastPublishDate: string // ISO date
  weeklyDownloads: number
  license: string | null
  latestVersion: string
  description: string
}

export interface GithubData {
  contributorCount: number
  openIssueCount: number
  closedIssueCount: number
  stars: number
  lastCommitDate: string // ISO date
  repoUrl: string
}

export interface OsvVulnerability {
  id: string // e.g. "GHSA-xxx" or "CVE-2024-xxx"
  summary: string
  severity: string
}

export interface OsvData {
  vulnerabilities: OsvVulnerability[]
}

export interface DependencyMetadata {
  npmData?: NpmData
  githubData?: GithubData
  osvData?: OsvData
}

// ── Scoring ──────────────────────────────────────────────────────────

export interface SignalScore {
  signal: string // e.g. "staleness", "vulnerabilities"
  score: number // 0–100
  weight: number // 0–1, e.g. 0.25
  weightedScore: number // score × weight
  detail: string // human-readable: "Last published 2.3 years ago"
  available: boolean // false if the API call for this signal failed
}

// ── Per-dependency result ────────────────────────────────────────────

export interface DependencyResult {
  name: string
  version: string
  type: DependencyType
  riskScore: number // 0–100 weighted total
  riskLevel: RiskLevel
  signals: SignalScore[]
  metadata: DependencyMetadata
  hasPartialData: boolean // true if any API call failed
}

// ── Overall analysis result ──────────────────────────────────────────

export interface AnalysisResult {
  overallScore: number // average risk score across all deps
  grade: Grade
  totalDependencies: number // total in the package.json (before cap)
  analyzedCount: number // may be ≤ 50
  wasTruncated: boolean // true if > 50 deps existed
  riskCounts: {
    critical: number
    high: number
    medium: number
    low: number
  }
  dependencies: DependencyResult[]
  aiRecommendation: string // placeholder for now
}

// ── API contract ─────────────────────────────────────────────────────

export interface AnalyzeRequest {
  content: string // raw package.json text
}

export interface AnalyzeResponse {
  success: boolean
  data?: AnalysisResult
  error?: string
}
