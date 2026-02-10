import { getDatabase, generateId } from './index';
import { Watch, MovementType } from '@/types/database';

interface CreateWatchInput {
  name: string;
  brand?: string | null;
  model?: string | null;
  movementType: MovementType;
}

export async function createWatch(input: CreateWatchInput): Promise<Watch> {
  const db = await getDatabase();
  const now = Date.now();
  const watch: Watch = {
    id: generateId(),
    name: input.name,
    brand: input.brand ?? null,
    model: input.model ?? null,
    movementType: input.movementType,
    createdAt: now,
    updatedAt: now,
  };

  await db.runAsync(
    `INSERT INTO watches (id, name, brand, model, movement_type, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [watch.id, watch.name, watch.brand, watch.model, watch.movementType, watch.createdAt, watch.updatedAt]
  );

  return watch;
}

export async function getAllWatches(): Promise<Watch[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
    movement_type: string;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM watches ORDER BY created_at DESC');

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    brand: row.brand,
    model: row.model,
    movementType: row.movement_type as MovementType,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getWatch(id: string): Promise<Watch | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
    movement_type: string;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM watches WHERE id = ?', [id]);

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    model: row.model,
    movementType: row.movement_type as MovementType,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function updateWatch(id: string, updates: Partial<CreateWatchInput>): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.brand !== undefined) {
    fields.push('brand = ?');
    values.push(updates.brand ?? null);
  }
  if (updates.model !== undefined) {
    fields.push('model = ?');
    values.push(updates.model ?? null);
  }
  if (updates.movementType !== undefined) {
    fields.push('movement_type = ?');
    values.push(updates.movementType);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(Date.now());
  values.push(id);

  await db.runAsync(
    `UPDATE watches SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteWatch(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM watches WHERE id = ?', [id]);
}

interface CreateWatchWithIdInput {
  name: string;
  brand?: string | null;
  model?: string | null;
  movementType: MovementType;
}

export async function createWatchWithId(
  id: string,
  input: CreateWatchWithIdInput,
  createdAt: number,
  updatedAt: number
): Promise<Watch> {
  const db = await getDatabase();
  const watch: Watch = {
    id,
    name: input.name,
    brand: input.brand ?? null,
    model: input.model ?? null,
    movementType: input.movementType,
    createdAt,
    updatedAt,
  };

  await db.runAsync(
    `INSERT INTO watches (id, name, brand, model, movement_type, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [watch.id, watch.name, watch.brand, watch.model, watch.movementType, watch.createdAt, watch.updatedAt]
  );

  return watch;
}

export async function watchExists(id: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM watches WHERE id = ?',
    [id]
  );
  return (row?.count ?? 0) > 0;
}
