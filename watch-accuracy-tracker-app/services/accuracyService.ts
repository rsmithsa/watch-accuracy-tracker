import { Measurement, AccuracyStats } from '@/types/database';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Find the applicable baseline for a measurement.
 * The baseline is the most recent measurement marked as isBaseline=true
 * that occurred before (or at the same time as) this measurement.
 */
function findApplicableBaseline(measurement: Measurement, allMeasurements: Measurement[]): Measurement | null {
  const baselines = allMeasurements
    .filter(m => m.isBaseline && m.deviceTime <= measurement.deviceTime)
    .sort((a, b) => b.deviceTime - a.deviceTime);

  return baselines[0] || null;
}

/**
 * Calculate drift from baseline for a single measurement.
 * Returns drift in seconds per day, or null if no baseline applies.
 */
export function calculateDriftFromBaseline(
  measurement: Measurement,
  baseline: Measurement
): { driftMs: number; elapsedMs: number; secondsPerDay: number | null } {
  const driftMs = measurement.deltaMs - baseline.deltaMs;
  const elapsedMs = measurement.deviceTime - baseline.deviceTime;

  // Need at least ~15 minutes elapsed for meaningful rate calculation
  if (elapsedMs < 15 * 60 * 1000) {
    return { driftMs, elapsedMs, secondsPerDay: null };
  }

  const elapsedDays = elapsedMs / MS_PER_DAY;
  const secondsPerDay = (driftMs / elapsedMs) * MS_PER_DAY / 1000;

  return { driftMs, elapsedMs, secondsPerDay };
}

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

  // Sort measurements by device time
  const sorted = [...measurements].sort((a, b) => a.deviceTime - b.deviceTime);

  // Find the most recent baseline
  const latestBaseline = sorted.filter(m => m.isBaseline).pop();
  if (!latestBaseline) {
    return {
      secondsPerDay: null,
      trend: 'unknown',
      confidence: 'low',
      elapsedDays: 0,
      totalDriftMs: 0,
      measurementCount: measurements.length,
    };
  }

  // Get measurements after the latest baseline (including the baseline itself)
  const measurementsInCurrentPeriod = sorted.filter(
    m => m.deviceTime >= latestBaseline.deviceTime
  );

  if (measurementsInCurrentPeriod.length < 2) {
    return {
      secondsPerDay: null,
      trend: 'unknown',
      confidence: 'low',
      elapsedDays: 0,
      totalDriftMs: 0,
      measurementCount: measurements.length,
    };
  }

  const lastMeasurement = measurementsInCurrentPeriod[measurementsInCurrentPeriod.length - 1];

  // Calculate elapsed time from baseline
  const elapsedMs = lastMeasurement.deviceTime - latestBaseline.deviceTime;
  const elapsedDays = elapsedMs / MS_PER_DAY;

  // Calculate total drift from baseline
  const totalDriftMs = lastMeasurement.deltaMs - latestBaseline.deltaMs;

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

  // Use linear regression for 3+ measurements in current period
  const secondsPerDay = measurementsInCurrentPeriod.length >= 3
    ? calculateWithRegression(measurementsInCurrentPeriod, latestBaseline)
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

  // Determine confidence based on measurements in current period
  let confidence: AccuracyStats['confidence'];
  if (elapsedDays >= 7 && measurementsInCurrentPeriod.length >= 5) {
    confidence = 'high';
  } else if (elapsedDays >= 1 && measurementsInCurrentPeriod.length >= 2) {
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

function calculateWithRegression(sorted: Measurement[], baseline: Measurement): number {
  const baselineTime = baseline.deviceTime;
  const baselineDelta = baseline.deltaMs;

  // Convert to (days since baseline, drift in seconds from baseline) points
  const points = sorted.map(m => ({
    x: (m.deviceTime - baselineTime) / MS_PER_DAY,
    y: (m.deltaMs - baselineDelta) / 1000,
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
