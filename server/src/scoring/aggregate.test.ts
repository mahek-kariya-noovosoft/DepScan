import { describe, it, expect } from 'vitest';
import { calculateRiskScore, calculateGrade, getRiskLevel } from './aggregate';
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
      makeSignal({ signal: 'staleness', score: 50, weight: 0.20, weightedScore: 10 }),
      makeSignal({ signal: 'vulnerabilities', score: 40, weight: 0.25, weightedScore: 10 }),
      makeSignal({ signal: 'busFactor', score: 30, weight: 0.15, weightedScore: 4.5 }),
      makeSignal({ signal: 'openIssues', score: 20, weight: 0.10, weightedScore: 2 }),
      makeSignal({ signal: 'downloadTrend', score: 60, weight: 0.10, weightedScore: 6 }),
      makeSignal({ signal: 'license', score: 0, weight: 0.10, weightedScore: 0 }),
      makeSignal({ signal: 'versionPinning', score: 20, weight: 0.10, weightedScore: 2 }),
    ];
    // Sum of weightedScores = 10 + 10 + 4.5 + 2 + 6 + 0 + 2 = 34.5
    // Sum of weights = 1.0
    // Result = 34.5 / 1.0 = 34.5
    const result = calculateRiskScore(signals);
    expect(result).toBeCloseTo(34.5, 1);
  });

  it('should re-normalize when some signals are unavailable', () => {
    const signals: SignalScore[] = [
      makeSignal({ signal: 'staleness', score: 50, weight: 0.20, weightedScore: 10, available: true }),
      makeSignal({ signal: 'vulnerabilities', score: 0, weight: 0.25, weightedScore: 0, available: false }),
      makeSignal({ signal: 'busFactor', score: 30, weight: 0.15, weightedScore: 4.5, available: true }),
      makeSignal({ signal: 'openIssues', score: 0, weight: 0.10, weightedScore: 0, available: false }),
      makeSignal({ signal: 'downloadTrend', score: 60, weight: 0.10, weightedScore: 6, available: true }),
      makeSignal({ signal: 'license', score: 0, weight: 0.10, weightedScore: 0, available: true }),
      makeSignal({ signal: 'versionPinning', score: 20, weight: 0.10, weightedScore: 2, available: true }),
    ];
    // Available weights: 0.20 + 0.15 + 0.10 + 0.10 + 0.10 = 0.65
    // Available weightedScores: 10 + 4.5 + 6 + 0 + 2 = 22.5
    // Re-normalized: 22.5 / 0.65 ≈ 34.615
    const result = calculateRiskScore(signals);
    expect(result).toBeCloseTo(34.615, 0);
  });

  it('should return 0 when no signals are available', () => {
    const signals: SignalScore[] = [
      makeSignal({ signal: 'staleness', available: false, weight: 0.20, weightedScore: 0 }),
      makeSignal({ signal: 'vulnerabilities', available: false, weight: 0.25, weightedScore: 0 }),
    ];
    const result = calculateRiskScore(signals);
    expect(result).toBe(0);
  });

  it('should return 0 for empty signals array', () => {
    expect(calculateRiskScore([])).toBe(0);
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
