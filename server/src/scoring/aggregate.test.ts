import { describe, it, expect } from 'vitest';
import { calculateRiskScore, calculateGrade, getRiskLevel, calculateOverallScore } from './aggregate';
import type { SignalScore } from '@shared/types';

function makeSignal(overrides: Partial<SignalScore> & { signal: string }): SignalScore {
  return {
    score: 50,
    weight: 0.1,
    weightedScore: 5,
    detail: '',
    available: true,
    ...overrides,
  };
}

// ── calculateRiskScore ──────────────────────────────────────────────

describe('calculateRiskScore', () => {
  it('should return weighted average when all signals are available', () => {
    const signals: SignalScore[] = [
      makeSignal({ signal: 'staleness', score: 50, weight: 0.25, weightedScore: 12.5 }),
      makeSignal({ signal: 'vulnerabilities', score: 40, weight: 0.25, weightedScore: 10 }),
      makeSignal({ signal: 'busFactor', score: 30, weight: 0.15, weightedScore: 4.5 }),
      makeSignal({ signal: 'openIssues', score: 20, weight: 0.10, weightedScore: 2 }),
      makeSignal({ signal: 'downloadTrend', score: 60, weight: 0.05, weightedScore: 3 }),
      makeSignal({ signal: 'license', score: 0, weight: 0.10, weightedScore: 0 }),
      makeSignal({ signal: 'versionPinning', score: 20, weight: 0.10, weightedScore: 2 }),
    ];
    // Sum of weightedScores = 12.5 + 10 + 4.5 + 2 + 3 + 0 + 2 = 34
    // Sum of weights = 1.0
    // Result = 34 / 1.0 = 34
    const result = calculateRiskScore(signals);
    expect(result).toBeCloseTo(34, 1);
  });

  it('should penalize unavailable signals with score 50 instead of dropping them', () => {
    const signals: SignalScore[] = [
      makeSignal({ signal: 'staleness', score: 50, weight: 0.25, weightedScore: 12.5, available: true }),
      makeSignal({ signal: 'vulnerabilities', score: 0, weight: 0.25, weightedScore: 0, available: false }),
      makeSignal({ signal: 'busFactor', score: 30, weight: 0.15, weightedScore: 4.5, available: true }),
      makeSignal({ signal: 'openIssues', score: 0, weight: 0.10, weightedScore: 0, available: false }),
      makeSignal({ signal: 'downloadTrend', score: 60, weight: 0.05, weightedScore: 3, available: true }),
      makeSignal({ signal: 'license', score: 0, weight: 0.10, weightedScore: 0, available: true }),
      makeSignal({ signal: 'versionPinning', score: 20, weight: 0.10, weightedScore: 2, available: true }),
    ];
    // Available: 12.5 + 4.5 + 3 + 0 + 2 = 22
    // Unavailable penalty: (50 * 0.25) + (50 * 0.10) = 12.5 + 5 = 17.5
    // Total weighted: 22 + 17.5 = 39.5
    // Total weight: 1.0
    // Result = 39.5 / 1.0 = 39.5
    const result = calculateRiskScore(signals);
    expect(result).toBeCloseTo(39.5, 1);
  });

  it('should assign penalty score of 50 when all signals are unavailable', () => {
    const signals: SignalScore[] = [
      makeSignal({ signal: 'staleness', available: false, weight: 0.25, weightedScore: 0 }),
      makeSignal({ signal: 'vulnerabilities', available: false, weight: 0.25, weightedScore: 0 }),
    ];
    // Both unavailable: (50 * 0.25) + (50 * 0.25) = 25
    // Total weight: 0.50
    // Result = 25 / 0.50 = 50
    const result = calculateRiskScore(signals);
    expect(result).toBe(50);
  });

  it('should return 0 for empty signals array', () => {
    expect(calculateRiskScore([])).toBe(0);
  });

  it('should apply unmaintained penalty when stale and no CVEs', () => {
    const signals: SignalScore[] = [
      makeSignal({ signal: 'staleness', score: 100, weight: 0.25, weightedScore: 25, available: true }),
      makeSignal({ signal: 'vulnerabilities', score: 0, weight: 0.25, weightedScore: 0, available: true }),
      makeSignal({ signal: 'busFactor', score: 0, weight: 0.15, weightedScore: 0, available: true }),
      makeSignal({ signal: 'openIssues', score: 0, weight: 0.10, weightedScore: 0, available: true }),
      makeSignal({ signal: 'downloadTrend', score: 5, weight: 0.05, weightedScore: 0.25, available: true }),
      makeSignal({ signal: 'license', score: 0, weight: 0.10, weightedScore: 0, available: true }),
      makeSignal({ signal: 'versionPinning', score: 0, weight: 0.10, weightedScore: 0, available: true }),
    ];
    // Raw: 25.25 / 1.0 = 25.25
    // + unmaintained penalty (staleness>=80, vulns=0): +25
    // = 50.25
    const result = calculateRiskScore(signals);
    expect(result).toBeCloseTo(50.25, 1);
  });

  it('should apply compound penalty when stale AND has serious vulns', () => {
    const signals: SignalScore[] = [
      makeSignal({ signal: 'staleness', score: 100, weight: 0.25, weightedScore: 25, available: true }),
      makeSignal({ signal: 'vulnerabilities', score: 90, weight: 0.25, weightedScore: 22.5, available: true }),
      makeSignal({ signal: 'busFactor', score: 0, weight: 0.15, weightedScore: 0, available: true }),
      makeSignal({ signal: 'openIssues', score: 0, weight: 0.10, weightedScore: 0, available: true }),
      makeSignal({ signal: 'downloadTrend', score: 5, weight: 0.05, weightedScore: 0.25, available: true }),
      makeSignal({ signal: 'license', score: 0, weight: 0.10, weightedScore: 0, available: true }),
      makeSignal({ signal: 'versionPinning', score: 0, weight: 0.10, weightedScore: 0, available: true }),
    ];
    // Raw: 47.75 / 1.0 = 47.75
    // + stale+vulnerable penalty (staleness>=80, vulns>=70): +15
    // = 62.75
    const result = calculateRiskScore(signals);
    expect(result).toBeCloseTo(62.75, 1);
  });

  it('should apply moderate compound penalty when moderately stale with serious vulns', () => {
    const signals: SignalScore[] = [
      makeSignal({ signal: 'staleness', score: 77, weight: 0.25, weightedScore: 19.25, available: true }),
      makeSignal({ signal: 'vulnerabilities', score: 100, weight: 0.25, weightedScore: 25, available: true }),
      makeSignal({ signal: 'busFactor', score: 0, weight: 0.15, weightedScore: 0, available: true }),
      makeSignal({ signal: 'openIssues', score: 0, weight: 0.10, weightedScore: 0, available: true }),
      makeSignal({ signal: 'downloadTrend', score: 5, weight: 0.05, weightedScore: 0.25, available: true }),
      makeSignal({ signal: 'license', score: 0, weight: 0.10, weightedScore: 0, available: true }),
      makeSignal({ signal: 'versionPinning', score: 90, weight: 0.10, weightedScore: 9, available: true }),
    ];
    // Raw: 53.5 / 1.0 = 53.5
    // + moderately stale compound (staleness>=75, vulns>=70): +10
    // = 63.5
    const result = calculateRiskScore(signals);
    expect(result).toBeCloseTo(63.5, 1);
  });

  it('should not apply compound penalty for fresh packages with vulns', () => {
    const signals: SignalScore[] = [
      makeSignal({ signal: 'staleness', score: 10, weight: 0.25, weightedScore: 2.5, available: true }),
      makeSignal({ signal: 'vulnerabilities', score: 90, weight: 0.25, weightedScore: 22.5, available: true }),
      makeSignal({ signal: 'busFactor', score: 0, weight: 0.15, weightedScore: 0, available: true }),
      makeSignal({ signal: 'openIssues', score: 0, weight: 0.10, weightedScore: 0, available: true }),
      makeSignal({ signal: 'downloadTrend', score: 5, weight: 0.05, weightedScore: 0.25, available: true }),
      makeSignal({ signal: 'license', score: 0, weight: 0.10, weightedScore: 0, available: true }),
      makeSignal({ signal: 'versionPinning', score: 0, weight: 0.10, weightedScore: 0, available: true }),
    ];
    // Raw: 25.25 / 1.0 = 25.25
    // No compound (staleness 10 < 75)
    const result = calculateRiskScore(signals);
    expect(result).toBeCloseTo(25.25, 1);
  });

  it('should cap score at 100', () => {
    const signals: SignalScore[] = [
      makeSignal({ signal: 'staleness', score: 100, weight: 0.25, weightedScore: 25, available: true }),
      makeSignal({ signal: 'vulnerabilities', score: 0, weight: 0.25, weightedScore: 0, available: true }),
      makeSignal({ signal: 'busFactor', score: 100, weight: 0.15, weightedScore: 15, available: true }),
      makeSignal({ signal: 'openIssues', score: 100, weight: 0.10, weightedScore: 10, available: true }),
      makeSignal({ signal: 'downloadTrend', score: 100, weight: 0.05, weightedScore: 5, available: true }),
      makeSignal({ signal: 'license', score: 100, weight: 0.10, weightedScore: 10, available: true }),
      makeSignal({ signal: 'versionPinning', score: 100, weight: 0.10, weightedScore: 10, available: true }),
    ];
    // Raw: 75 + compound 25 = 100 — should not exceed 100
    const result = calculateRiskScore(signals);
    expect(result).toBe(100);
  });
});

