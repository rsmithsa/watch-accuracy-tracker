import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('watch-accuracy-tracker.db');
  await runMigrations(db);
  return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS watches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      movement_type TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Check if measurements table needs migration to v3 schema (watch_id instead of baseline_period_id)
  const tableInfo = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(measurements)"
  );
  const hasWatchId = tableInfo.some(col => col.name === 'watch_id');
  const hasBaselinePeriodId = tableInfo.some(col => col.name === 'baseline_period_id');

  if (hasBaselinePeriodId && !hasWatchId) {
    // Migrate from v2 (baseline_period_id) to v3 (watch_id)
    await database.execAsync(`
      CREATE TABLE measurements_new (
        id TEXT PRIMARY KEY,
        watch_id TEXT NOT NULL,
        watch_time INTEGER NOT NULL,
        device_time INTEGER NOT NULL,
        delta_ms INTEGER NOT NULL,
        time_source TEXT NOT NULL,
        is_baseline INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (watch_id) REFERENCES watches(id) ON DELETE CASCADE
      );

      INSERT INTO measurements_new (id, watch_id, watch_time, device_time, delta_ms, time_source, is_baseline, created_at)
      SELECT m.id, bp.watch_id, m.watch_time, m.device_time, m.delta_ms, m.time_source, m.is_baseline, m.created_at
      FROM measurements m
      JOIN baseline_periods bp ON m.baseline_period_id = bp.id;

      DROP TABLE measurements;
      ALTER TABLE measurements_new RENAME TO measurements;
      DROP TABLE IF EXISTS baseline_periods;

      CREATE INDEX IF NOT EXISTS idx_measurements_watch_id ON measurements(watch_id);
    `);
  } else if (!hasWatchId) {
    // Fresh install - create v3 schema directly
    await database.execAsync(`
      DROP TABLE IF EXISTS measurements;
      DROP TABLE IF EXISTS baseline_periods;

      CREATE TABLE measurements (
        id TEXT PRIMARY KEY,
        watch_id TEXT NOT NULL,
        watch_time INTEGER NOT NULL,
        device_time INTEGER NOT NULL,
        delta_ms INTEGER NOT NULL,
        time_source TEXT NOT NULL,
        is_baseline INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (watch_id) REFERENCES watches(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_measurements_watch_id ON measurements(watch_id);
    `);
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
