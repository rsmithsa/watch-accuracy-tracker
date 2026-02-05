import { getDatabase, generateId } from './index';
import { Measurement, TimeSource } from '@/types/database';

interface CreateMeasurementInput {
  baselinePeriodId: string;
  watchTime: number;
  deviceTime: number;
  deltaMs: number;
  timeSource: TimeSource;
  isBaseline: boolean;
}

export async function createMeasurement(input: CreateMeasurementInput): Promise<Measurement> {
  const db = await getDatabase();
  const measurement: Measurement = {
    id: generateId(),
    baselinePeriodId: input.baselinePeriodId,
    watchTime: input.watchTime,
    deviceTime: input.deviceTime,
    deltaMs: input.deltaMs,
    timeSource: input.timeSource,
    isBaseline: input.isBaseline,
    createdAt: Date.now(),
  };

  await db.runAsync(
    `INSERT INTO measurements (id, baseline_period_id, watch_time, device_time, delta_ms, time_source, is_baseline, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      measurement.id,
      measurement.baselinePeriodId,
      measurement.watchTime,
      measurement.deviceTime,
      measurement.deltaMs,
      measurement.timeSource,
      measurement.isBaseline ? 1 : 0,
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
    watch_time: number;
    device_time: number;
    delta_ms: number;
    time_source: string;
    is_baseline: number;
    created_at: number;
  }>(
    'SELECT * FROM measurements WHERE baseline_period_id = ? ORDER BY device_time ASC',
    [baselinePeriodId]
  );

  return rows.map(row => ({
    id: row.id,
    baselinePeriodId: row.baseline_period_id,
    watchTime: row.watch_time,
    deviceTime: row.device_time,
    deltaMs: row.delta_ms,
    timeSource: row.time_source as TimeSource,
    isBaseline: row.is_baseline === 1,
    createdAt: row.created_at,
  }));
}

export async function getLatestMeasurement(baselinePeriodId: string): Promise<Measurement | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    baseline_period_id: string;
    watch_time: number;
    device_time: number;
    delta_ms: number;
    time_source: string;
    is_baseline: number;
    created_at: number;
  }>(
    'SELECT * FROM measurements WHERE baseline_period_id = ? ORDER BY device_time DESC LIMIT 1',
    [baselinePeriodId]
  );

  if (!row) return null;

  return {
    id: row.id,
    baselinePeriodId: row.baseline_period_id,
    watchTime: row.watch_time,
    deviceTime: row.device_time,
    deltaMs: row.delta_ms,
    timeSource: row.time_source as TimeSource,
    isBaseline: row.is_baseline === 1,
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

export async function getLatestBaseline(baselinePeriodId: string): Promise<Measurement | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    baseline_period_id: string;
    watch_time: number;
    device_time: number;
    delta_ms: number;
    time_source: string;
    is_baseline: number;
    created_at: number;
  }>(
    'SELECT * FROM measurements WHERE baseline_period_id = ? AND is_baseline = 1 ORDER BY device_time DESC LIMIT 1',
    [baselinePeriodId]
  );

  if (!row) return null;

  return {
    id: row.id,
    baselinePeriodId: row.baseline_period_id,
    watchTime: row.watch_time,
    deviceTime: row.device_time,
    deltaMs: row.delta_ms,
    timeSource: row.time_source as TimeSource,
    isBaseline: row.is_baseline === 1,
    createdAt: row.created_at,
  };
}
