import type { SignalScore, Grade, RiskLevel } from '@shared/types';

const UNAVAILABLE_PENALTY_SCORE = 50;

export function calculateRiskScore(signals: SignalScore[]): number {
  if (signals.length === 0) {
    return 0;
  }

  // When a signal is unavailable (API failed), assume moderate risk (50)
  // instead of dropping the signal — prevents score deflation on failures
  const totalWeight = signals.reduce((sum, signal) => sum + signal.weight, 0);

  if (totalWeight === 0) {
    return 0;
  }

  const weightedSum = signals.reduce((sum, signal) => {
    if (signal.available) {
      return sum + signal.weightedScore;
    }
    return sum + UNAVAILABLE_PENALTY_SCORE * signal.weight;
  }, 0);

  let score = weightedSum / totalWeight;

  // Compound penalties for dangerous combinations
  const staleness = signals.find((sig) => sig.signal === 'staleness');
  const vulns = signals.find((sig) => sig.signal === 'vulnerabilities');

  if (staleness?.available && staleness.score >= 80) {
    if (vulns?.available && vulns.score === 0) {
      // Unmaintained package with no known CVEs — likely has undiscovered vulnerabilities
      score += 25;
    } else if (vulns?.available && vulns.score >= 70) {
      // Unmaintained AND has serious vulnerabilities — compounding danger
      score += 15;
    }
  } else if (staleness?.available && staleness.score >= 75) {
    if (vulns?.available && vulns.score >= 70) {
      // Moderately stale with serious vulns — still compounding
      score += 10;
    }
  }

  return Math.round(Math.min(100, score) * 100) / 100;
}

export function calculateGrade(averageScore: number): Grade {
  if (averageScore <= 20) return 'A';
  if (averageScore <= 35) return 'B';
  if (averageScore <= 50) return 'C';
  if (averageScore <= 70) return 'D';
  return 'F';
}

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 25) return 'low';
  if (score <= 50) return 'medium';
  if (score <= 75) return 'high';
  return 'critical';
}

export function calculateOverallScore(
  average: number,
  maxScore: number,
  highAndCriticalCount: number,
): number {
  const highRiskPenalty = Math.min(100, highAndCriticalCount * 25);
  const raw = average * 0.5 + maxScore * 0.3 + highRiskPenalty * 0.2;
  return Math.round(Math.min(100, raw) * 100) / 100;
}
