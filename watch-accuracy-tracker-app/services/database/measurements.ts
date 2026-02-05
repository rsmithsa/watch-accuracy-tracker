import { getDatabase, generateId } from './index';
import { Measurement, TimeSource } from '@/types/database';

interface CreateMeasurementInput {
  baselinePeriodId: string;
  referenceTime: number;
  capturedAt: number;
  offsetMs: number;
  timeSource: TimeSource;
}

export async function createMeasurement(input: CreateMeasurementInput): Promise<Measurement> {
  const db = await getDatabase();
  const measurement: Measurement = {
    id: generateId(),
    baselinePeriodId: input.baselinePeriodId,
    referenceTime: input.referenceTime,
    capturedAt: input.capturedAt,
    offsetMs: input.offsetMs,
    timeSource: input.timeSource,
    createdAt: Date.now(),
  };

  await db.runAsync(
    `INSERT INTO measurements (id, baseline_period_id, reference_time, captured_at, offset_ms, time_source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      measurement.id,
      measurement.baselinePeriodId,
      measurement.referenceTime,
      measurement.capturedAt,
      measurement.offsetMs,
      measurement.timeSource,
      measurement.createdAt,
    ]
  );

  return measurement;
}

export async function getMeasurements(baselinePeriodId: string): Promise<Measurement[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    baseline_period_id: string;
    reference_time: number;
    captured_at: number;
    offset_ms: number;
    time_source: string;
    created_at: number;
  }>(
    'SELECT * FROM measurements WHERE baseline_period_id = ? ORDER BY reference_time ASC',
    [baselinePeriodId]
  );

  return rows.map(row => ({
    id: row.id,
    baselinePeriodId: row.baseline_period_id,
    referenceTime: row.reference_time,
    capturedAt: row.captured_at,
    offsetMs: row.offset_ms,
    timeSource: row.time_source as TimeSource,
    createdAt: row.created_at,
  }));
}

export async function getLatestMeasurement(baselinePeriodId: string): Promise<Measurement | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    baseline_period_id: string;
    reference_time: number;
    captured_at: number;
    offset_ms: number;
    time_source: string;
    created_at: number;
  }>(
    'SELECT * FROM measurements WHERE baseline_period_id = ? ORDER BY reference_time DESC LIMIT 1',
    [baselinePeriodId]
  );

  if (!row) return null;

  return {
    id: row.id,
    baselinePeriodId: row.baseline_period_id,
    referenceTime: row.reference_time,
    capturedAt: row.captured_at,
    offsetMs: row.offset_ms,
    timeSource: row.time_source as TimeSource,
    createdAt: row.created_at,
  };
}

export async function getMeasurementCount(baselinePeriodId: string): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM measurements WHERE baseline_period_id = ?',
    [baselinePeriodId]
  );
  return result?.count ?? 0;
}

export async function deleteMeasurement(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM measurements WHERE id = ?', [id]);
}
