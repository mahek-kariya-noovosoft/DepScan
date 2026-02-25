import { describe, it, expect } from 'vitest';
import {
  scoreStaleness,
  scoreVulnerabilities,
  scoreBusFactor,
  scoreOpenIssues,
  scoreDownloadTrend,
  scoreLicense,
  scoreVersionPinning,
} from './signals';

// ── scoreStaleness ──────────────────────────────────────────────────

describe('scoreStaleness', () => {
  it('should return low risk for package published 1 month ago', () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const result = scoreStaleness(oneMonthAgo.toISOString());
    expect(result.available).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.signal).toBe('staleness');
    expect(result.weight).toBe(0.25);
  });

  it('should return moderate risk for package published 8 months ago', () => {
    const eightMonthsAgo = new Date();
    eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);
    const result = scoreStaleness(eightMonthsAgo.toISOString());
    expect(result.available).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(10);
    expect(result.score).toBeLessThanOrEqual(35);
  });

  it('should return high risk for package published 18 months ago', () => {
    const eighteenMonthsAgo = new Date();
    eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);
    const result = scoreStaleness(eighteenMonthsAgo.toISOString());
    expect(result.available).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(35);
    expect(result.score).toBeLessThanOrEqual(75);
  });

  it('should return very high risk for package published 3 years ago', () => {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    const result = scoreStaleness(threeYearsAgo.toISOString());
    expect(result.available).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should cap at 100 for packages published 5+ years ago', () => {
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const result = scoreStaleness(fiveYearsAgo.toISOString());
    expect(result.score).toBe(100);
  });

  it('should return available: false when lastPublishDate is undefined', () => {
    const result = scoreStaleness(undefined);
    expect(result.available).toBe(false);
    expect(result.score).toBe(0);
  });
});

// ── scoreVulnerabilities ────────────────────────────────────────────

describe('scoreVulnerabilities', () => {
  it('should return 0 for no vulnerabilities', () => {
    const result = scoreVulnerabilities([]);
    expect(result.available).toBe(true);
    expect(result.score).toBe(0);
  });

  it('should return 20 for 1 low severity vulnerability', () => {
    const result = scoreVulnerabilities([{ severity: 'LOW' }]);
    expect(result.score).toBe(20);
  });

  it('should return 40 for 1 medium severity vulnerability', () => {
    const result = scoreVulnerabilities([{ severity: 'MEDIUM' }]);
    expect(result.score).toBe(40);
  });

  it('should return 70 for 1 high severity vulnerability', () => {
    const result = scoreVulnerabilities([{ severity: 'HIGH' }]);
    expect(result.score).toBe(70);
  });

  it('should return 90 for any critical vulnerability', () => {
    const result = scoreVulnerabilities([{ severity: 'CRITICAL' }]);
    expect(result.score).toBe(90);
  });

  it('should return 100 for 3+ vulnerabilities of any severity', () => {
    const result = scoreVulnerabilities([
      { severity: 'LOW' },
      { severity: 'LOW' },
      { severity: 'MEDIUM' },
    ]);
    expect(result.score).toBe(100);
  });

  it('should return available: false when vulns is undefined', () => {
    const result = scoreVulnerabilities(undefined);
    expect(result.available).toBe(false);
    expect(result.score).toBe(0);
  });
});

// ── scoreBusFactor ──────────────────────────────────────────────────

describe('scoreBusFactor', () => {
  it('should return 95 for single contributor', () => {
    const result = scoreBusFactor(1);
    expect(result.score).toBe(95);
  });

  it('should return 70 for 2 contributors', () => {
    const result = scoreBusFactor(2);
    expect(result.score).toBe(70);
  });

  it('should return 50 for 3-5 contributors', () => {
    expect(scoreBusFactor(3).score).toBe(50);
    expect(scoreBusFactor(5).score).toBe(50);
  });

  it('should return 30 for 6-10 contributors', () => {
    expect(scoreBusFactor(6).score).toBe(30);
    expect(scoreBusFactor(10).score).toBe(30);
  });

  it('should return 15 for 11-20 contributors', () => {
    expect(scoreBusFactor(11).score).toBe(15);
    expect(scoreBusFactor(20).score).toBe(15);
  });

  it('should return 5 for 21-50 contributors', () => {
    expect(scoreBusFactor(21).score).toBe(5);
    expect(scoreBusFactor(50).score).toBe(5);
  });

  it('should return 0 for 50+ contributors', () => {
    expect(scoreBusFactor(51).score).toBe(0);
    expect(scoreBusFactor(100).score).toBe(0);
  });

  it('should return available: false when contributorCount is undefined', () => {
    const result = scoreBusFactor(undefined);
    expect(result.available).toBe(false);
    expect(result.score).toBe(0);
  });
});

