import { getDatabase, generateId } from './index';
import { Measurement, TimeSource } from '@/types/database';

interface CreateMeasurementInput {
  watchId: string;
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
    watchId: input.watchId,
    watchTime: input.watchTime,
    deviceTime: input.deviceTime,
    deltaMs: input.deltaMs,
    timeSource: input.timeSource,
    isBaseline: input.isBaseline,
    createdAt: Date.now(),
  };

  await db.runAsync(
    `INSERT INTO measurements (id, watch_id, watch_time, device_time, delta_ms, time_source, is_baseline, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      measurement.id,
      measurement.watchId,
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

export async function getMeasurements(watchId: string): Promise<Measurement[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    watch_id: string;
    watch_time: number;
    device_time: number;
    delta_ms: number;
    time_source: string;
    is_baseline: number;
    created_at: number;
  }>(
    'SELECT * FROM measurements WHERE watch_id = ? ORDER BY device_time ASC',
    [watchId]
  );

  return rows.map(row => ({
    id: row.id,
    watchId: row.watch_id,
    watchTime: row.watch_time,
    deviceTime: row.device_time,
    deltaMs: row.delta_ms,
    timeSource: row.time_source as TimeSource,
    isBaseline: row.is_baseline === 1,
    createdAt: row.created_at,
  }));
}

export async function deleteMeasurement(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM measurements WHERE id = ?', [id]);
}

interface CreateMeasurementWithIdInput {
  watchId: string;
  watchTime: number;
  deviceTime: number;
  deltaMs: number;
  timeSource: TimeSource;
  isBaseline: boolean;
}

export async function createMeasurementWithId(
  id: string,
  input: CreateMeasurementWithIdInput,
  createdAt: number
): Promise<Measurement> {
  const db = await getDatabase();
  const measurement: Measurement = {
    id,
    watchId: input.watchId,
    watchTime: input.watchTime,
    deviceTime: input.deviceTime,
    deltaMs: input.deltaMs,
    timeSource: input.timeSource,
    isBaseline: input.isBaseline,
    createdAt,
  };

  await db.runAsync(
    `INSERT INTO measurements (id, watch_id, watch_time, device_time, delta_ms, time_source, is_baseline, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      measurement.id,
      measurement.watchId,
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

export async function measurementExists(id: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM measurements WHERE id = ?',
    [id]
  );
  return (row?.count ?? 0) > 0;
}
