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

    CREATE TABLE IF NOT EXISTS baseline_periods (
      id TEXT PRIMARY KEY,
      watch_id TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      notes TEXT,
      FOREIGN KEY (watch_id) REFERENCES watches(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_baseline_periods_watch_id ON baseline_periods(watch_id);
  `);

  // Check if measurements table needs migration (v2 schema)
  const tableInfo = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(measurements)"
  );
  const hasWatchTime = tableInfo.some(col => col.name === 'watch_time');

  if (!hasWatchTime) {
    // Drop old table and create new one with updated schema
    await database.execAsync(`
      DROP TABLE IF EXISTS measurements;

      CREATE TABLE measurements (
        id TEXT PRIMARY KEY,
        baseline_period_id TEXT NOT NULL,
        watch_time INTEGER NOT NULL,
        device_time INTEGER NOT NULL,
        delta_ms INTEGER NOT NULL,
        time_source TEXT NOT NULL,
        is_baseline INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (baseline_period_id) REFERENCES baseline_periods(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_measurements_baseline_period_id ON measurements(baseline_period_id);
    `);
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
