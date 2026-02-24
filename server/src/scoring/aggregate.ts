import type { SignalScore, Grade, RiskLevel } from '@shared/types';

export function calculateRiskScore(signals: SignalScore[]): number {
  const available = signals.filter((signal) => signal.available);

  if (available.length === 0) {
    return 0;
  }

  const totalWeight = available.reduce((sum, signal) => sum + signal.weight, 0);

  if (totalWeight === 0) {
    return 0;
  }

  const weightedSum = available.reduce((sum, signal) => sum + signal.weightedScore, 0);

  // Re-normalize: divide by actual total weight of available signals
  return Math.round((weightedSum / totalWeight) * 100) / 100;
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
