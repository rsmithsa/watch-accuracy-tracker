import { Measurement, AccuracyStats } from '@/types/database';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function calculateAccuracy(measurements: Measurement[]): AccuracyStats {
  if (measurements.length < 2) {
    return {
      secondsPerDay: null,
      trend: 'unknown',
      confidence: 'low',
      elapsedDays: 0,
      totalDriftMs: 0,
      measurementCount: measurements.length,
    };
  }

  // Sort measurements by reference time
  const sorted = [...measurements].sort((a, b) => a.referenceTime - b.referenceTime);

  const firstMeasurement = sorted[0];
  const lastMeasurement = sorted[sorted.length - 1];

  // Calculate elapsed time
  const elapsedMs = lastMeasurement.referenceTime - firstMeasurement.referenceTime;
  const elapsedDays = elapsedMs / MS_PER_DAY;

  // Calculate total drift
  const totalDriftMs = lastMeasurement.offsetMs - firstMeasurement.offsetMs;

  // Need meaningful time elapsed
  if (elapsedDays < 0.01) {
    return {
      secondsPerDay: null,
      trend: 'unknown',
      confidence: 'low',
      elapsedDays,
      totalDriftMs,
      measurementCount: measurements.length,
    };
  }

  // Use linear regression for 3+ measurements
  const secondsPerDay = measurements.length >= 3
    ? calculateWithRegression(sorted)
    : (totalDriftMs / elapsedDays) / 1000;

  // Determine trend
  let trend: AccuracyStats['trend'];
  if (Math.abs(secondsPerDay) < 0.5) {
    trend = 'stable';
  } else if (secondsPerDay > 0) {
    trend = 'gaining';
  } else {
    trend = 'losing';
  }

  // Determine confidence
  let confidence: AccuracyStats['confidence'];
  if (elapsedDays >= 7 && measurements.length >= 5) {
    confidence = 'high';
  } else if (elapsedDays >= 1 && measurements.length >= 2) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    secondsPerDay: Math.round(secondsPerDay * 10) / 10,
    trend,
    confidence,
    elapsedDays,
    totalDriftMs,
    measurementCount: measurements.length,
  };
}

function calculateWithRegression(sorted: Measurement[]): number {
  const firstTime = sorted[0].referenceTime;

  // Convert to (days, seconds offset) points
  const points = sorted.map(m => ({
    x: (m.referenceTime - firstTime) / MS_PER_DAY,
    y: m.offsetMs / 1000,
  }));

  // Linear regression: y = mx + b
  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    return 0;
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  return slope;
}

export function formatAccuracy(secondsPerDay: number | null): string {
  if (secondsPerDay === null) {
    return '--';
  }

  const sign = secondsPerDay >= 0 ? '+' : '';
  return `${sign}${secondsPerDay.toFixed(1)} s/day`;
}

export function formatOffset(offsetMs: number): string {
  const seconds = offsetMs / 1000;
  const sign = seconds >= 0 ? '+' : '';
  return `${sign}${seconds.toFixed(1)}s`;
}

export function getAccuracyColor(secondsPerDay: number | null): 'good' | 'fair' | 'poor' | 'unknown' {
  if (secondsPerDay === null) {
    return 'unknown';
  }

  const abs = Math.abs(secondsPerDay);
  if (abs <= 5) return 'good';
  if (abs <= 15) return 'fair';
  return 'poor';
}
