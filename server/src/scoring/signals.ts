import type { SignalScore } from '@shared/types';

const WEIGHTS = {
  staleness: 0.25,
  vulnerabilities: 0.25,
  busFactor: 0.15,
  openIssues: 0.10,
  downloadTrend: 0.05,
  license: 0.10,
  versionPinning: 0.10,
} as const;

function unavailable(signal: string, weight: number): SignalScore {
  return {
    signal,
    score: 0,
    weight,
    weightedScore: 0,
    detail: 'Data unavailable',
    available: false,
  };
}

function buildScore(signal: string, weight: number, score: number, detail: string): SignalScore {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return {
    signal,
    score: clamped,
    weight,
    weightedScore: clamped * weight,
    detail,
    available: true,
  };
}

export function scoreStaleness(lastPublishDate: string | undefined): SignalScore {
  if (lastPublishDate === undefined) {
    return unavailable('staleness', WEIGHTS.staleness);
  }

  const now = new Date();
  const published = new Date(lastPublishDate);
  const monthsAgo = (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24 * 30);

  let score: number;
  if (monthsAgo <= 6) {
    // 0-6 months → 0-10 (linear interpolation)
    score = (monthsAgo / 6) * 10;
  } else if (monthsAgo <= 12) {
    // 6-12 months → 10-35
    score = 10 + ((monthsAgo - 6) / 6) * 25;
  } else if (monthsAgo <= 24) {
    // 12-24 months → 35-75
    score = 35 + ((monthsAgo - 12) / 12) * 40;
  } else {
    // 24+ months → 75-100 (cap at 100)
    score = Math.min(100, 75 + ((monthsAgo - 24) / 24) * 25);
  }

  const years = (monthsAgo / 12).toFixed(1);
  return buildScore('staleness', WEIGHTS.staleness, score, `Last published ${years} years ago`);
}

export function scoreVulnerabilities(
  vulns: Array<{ severity: string }> | undefined,
): SignalScore {
  if (vulns === undefined) {
    return unavailable('vulnerabilities', WEIGHTS.vulnerabilities);
  }

  if (vulns.length === 0) {
    return buildScore('vulnerabilities', WEIGHTS.vulnerabilities, 0, 'No known vulnerabilities');
  }

  if (vulns.length >= 3) {
    return buildScore('vulnerabilities', WEIGHTS.vulnerabilities, 100, `${vulns.length} vulnerabilities found`);
  }

  // Find the highest severity among all vulns
  const severityOrder: Record<string, number> = {
    CRITICAL: 90,
    HIGH: 70,
    MEDIUM: 40,
    LOW: 20,
  };

  let maxScore = 0;
  for (const vuln of vulns) {
    const upper = vuln.severity.toUpperCase();
    const vulnScore = severityOrder[upper] ?? 40;
    maxScore = Math.max(maxScore, vulnScore);
  }

  return buildScore(
    'vulnerabilities',
    WEIGHTS.vulnerabilities,
    maxScore,
    `${vulns.length} vulnerabilit${vulns.length === 1 ? 'y' : 'ies'} found (worst: ${vulns[0].severity})`,
  );
}

export function scoreBusFactor(contributorCount: number | undefined): SignalScore {
  if (contributorCount === undefined) {
    return unavailable('busFactor', WEIGHTS.busFactor);
  }

  let score: number;
  if (contributorCount <= 1) {
    score = 95;
  } else if (contributorCount === 2) {
    score = 70;
  } else if (contributorCount <= 5) {
    score = 50;
  } else if (contributorCount <= 10) {
    score = 30;
  } else if (contributorCount <= 20) {
    score = 15;
  } else if (contributorCount <= 50) {
    score = 5;
  } else {
    score = 0;
  }

  return buildScore('busFactor', WEIGHTS.busFactor, score, `${contributorCount} contributor(s)`);
}

export function scoreOpenIssues(
  openCount: number | undefined,
  closedCount: number | undefined,
): SignalScore {
  if (openCount === undefined || closedCount === undefined) {
    return unavailable('openIssues', WEIGHTS.openIssues);
  }

  const total = openCount + closedCount;

  if (total === 0) {
    return buildScore('openIssues', WEIGHTS.openIssues, 0, 'No issues found');
  }

  const ratio = openCount / total;
  // Combine ratio and absolute count for scoring
  // High ratio alone isn't bad if absolute count is low (small project)
  // High absolute count with high ratio = problematic
  const absoluteFactor = Math.min(1, openCount / 500); // scales 0-1 based on open count up to 500
  const score = Math.min(100, (ratio * 50) + (absoluteFactor * 50));

  return buildScore(
    'openIssues',
    WEIGHTS.openIssues,
    score,
    `${openCount} open / ${closedCount} closed (${(ratio * 100).toFixed(0)}% open)`,
  );
}

export function scoreDownloadTrend(weeklyDownloads: number | undefined): SignalScore {
  if (weeklyDownloads === undefined) {
    return unavailable('downloadTrend', WEIGHTS.downloadTrend);
  }

  let score: number;
  if (weeklyDownloads < 100) {
    score = 80;
  } else if (weeklyDownloads <= 1000) {
    score = 50;
  } else if (weeklyDownloads <= 100_000) {
    score = 20;
  } else {
    score = 5;
  }

  return buildScore(
    'downloadTrend',
    WEIGHTS.downloadTrend,
    score,
    `${weeklyDownloads.toLocaleString()} weekly downloads`,
  );
}

export function scoreLicense(license: string | null | undefined): SignalScore {
  if (license === undefined) {
    return unavailable('license', WEIGHTS.license);
  }

  if (license === null) {
    return buildScore('license', WEIGHTS.license, 80, 'No license specified');
  }

  const upper = license.toUpperCase();
  const permissive = ['MIT', 'APACHE-2.0', 'BSD-2-CLAUSE', 'BSD-3-CLAUSE', 'ISC', 'UNLICENSE', '0BSD'];
  const copyleft = ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'LGPL-2.1', 'LGPL-3.0'];

  if (permissive.some((lic) => upper.startsWith(lic))) {
    return buildScore('license', WEIGHTS.license, 0, `Permissive license: ${license}`);
  }

  if (copyleft.some((lic) => upper.startsWith(lic))) {
    return buildScore('license', WEIGHTS.license, 60, `Copyleft license: ${license}`);
  }

  return buildScore('license', WEIGHTS.license, 40, `Non-standard license: ${license}`);
}

export function scoreVersionPinning(versionString: string): SignalScore {
  let score: number;
  let detail: string;

  if (versionString === '*' || versionString.startsWith('>=') || versionString.startsWith('>')) {
    score = 90;
    detail = `Wide range: ${versionString}`;
  } else if (versionString.startsWith('^')) {
    score = 20;
    detail = `Caret range: ${versionString}`;
  } else if (versionString.startsWith('~')) {
    score = 10;
    detail = `Tilde range: ${versionString}`;
  } else {
    score = 0;
    detail = `Exact version: ${versionString}`;
  }

  return buildScore('versionPinning', WEIGHTS.versionPinning, score, detail);
}
