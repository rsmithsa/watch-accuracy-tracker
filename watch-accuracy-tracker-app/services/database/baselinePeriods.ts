import { getDatabase, generateId } from './index';
import { BaselinePeriod } from '@/types/database';

export async function createBaselinePeriod(watchId: string, notes?: string): Promise<BaselinePeriod> {
  const db = await getDatabase();
  const period: BaselinePeriod = {
    id: generateId(),
    watchId,
    startedAt: Date.now(),
    endedAt: null,
    notes: notes ?? null,
  };

  await db.runAsync(
    `INSERT INTO baseline_periods (id, watch_id, started_at, ended_at, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [period.id, period.watchId, period.startedAt, period.endedAt, period.notes]
  );

  return period;
}

export async function getActiveBaselinePeriod(watchId: string): Promise<BaselinePeriod | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    watch_id: string;
    started_at: number;
    ended_at: number | null;
    notes: string | null;
  }>(
    'SELECT * FROM baseline_periods WHERE watch_id = ? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1',
    [watchId]
  );

  if (!row) return null;

  return {
    id: row.id,
    watchId: row.watch_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    notes: row.notes,
  };
}

export async function getAllBaselinePeriods(watchId: string): Promise<BaselinePeriod[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    watch_id: string;
    started_at: number;
    ended_at: number | null;
    notes: string | null;
  }>(
    'SELECT * FROM baseline_periods WHERE watch_id = ? ORDER BY started_at DESC',
    [watchId]
  );

  return rows.map(row => ({
    id: row.id,
    watchId: row.watch_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    notes: row.notes,
  }));
}

export async function endBaselinePeriod(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE baseline_periods SET ended_at = ? WHERE id = ?',
    [Date.now(), id]
  );
}

export async function resetBaseline(watchId: string, notes?: string): Promise<BaselinePeriod> {
  const db = await getDatabase();

  // End current active baseline
  const active = await getActiveBaselinePeriod(watchId);
  if (active) {
    await endBaselinePeriod(active.id);
  }

  // Create new baseline
  return createBaselinePeriod(watchId, notes);
}
