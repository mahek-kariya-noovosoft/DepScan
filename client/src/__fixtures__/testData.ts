import type { AnalysisResult, DependencyResult, SignalScore } from '@shared/types'

// ── Helper to build a full set of 7 signals (uses updated weights) ──

function makeSignals(overrides: Partial<Record<string, Partial<SignalScore>>>): SignalScore[] {
  const defaults: SignalScore[] = [
    { signal: 'staleness', score: 0, weight: 0.25, weightedScore: 0, detail: 'Last published 0.1 years ago', available: true },
    { signal: 'vulnerabilities', score: 0, weight: 0.25, weightedScore: 0, detail: 'No known vulnerabilities', available: true },
    { signal: 'busFactor', score: 0, weight: 0.15, weightedScore: 0, detail: '250 contributor(s)', available: true },
    { signal: 'openIssues', score: 10, weight: 0.10, weightedScore: 1, detail: '50 open / 900 closed (5% open)', available: true },
    { signal: 'downloadTrend', score: 5, weight: 0.05, weightedScore: 0.25, detail: '10,000,000 weekly downloads', available: true },
    { signal: 'license', score: 0, weight: 0.10, weightedScore: 0, detail: 'Permissive license: MIT', available: true },
    { signal: 'versionPinning', score: 20, weight: 0.10, weightedScore: 2, detail: 'Caret range: ^1.0.0', available: true },
  ]

  return defaults.map((sig) => {
    const override = overrides[sig.signal]
    if (!override) return sig
    const merged = { ...sig, ...override }
    merged.weightedScore = merged.score * merged.weight
    return merged
  })
}

// ── FIXTURE 1: healthyProject (Grade A, score ~15) ──────────────────