// ── calculateGrade ──────────────────────────────────────────────────

describe('calculateGrade', () => {
  it('should return A for score 0', () => {
    expect(calculateGrade(0)).toBe('A');
  });

  it('should return A for score 20 (boundary)', () => {
    expect(calculateGrade(20)).toBe('A');
  });

  it('should return B for score 21 (boundary)', () => {
    expect(calculateGrade(21)).toBe('B');
  });

  it('should return B for score 35 (boundary)', () => {
    expect(calculateGrade(35)).toBe('B');
  });

  it('should return C for score 36 (boundary)', () => {
    expect(calculateGrade(36)).toBe('C');
  });

  it('should return C for score 50 (boundary)', () => {
    expect(calculateGrade(50)).toBe('C');
  });

  it('should return D for score 51 (boundary)', () => {
    expect(calculateGrade(51)).toBe('D');
  });

  it('should return D for score 70 (boundary)', () => {
    expect(calculateGrade(70)).toBe('D');
  });

  it('should return F for score 71 (boundary)', () => {
    expect(calculateGrade(71)).toBe('F');
  });

  it('should return F for score 100', () => {
    expect(calculateGrade(100)).toBe('F');
  });
});

// ── getRiskLevel ────────────────────────────────────────────────────

describe('getRiskLevel', () => {
  it('should return low for score 0', () => {
    expect(getRiskLevel(0)).toBe('low');
  });

  it('should return low for score 25 (boundary)', () => {
    expect(getRiskLevel(25)).toBe('low');
  });

  it('should return medium for score 26 (boundary)', () => {
    expect(getRiskLevel(26)).toBe('medium');
  });

  it('should return medium for score 50 (boundary)', () => {
    expect(getRiskLevel(50)).toBe('medium');
  });

  it('should return high for score 51 (boundary)', () => {
    expect(getRiskLevel(51)).toBe('high');
  });

  it('should return high for score 75 (boundary)', () => {
    expect(getRiskLevel(75)).toBe('high');
  });

  it('should return critical for score 76 (boundary)', () => {
    expect(getRiskLevel(76)).toBe('critical');
  });

  it('should return critical for score 100', () => {
    expect(getRiskLevel(100)).toBe('critical');
  });
});