// ── scoreOpenIssues ─────────────────────────────────────────────────

describe('scoreOpenIssues', () => {
  it('should return low risk for healthy issue ratio', () => {
    const result = scoreOpenIssues(10, 100);
    expect(result.available).toBe(true);
    expect(result.score).toBeLessThanOrEqual(30);
  });

  it('should return high risk for high open ratio with high count', () => {
    const result = scoreOpenIssues(500, 100);
    expect(result.available).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(60);
  });

  it('should return low risk when both counts are 0', () => {
    const result = scoreOpenIssues(0, 0);
    expect(result.available).toBe(true);
    expect(result.score).toBeLessThanOrEqual(10);
  });

  it('should return available: false when openCount is undefined', () => {
    const result = scoreOpenIssues(undefined, 100);
    expect(result.available).toBe(false);
  });

  it('should return available: false when closedCount is undefined', () => {
    const result = scoreOpenIssues(100, undefined);
    expect(result.available).toBe(false);
  });
});

// ── scoreDownloadTrend ──────────────────────────────────────────────

describe('scoreDownloadTrend', () => {
  it('should return 80 for fewer than 100 weekly downloads', () => {
    expect(scoreDownloadTrend(50).score).toBe(80);
    expect(scoreDownloadTrend(50).weight).toBe(0.05);
  });

  it('should return 50 for 100-1000 weekly downloads', () => {
    expect(scoreDownloadTrend(500).score).toBe(50);
  });

  it('should return 20 for 1k-100k weekly downloads', () => {
    expect(scoreDownloadTrend(50000).score).toBe(20);
  });

  it('should return 5 for 100k+ weekly downloads', () => {
    expect(scoreDownloadTrend(500000).score).toBe(5);
  });

  it('should return available: false when weeklyDownloads is undefined', () => {
    const result = scoreDownloadTrend(undefined);
    expect(result.available).toBe(false);
    expect(result.score).toBe(0);
  });
});

// ── scoreLicense ────────────────────────────────────────────────────

describe('scoreLicense', () => {
  it('should return 0 for MIT license', () => {
    expect(scoreLicense('MIT').score).toBe(0);
  });

  it('should return 0 for Apache-2.0 license', () => {
    expect(scoreLicense('Apache-2.0').score).toBe(0);
  });

  it('should return 0 for BSD-3-Clause license', () => {
    expect(scoreLicense('BSD-3-Clause').score).toBe(0);
  });

  it('should return 0 for ISC license', () => {
    expect(scoreLicense('ISC').score).toBe(0);
  });

  it('should return 60 for GPL license', () => {
    expect(scoreLicense('GPL-3.0').score).toBe(60);
  });

  it('should return 60 for AGPL license', () => {
    expect(scoreLicense('AGPL-3.0').score).toBe(60);
  });

  it('should return 80 for null license', () => {
    expect(scoreLicense(null).score).toBe(80);
  });

  it('should return available: false for undefined license', () => {
    const result = scoreLicense(undefined);
    expect(result.available).toBe(false);
    expect(result.score).toBe(0);
  });
});

// ── scoreVersionPinning ─────────────────────────────────────────────

describe('scoreVersionPinning', () => {
  it('should return 0 for exact version pinning', () => {
    expect(scoreVersionPinning('1.2.3').score).toBe(0);
  });

  it('should return 10 for tilde range', () => {
    expect(scoreVersionPinning('~1.2.3').score).toBe(10);
  });

  it('should return 20 for caret range', () => {
    expect(scoreVersionPinning('^1.2.3').score).toBe(20);
  });

  it('should return 90 for >= range', () => {
    expect(scoreVersionPinning('>=1.0.0').score).toBe(90);
  });

  it('should return 90 for wildcard *', () => {
    expect(scoreVersionPinning('*').score).toBe(90);
  });

  it('should always have available: true since version string is always present', () => {
    expect(scoreVersionPinning('^1.0.0').available).toBe(true);
  });
});