const healthyDeps: DependencyResult[] = [
  {
    name: 'react',
    version: '^18.2.0',
    type: 'dependency',
    riskScore: 15,
    riskLevel: 'low',
    signals: makeSignals({
      staleness: { score: 5, detail: 'Last published 0.3 years ago' },
      openIssues: { score: 12, detail: '120 open / 2300 closed (5% open)' },
      downloadTrend: { score: 5, detail: '25,400,000 weekly downloads' },
      versionPinning: { score: 20, detail: 'Caret range: ^18.2.0' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2025-10-15T10:00:00Z', weeklyDownloads: 25400000, license: 'MIT', latestVersion: '18.3.1', description: 'A JavaScript library for building user interfaces' },
      githubData: { contributorCount: 1800, openIssueCount: 120, closedIssueCount: 2300, stars: 225000, lastCommitDate: '2026-02-20T09:00:00Z', repoUrl: 'https://github.com/facebook/react' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: false,
  },
  {
    name: 'react-dom',
    version: '^18.2.0',
    type: 'dependency',
    riskScore: 14,
    riskLevel: 'low',
    signals: makeSignals({
      staleness: { score: 5, detail: 'Last published 0.3 years ago' },
      openIssues: { score: 10, detail: '60 open / 1200 closed (5% open)' },
      downloadTrend: { score: 5, detail: '24,000,000 weekly downloads' },
      versionPinning: { score: 20, detail: 'Caret range: ^18.2.0' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2025-10-15T10:00:00Z', weeklyDownloads: 24000000, license: 'MIT', latestVersion: '18.3.1', description: 'React package for working with the DOM' },
      githubData: { contributorCount: 1800, openIssueCount: 60, closedIssueCount: 1200, stars: 225000, lastCommitDate: '2026-02-20T09:00:00Z', repoUrl: 'https://github.com/facebook/react' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: false,
  },
  {
    name: 'typescript',
    version: '^5.3.3',
    type: 'devDependency',
    riskScore: 11,
    riskLevel: 'low',
    signals: makeSignals({
      staleness: { score: 3, detail: 'Last published 0.2 years ago' },
      busFactor: { score: 0, detail: '700 contributor(s)' },
      openIssues: { score: 8, detail: '200 open / 5000 closed (4% open)' },
      downloadTrend: { score: 5, detail: '48,000,000 weekly downloads' },
      versionPinning: { score: 20, detail: 'Caret range: ^5.3.3' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2025-12-01T10:00:00Z', weeklyDownloads: 48000000, license: 'Apache-2.0', latestVersion: '5.4.2', description: 'TypeScript is a language for application scale JavaScript development' },
      githubData: { contributorCount: 700, openIssueCount: 200, closedIssueCount: 5000, stars: 100000, lastCommitDate: '2026-02-22T14:00:00Z', repoUrl: 'https://github.com/microsoft/TypeScript' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: false,
  },
  {
    name: 'zod',
    version: '^3.22.4',
    type: 'dependency',
    riskScore: 13,
    riskLevel: 'low',
    signals: makeSignals({
      staleness: { score: 8, detail: 'Last published 0.4 years ago' },
      busFactor: { score: 0, detail: '120 contributor(s)' },
      openIssues: { score: 15, detail: '80 open / 500 closed (14% open)' },
      downloadTrend: { score: 5, detail: '12,000,000 weekly downloads' },
      versionPinning: { score: 20, detail: 'Caret range: ^3.22.4' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2025-09-10T08:00:00Z', weeklyDownloads: 12000000, license: 'MIT', latestVersion: '3.23.8', description: 'TypeScript-first schema declaration and validation library' },
      githubData: { contributorCount: 120, openIssueCount: 80, closedIssueCount: 500, stars: 33000, lastCommitDate: '2026-01-15T12:00:00Z', repoUrl: 'https://github.com/colinhacks/zod' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: false,
  },
  {
    name: 'express',
    version: '^4.18.2',
    type: 'dependency',
    riskScore: 18,
    riskLevel: 'low',
    signals: makeSignals({
      staleness: { score: 5, detail: 'Last published 0.2 years ago' },
      openIssues: { score: 21, detail: '189 open / 3927 closed (5% open)' },
      downloadTrend: { score: 5, detail: '71,000,000 weekly downloads' },
      versionPinning: { score: 20, detail: 'Caret range: ^4.18.2' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2025-12-01T10:00:00Z', weeklyDownloads: 71000000, license: 'MIT', latestVersion: '5.2.1', description: 'Fast, unopinionated, minimalist web framework' },
      githubData: { contributorCount: 377, openIssueCount: 189, closedIssueCount: 3927, stars: 68000, lastCommitDate: '2026-02-23T10:00:00Z', repoUrl: 'https://github.com/expressjs/express' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: false,
  },
  {
    name: 'vitest',
    version: '^1.2.0',
    type: 'devDependency',
    riskScore: 12,
    riskLevel: 'low',
    signals: makeSignals({
      staleness: { score: 2, detail: 'Last published 0.1 years ago' },
      busFactor: { score: 0, detail: '480 contributor(s)' },
      openIssues: { score: 12, detail: '150 open / 4000 closed (4% open)' },
      downloadTrend: { score: 5, detail: '14,000,000 weekly downloads' },
      versionPinning: { score: 20, detail: 'Caret range: ^1.2.0' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2026-02-05T10:00:00Z', weeklyDownloads: 14000000, license: 'MIT', latestVersion: '3.2.4', description: 'A blazing fast unit test framework' },
      githubData: { contributorCount: 480, openIssueCount: 150, closedIssueCount: 4000, stars: 13500, lastCommitDate: '2026-02-24T10:00:00Z', repoUrl: 'https://github.com/vitest-dev/vitest' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: false,
  },
  {
    name: '@types/react',
    version: '^18.2.48',
    type: 'devDependency',
    riskScore: 10,
    riskLevel: 'low',
    signals: makeSignals({
      staleness: { score: 2, detail: 'Last published 0.1 years ago' },
      busFactor: { score: 0, detail: '600 contributor(s)' },
      openIssues: { score: 8, detail: '100 open / 3000 closed (3% open)' },
      downloadTrend: { score: 5, detail: '30,000,000 weekly downloads' },
      versionPinning: { score: 20, detail: 'Caret range: ^18.2.48' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2026-02-10T10:00:00Z', weeklyDownloads: 30000000, license: 'MIT', latestVersion: '18.3.5', description: 'TypeScript definitions for react' },
      githubData: { contributorCount: 600, openIssueCount: 100, closedIssueCount: 3000, stars: 49000, lastCommitDate: '2026-02-24T10:00:00Z', repoUrl: 'https://github.com/DefinitelyTyped/DefinitelyTyped' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: false,
  },
]

export const healthyProject: AnalysisResult = {
  overallScore: 12.04,
  grade: 'A',
  totalDependencies: 7,
  analyzedCount: 7,
  wasTruncated: false,
  riskCounts: { critical: 0, high: 0, medium: 0, low: 7 },
  dependencies: healthyDeps,
  aiRecommendation: '',
}

// ── FIXTURE 2: nightmareProject (Grade F, score ~80) ────────────────

const nightmareDeps: DependencyResult[] = [
  {
    name: 'event-stream',
    version: '3.3.6',
    type: 'dependency',
    riskScore: 95,
    riskLevel: 'critical',
    signals: makeSignals({
      staleness: { score: 100, detail: 'Last published 7.5 years ago' },
      vulnerabilities: { score: 90, detail: '1 vulnerability found (worst: CRITICAL)' },
      busFactor: { score: 5, detail: '35 contributor(s)' },
      openIssues: { score: 6, detail: '7 open / 60 closed (10% open)' },
      downloadTrend: { score: 5, detail: '5,439,601 weekly downloads' },
      license: { score: 0, detail: 'Permissive license: MIT' },
      versionPinning: { score: 0, detail: 'Exact version: 3.3.6' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2018-09-29T06:55:49Z', weeklyDownloads: 5439601, license: 'MIT', latestVersion: '4.0.1', description: 'construct pipes of streams of events' },
      githubData: { contributorCount: 35, openIssueCount: 7, closedIssueCount: 60, stars: 2181, lastCommitDate: '2018-11-27T10:44:39Z', repoUrl: 'https://github.com/dominictarr/event-stream' },
      osvData: { vulnerabilities: [{ id: 'GHSA-mh6f-8j2x-4483', summary: 'Critical supply chain attack via flatmap-stream', severity: 'CRITICAL' }] },
    },
    hasPartialData: false,
  },
  {
    name: 'request',
    version: '*',
    type: 'dependency',
    riskScore: 90,
    riskLevel: 'critical',
    signals: makeSignals({
      staleness: { score: 100, detail: 'Last published 6.1 years ago' },
      vulnerabilities: { score: 0, detail: 'No known vulnerabilities' },
      busFactor: { score: 0, detail: '343 contributor(s)' },
      openIssues: { score: 17, detail: '141 open / 2173 closed (6% open)' },
      downloadTrend: { score: 5, detail: '14,340,752 weekly downloads' },
      license: { score: 0, detail: 'Permissive license: Apache-2.0' },
      versionPinning: { score: 90, detail: 'Wide range: *' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2020-02-11T16:35:36Z', weeklyDownloads: 14340752, license: 'Apache-2.0', latestVersion: '2.88.2', description: 'Simplified HTTP request client (DEPRECATED)' },
      githubData: { contributorCount: 343, openIssueCount: 141, closedIssueCount: 2173, stars: 25605, lastCommitDate: '2024-08-14T00:09:41Z', repoUrl: 'https://github.com/request/request' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: false,
  },
  {
    name: 'moment',
    version: '>=2.0.0',
    type: 'dependency',
    riskScore: 82,
    riskLevel: 'critical',
    signals: makeSignals({
      staleness: { score: 77, detail: 'Last published 2.2 years ago' },
      vulnerabilities: { score: 100, detail: '3 vulnerabilities found' },
      busFactor: { score: 0, detail: '690 contributor(s)' },
      openIssues: { score: 32, detail: '290 open / 3913 closed (7% open)' },
      downloadTrend: { score: 5, detail: '28,544,912 weekly downloads' },
      license: { score: 0, detail: 'Permissive license: MIT' },
      versionPinning: { score: 90, detail: 'Wide range: >=2.0.0' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2023-12-27T10:38:43Z', weeklyDownloads: 28544912, license: 'MIT', latestVersion: '2.30.1', description: 'Parse, validate, manipulate, and display dates' },
      githubData: { contributorCount: 690, openIssueCount: 290, closedIssueCount: 3913, stars: 48061, lastCommitDate: '2024-08-14T17:12:19Z', repoUrl: 'https://github.com/moment/moment' },
      osvData: {
        vulnerabilities: [
          { id: 'GHSA-446m-mv8f-q348', summary: 'Regular Expression Denial of Service', severity: 'HIGH' },
          { id: 'GHSA-87vv-r9j6-g5qv', summary: 'Regular Expression Denial of Service', severity: 'MODERATE' },
          { id: 'GHSA-8hfj-j24r-96c4', summary: 'Path Traversal in moment.locale', severity: 'HIGH' },
        ],
      },
    },
    hasPartialData: false,
  },
  {
    name: 'left-pad',
    version: '~1.1.3',
    type: 'dependency',
    riskScore: 75,
    riskLevel: 'high',
    signals: makeSignals({
      staleness: { score: 100, detail: 'Last published 8.0 years ago' },
      vulnerabilities: { score: 0, detail: 'No known vulnerabilities' },
      busFactor: { score: 5, detail: '22 contributor(s)' },
      openIssues: { score: 51, detail: '10 open / 0 closed (100% open)' },
      downloadTrend: { score: 5, detail: '1,293,756 weekly downloads' },
      license: { score: 40, detail: 'Non-standard license: WTFPL' },
      versionPinning: { score: 10, detail: 'Tilde range: ~1.1.3' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2018-04-09T01:10:45Z', weeklyDownloads: 1293756, license: 'WTFPL', latestVersion: '1.3.0', description: 'String left pad' },
      githubData: { contributorCount: 22, openIssueCount: 10, closedIssueCount: 0, stars: 1301, lastCommitDate: '2019-04-19T14:16:20Z', repoUrl: 'https://github.com/left-pad/left-pad' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: false,
  },
  {
    name: 'nomnom',
    version: '^1.8.1',
    type: 'dependency',
    riskScore: 72,
    riskLevel: 'high',
    signals: makeSignals({
      staleness: { score: 100, detail: 'Last published 11.5 years ago' },
      vulnerabilities: { score: 0, detail: 'No known vulnerabilities' },
      busFactor: { score: 15, detail: '13 contributor(s)' },
      openIssues: { score: 49, detail: '52 open / 8 closed (87% open)' },
      downloadTrend: { score: 5, detail: '535,361 weekly downloads' },
      license: { score: 80, detail: 'No license specified' },
      versionPinning: { score: 20, detail: 'Caret range: ^1.8.1' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2014-11-07T18:17:52Z', weeklyDownloads: 535361, license: null, latestVersion: '1.8.1', description: 'Option parser with generated usage and commands' },
      githubData: { contributorCount: 13, openIssueCount: 52, closedIssueCount: 8, stars: 469, lastCommitDate: '2021-09-01T13:37:36Z', repoUrl: 'https://github.com/harthur/nomnom' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: true,
  },
  {
    name: 'node-uuid',
    version: '^1.4.8',
    type: 'dependency',
    riskScore: 70,
    riskLevel: 'high',
    signals: makeSignals({
      staleness: { score: 100, detail: 'Last published 9.1 years ago' },
      vulnerabilities: { score: 0, detail: 'No known vulnerabilities' },
      busFactor: { score: 5, detail: '33 contributor(s)' },
      openIssues: { score: 0, detail: 'No issues found' },
      downloadTrend: { score: 5, detail: '931,338 weekly downloads' },
      license: { score: 80, detail: 'No license specified' },
      versionPinning: { score: 20, detail: 'Caret range: ^1.4.8' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2017-03-22T00:30:38Z', weeklyDownloads: 931338, license: null, latestVersion: '1.4.8', description: 'Rigorous implementation of RFC4122 (v1 and v4) UUIDs.' },
      githubData: { contributorCount: 33, openIssueCount: 0, closedIssueCount: 0, stars: 268, lastCommitDate: '2020-01-16T17:28:04Z', repoUrl: 'https://github.com/broofa/node-uuid' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: true,
  },
  {
    name: 'core-js',
    version: '2.6.12',
    type: 'dependency',
    riskScore: 10,
    riskLevel: 'low',
    signals: makeSignals({
      staleness: { score: 2, detail: 'Last published 0.1 years ago' },
      busFactor: { score: 0, detail: '142 contributor(s)' },
      openIssues: { score: 6, detail: '38 open / 950 closed (4% open)' },
      downloadTrend: { score: 5, detail: '53,075,888 weekly downloads' },
      versionPinning: { score: 0, detail: 'Exact version: 2.6.12' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2026-01-21T18:03:56Z', weeklyDownloads: 53075888, license: 'MIT', latestVersion: '3.48.0', description: 'Standard library' },
      githubData: { contributorCount: 142, openIssueCount: 38, closedIssueCount: 950, stars: 25444, lastCommitDate: '2026-02-24T17:36:11Z', repoUrl: 'https://github.com/zloirock/core-js' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: false,
  },
]

export const nightmareProject: AnalysisResult = {
  overallScore: 83.79,
  grade: 'F',
  totalDependencies: 7,
  analyzedCount: 7,
  wasTruncated: false,
  riskCounts: { critical: 3, high: 3, medium: 0, low: 1 },
  dependencies: nightmareDeps,
  aiRecommendation: '',
}

// ── FIXTURE 3: mixedProject (Grade C, score ~42, truncated) ─────────

const mixedDeps: DependencyResult[] = [
  {
    name: 'event-stream',
    version: '^4.0.1',
    type: 'dependency',
    riskScore: 85,
    riskLevel: 'critical',
    signals: makeSignals({
      staleness: { score: 90, detail: 'Last published 3.5 years ago' },
      vulnerabilities: { score: 100, detail: '1 vulnerability found (worst: CRITICAL)' },
      busFactor: { score: 50, detail: '5 contributor(s)' },
      openIssues: { score: 60, detail: '40 open / 15 closed (73% open)' },
      downloadTrend: { score: 50, detail: '1,200 weekly downloads' },
      license: { score: 0, detail: 'Permissive license: MIT' },
      versionPinning: { score: 20, detail: 'Caret range: ^4.0.1' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2022-06-10T10:00:00Z', weeklyDownloads: 1200, license: 'MIT', latestVersion: '4.0.1', description: 'Construct pipes of streams' },
      githubData: { contributorCount: 5, openIssueCount: 40, closedIssueCount: 15, stars: 1900, lastCommitDate: '2022-06-10T10:00:00Z', repoUrl: 'https://github.com/dominictarr/event-stream' },
      osvData: { vulnerabilities: [{ id: 'GHSA-4w2v-q235-vp99', summary: 'Malicious dependency flatmap-stream in event-stream', severity: 'CRITICAL' }] },
    },
    hasPartialData: false,
  },
  {
    name: 'axios',
    version: '^1.6.5',
    type: 'dependency',
    riskScore: 45,
    riskLevel: 'medium',
    signals: makeSignals({
      staleness: { score: 15, detail: 'Last published 0.5 years ago' },
      vulnerabilities: { score: 70, detail: '2 vulnerabilities found (worst: HIGH)' },
      busFactor: { score: 0, detail: '430 contributor(s)' },
      openIssues: { score: 35, detail: '300 open / 4500 closed (6% open)' },
      downloadTrend: { score: 5, detail: '52,000,000 weekly downloads' },
      license: { score: 0, detail: 'Permissive license: MIT' },
      versionPinning: { score: 20, detail: 'Caret range: ^1.6.5' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2025-08-20T10:00:00Z', weeklyDownloads: 52000000, license: 'MIT', latestVersion: '1.7.2', description: 'Promise based HTTP client' },
      githubData: { contributorCount: 430, openIssueCount: 300, closedIssueCount: 4500, stars: 105000, lastCommitDate: '2026-01-05T10:00:00Z', repoUrl: 'https://github.com/axios/axios' },
      osvData: {
        vulnerabilities: [
          { id: 'CVE-2024-39338', summary: 'SSRF via absolute URL in axios', severity: 'HIGH' },
          { id: 'CVE-2023-45857', summary: 'CSRF token leakage', severity: 'MODERATE' },
        ],
      },
    },
    hasPartialData: false,
  },
  {
    name: 'moment',
    version: '>=2.0.0',
    type: 'dependency',
    riskScore: 65,
    riskLevel: 'high',
    signals: makeSignals({
      staleness: { score: 77, detail: 'Last published 2.2 years ago' },
      vulnerabilities: { score: 100, detail: '3 vulnerabilities found' },
      busFactor: { score: 0, detail: '690 contributor(s)' },
      openIssues: { score: 32, detail: '290 open / 3900 closed (7% open)' },
      downloadTrend: { score: 5, detail: '28,500,000 weekly downloads' },
      license: { score: 0, detail: 'Permissive license: MIT' },
      versionPinning: { score: 90, detail: 'Wide range: >=2.0.0' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2023-12-27T10:00:00Z', weeklyDownloads: 28500000, license: 'MIT', latestVersion: '2.30.1', description: 'Parse, validate, manipulate, and display dates' },
      githubData: { contributorCount: 690, openIssueCount: 290, closedIssueCount: 3900, stars: 48000, lastCommitDate: '2024-08-14T10:00:00Z', repoUrl: 'https://github.com/moment/moment' },
      osvData: {
        vulnerabilities: [
          { id: 'GHSA-446m-mv8f-q348', summary: 'ReDoS in moment', severity: 'HIGH' },
          { id: 'GHSA-87vv-r9j6-g5qv', summary: 'ReDoS in moment', severity: 'MODERATE' },
          { id: 'GHSA-8hfj-j24r-96c4', summary: 'Path Traversal in moment.locale', severity: 'HIGH' },
        ],
      },
    },
    hasPartialData: true,
  },
  {
    name: 'lodash',
    version: '^4.17.21',
    type: 'dependency',
    riskScore: 32,
    riskLevel: 'medium',
    signals: makeSignals({
      staleness: { score: 10, detail: 'Last published 0.4 years ago' },
      vulnerabilities: { score: 40, detail: '1 vulnerability found (worst: MODERATE)' },
      busFactor: { score: 0, detail: '300 contributor(s)' },
      openIssues: { score: 15, detail: '113 open / 4275 closed (3% open)' },
      downloadTrend: { score: 5, detail: '112,000,000 weekly downloads' },
      license: { score: 0, detail: 'Permissive license: MIT' },
      versionPinning: { score: 20, detail: 'Caret range: ^4.17.21' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2025-09-15T10:00:00Z', weeklyDownloads: 112000000, license: 'MIT', latestVersion: '4.17.21', description: 'Lodash modular utilities' },
      githubData: { contributorCount: 300, openIssueCount: 113, closedIssueCount: 4275, stars: 60000, lastCommitDate: '2026-02-23T06:00:00Z', repoUrl: 'https://github.com/lodash/lodash' },
      osvData: { vulnerabilities: [{ id: 'GHSA-xxjr-mmjv-4gpg', summary: 'Prototype Pollution in _.unset', severity: 'MODERATE' }] },
    },
    hasPartialData: false,
  },
  {
    name: 'next',
    version: '^14.1.0',
    type: 'dependency',
    riskScore: 22,
    riskLevel: 'low',
    signals: makeSignals({
      staleness: { score: 2, detail: 'Last published 0.1 years ago' },
      busFactor: { score: 0, detail: '3200 contributor(s)' },
      openIssues: { score: 20, detail: '2800 open / 25000 closed (10% open)' },
      downloadTrend: { score: 5, detail: '6,500,000 weekly downloads' },
      versionPinning: { score: 20, detail: 'Caret range: ^14.1.0' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2026-02-10T10:00:00Z', weeklyDownloads: 6500000, license: 'MIT', latestVersion: '14.2.20', description: 'The React Framework' },
      githubData: { contributorCount: 3200, openIssueCount: 2800, closedIssueCount: 25000, stars: 126000, lastCommitDate: '2026-02-24T20:00:00Z', repoUrl: 'https://github.com/vercel/next.js' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: false,
  },
  {
    name: 'react',
    version: '^18.2.0',
    type: 'dependency',
    riskScore: 15,
    riskLevel: 'low',
    signals: makeSignals({
      staleness: { score: 5, detail: 'Last published 0.3 years ago' },
      openIssues: { score: 12, detail: '120 open / 2300 closed (5% open)' },
      downloadTrend: { score: 5, detail: '25,400,000 weekly downloads' },
      versionPinning: { score: 20, detail: 'Caret range: ^18.2.0' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2025-10-15T10:00:00Z', weeklyDownloads: 25400000, license: 'MIT', latestVersion: '18.3.1', description: 'A JavaScript library for building user interfaces' },
      githubData: { contributorCount: 1800, openIssueCount: 120, closedIssueCount: 2300, stars: 225000, lastCommitDate: '2026-02-20T09:00:00Z', repoUrl: 'https://github.com/facebook/react' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: false,
  },
  {
    name: 'mongoose',
    version: '^7.6.8',
    type: 'dependency',
    riskScore: 20,
    riskLevel: 'low',
    signals: makeSignals({
      staleness: { score: 3, detail: 'Last published 0.2 years ago' },
      busFactor: { score: 0, detail: '380 contributor(s)' },
      openIssues: { score: 15, detail: '200 open / 12000 closed (2% open)' },
      downloadTrend: { score: 5, detail: '3,800,000 weekly downloads' },
      versionPinning: { score: 20, detail: 'Caret range: ^7.6.8' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2025-12-20T10:00:00Z', weeklyDownloads: 3800000, license: 'MIT', latestVersion: '8.1.0', description: 'Mongoose MongoDB ODM' },
      githubData: { contributorCount: 380, openIssueCount: 200, closedIssueCount: 12000, stars: 27000, lastCommitDate: '2026-02-20T10:00:00Z', repoUrl: 'https://github.com/Automattic/mongoose' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: false,
  },
  {
    name: 'jsonwebtoken',
    version: '^9.0.2',
    type: 'dependency',
    riskScore: 25,
    riskLevel: 'low',
    signals: makeSignals({
      staleness: { score: 15, detail: 'Last published 0.6 years ago' },
      busFactor: { score: 5, detail: '45 contributor(s)' },
      openIssues: { score: 20, detail: '80 open / 600 closed (12% open)' },
      downloadTrend: { score: 5, detail: '18,000,000 weekly downloads' },
      versionPinning: { score: 20, detail: 'Caret range: ^9.0.2' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2025-07-15T10:00:00Z', weeklyDownloads: 18000000, license: 'MIT', latestVersion: '9.0.2', description: 'JSON Web Token implementation' },
      githubData: { contributorCount: 45, openIssueCount: 80, closedIssueCount: 600, stars: 17500, lastCommitDate: '2025-07-15T10:00:00Z', repoUrl: 'https://github.com/auth0/node-jsonwebtoken' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: false,
  },
  {
    name: 'bcrypt',
    version: '^5.1.1',
    type: 'dependency',
    riskScore: 20,
    riskLevel: 'low',
    signals: makeSignals({
      staleness: { score: 8, detail: 'Last published 0.4 years ago' },
      busFactor: { score: 5, detail: '30 contributor(s)' },
      openIssues: { score: 15, detail: '30 open / 400 closed (7% open)' },
      downloadTrend: { score: 5, detail: '2,500,000 weekly downloads' },
      versionPinning: { score: 20, detail: 'Caret range: ^5.1.1' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2025-09-01T10:00:00Z', weeklyDownloads: 2500000, license: 'MIT', latestVersion: '5.1.1', description: 'A bcrypt library for NodeJS' },
      githubData: { contributorCount: 30, openIssueCount: 30, closedIssueCount: 400, stars: 7500, lastCommitDate: '2025-09-01T10:00:00Z', repoUrl: 'https://github.com/kelektiv/node.bcrypt.js' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: false,
  },
  {
    name: 'eslint',
    version: '^8.56.0',
    type: 'devDependency',
    riskScore: 18,
    riskLevel: 'low',
    signals: makeSignals({
      staleness: { score: 5, detail: 'Last published 0.3 years ago' },
      busFactor: { score: 0, detail: '350 contributor(s)' },
      openIssues: { score: 12, detail: '120 open / 5000 closed (2% open)' },
      downloadTrend: { score: 5, detail: '35,000,000 weekly downloads' },
      versionPinning: { score: 20, detail: 'Caret range: ^8.56.0' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2025-11-15T10:00:00Z', weeklyDownloads: 35000000, license: 'MIT', latestVersion: '8.57.0', description: 'An AST-based pattern checker for JavaScript' },
      githubData: { contributorCount: 350, openIssueCount: 120, closedIssueCount: 5000, stars: 25000, lastCommitDate: '2026-01-10T10:00:00Z', repoUrl: 'https://github.com/eslint/eslint' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: false,
  },
  {
    name: 'prettier',
    version: '^3.2.4',
    type: 'devDependency',
    riskScore: 15,
    riskLevel: 'low',
    signals: makeSignals({
      staleness: { score: 8, detail: 'Last published 0.4 years ago' },
      busFactor: { score: 0, detail: '600 contributor(s)' },
      openIssues: { score: 10, detail: '200 open / 5000 closed (4% open)' },
      downloadTrend: { score: 5, detail: '40,000,000 weekly downloads' },
      versionPinning: { score: 20, detail: 'Caret range: ^3.2.4' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2025-09-20T10:00:00Z', weeklyDownloads: 40000000, license: 'MIT', latestVersion: '3.3.3', description: 'Opinionated code formatter' },
      githubData: { contributorCount: 600, openIssueCount: 200, closedIssueCount: 5000, stars: 49000, lastCommitDate: '2026-01-15T10:00:00Z', repoUrl: 'https://github.com/prettier/prettier' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: false,
  },
  {
    name: 'nodemon',
    version: '^3.0.3',
    type: 'devDependency',
    riskScore: 18,
    riskLevel: 'low',
    signals: makeSignals({
      staleness: { score: 5, detail: 'Last published 0.3 years ago' },
      busFactor: { score: 0, detail: '250 contributor(s)' },
      openIssues: { score: 10, detail: '50 open / 2000 closed (2% open)' },
      downloadTrend: { score: 5, detail: '8,000,000 weekly downloads' },
      versionPinning: { score: 20, detail: 'Caret range: ^3.0.3' },
    }),
    metadata: {
      npmData: { lastPublishDate: '2025-11-01T10:00:00Z', weeklyDownloads: 8000000, license: 'MIT', latestVersion: '3.1.0', description: 'Simple monitor script for use during development of a Node.js app' },
      githubData: { contributorCount: 250, openIssueCount: 50, closedIssueCount: 2000, stars: 26000, lastCommitDate: '2025-11-01T10:00:00Z', repoUrl: 'https://github.com/remy/nodemon' },
      osvData: { vulnerabilities: [] },
    },
    hasPartialData: true,
  },
]

export const mixedProject: AnalysisResult = {
  overallScore: 51.33,
  grade: 'D',
  totalDependencies: 55,
  analyzedCount: 12,
  wasTruncated: true,
  riskCounts: { critical: 1, high: 1, medium: 2, low: 8 },
  dependencies: mixedDeps,
  aiRecommendation: 'Consider replacing moment with date-fns for a smaller bundle size and active maintenance. The event-stream package has a known supply chain attack — remove it immediately.',
}