// ── calculateOverallScore ──────────────────────────────────────────

describe('calculateOverallScore', () => {
  it('should return 0 when all inputs are zero', () => {
    expect(calculateOverallScore(0, 0, 0)).toBe(0);
  });

  it('should return weighted average+max with no high-risk deps', () => {
    // 30*0.5 + 40*0.3 + 0*0.2 = 15 + 12 + 0 = 27
    expect(calculateOverallScore(30, 40, 0)).toBe(27);
  });

  it('should apply penalty for 2 high-risk deps', () => {
    // 50*0.5 + 80*0.3 + min(100,50)*0.2 = 25 + 24 + 10 = 59
    expect(calculateOverallScore(50, 80, 2)).toBe(59);
  });

  it('should cap highRiskPenalty at 100', () => {
    // 60*0.5 + 90*0.3 + min(100,125)*0.2 = 30 + 27 + 20 = 77
    expect(calculateOverallScore(60, 90, 5)).toBe(77);
  });

  it('should cap final score at 100', () => {
    // 100*0.5 + 100*0.3 + min(100,250)*0.2 = 50 + 30 + 20 = 100
    expect(calculateOverallScore(100, 100, 10)).toBe(100);
  });

  it('should round to 2 decimal places', () => {
    // 13.2857*0.5 + 18*0.3 + 0 = 6.64285 + 5.4 = 12.04285 → 12.04
    expect(calculateOverallScore(93 / 7, 18, 0)).toBe(12.04);
  });

  it('should handle single high-risk dep', () => {
    // 40*0.5 + 75*0.3 + min(100,25)*0.2 = 20 + 22.5 + 5 = 47.5
    expect(calculateOverallScore(40, 75, 1)).toBe(47.5);
  });

  it('should match healthy fixture score', () => {
    // avg=93/7, max=18, highAndCritical=0
    expect(calculateOverallScore(93 / 7, 18, 0)).toBe(12.04);
  });

  it('should match nightmare fixture score', () => {
    // avg=494/7, max=95, highAndCritical=6
    expect(calculateOverallScore(494 / 7, 95, 6)).toBe(83.79);
  });

  it('should match mixed fixture score', () => {
    // avg=380/12, max=85, highAndCritical=2
    expect(calculateOverallScore(380 / 12, 85, 2)).toBe(51.33);
  });
});
