import { Watch, Measurement, MovementType, TimeSource } from '@/types/database';
import { getAllWatches, createWatchWithId, watchExists } from './database/watches';
import { getMeasurements, createMeasurementWithId, measurementExists } from './database/measurements';
import { clearAllData } from './database/index';

export interface ExportedMeasurement {
  id: string;
  watchTime: number;
  deviceTime: number;
  deltaMs: number;
  timeSource: TimeSource;
  isBaseline: boolean;
  createdAt: number;
}

export interface ExportedWatch {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  movementType: MovementType;
  createdAt: number;
  updatedAt: number;
  measurements: ExportedMeasurement[];
}

export interface ExportData {
  version: number;
  exportedAt: number;
  data: {
    watches: ExportedWatch[];
  };
}

export type ImportMode = 'merge' | 'replace';

export interface ImportResult {
  watchesImported: number;
  watchesSkipped: number;
  measurementsImported: number;
  measurementsSkipped: number;
}

const CURRENT_VERSION = 1;
const VALID_MOVEMENT_TYPES: MovementType[] = ['automatic', 'manual', 'quartz'];
const VALID_TIME_SOURCES: TimeSource[] = ['ntp', 'device'];

export async function exportAllData(): Promise<string> {
  const watches = await getAllWatches();

  const exportedWatches: ExportedWatch[] = await Promise.all(
    watches.map(async (watch) => {
      const measurements = await getMeasurements(watch.id);
      return {
        id: watch.id,
        name: watch.name,
        brand: watch.brand,
        model: watch.model,
        movementType: watch.movementType,
        createdAt: watch.createdAt,
        updatedAt: watch.updatedAt,
        measurements: measurements.map((m) => ({
          id: m.id,
          watchTime: m.watchTime,
          deviceTime: m.deviceTime,
          deltaMs: m.deltaMs,
          timeSource: m.timeSource,
          isBaseline: m.isBaseline,
          createdAt: m.createdAt,
        })),
      };
    })
  );

  const exportData: ExportData = {
    version: CURRENT_VERSION,
    exportedAt: Date.now(),
    data: {
      watches: exportedWatches,
    },
  };

  return JSON.stringify(exportData, null, 2);
}

export function validateImportData(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid JSON data' };
  }

  const exportData = data as Partial<ExportData>;

  if (typeof exportData.version !== 'number') {
    return { valid: false, error: 'Missing or invalid version field' };
  }

  if (exportData.version > CURRENT_VERSION) {
    return { valid: false, error: `Unsupported version: ${exportData.version}. Maximum supported: ${CURRENT_VERSION}` };
  }

  if (typeof exportData.exportedAt !== 'number') {
    return { valid: false, error: 'Missing or invalid exportedAt field' };
  }

  if (!exportData.data || typeof exportData.data !== 'object') {
    return { valid: false, error: 'Missing or invalid data field' };
  }

  if (!Array.isArray(exportData.data.watches)) {
    return { valid: false, error: 'Missing or invalid watches array' };
  }

  for (let i = 0; i < exportData.data.watches.length; i++) {
    const watch = exportData.data.watches[i];
    const watchValidation = validateWatch(watch, i);
    if (!watchValidation.valid) {
      return watchValidation;
    }

    if (!Array.isArray(watch.measurements)) {
      return { valid: false, error: `Watch ${i}: Missing or invalid measurements array` };
    }

    for (let j = 0; j < watch.measurements.length; j++) {
      const measurement = watch.measurements[j];
      const measurementValidation = validateMeasurement(measurement, i, j);
      if (!measurementValidation.valid) {
        return measurementValidation;
      }
    }
  }

  return { valid: true };
}

function validateWatch(watch: unknown, index: number): { valid: boolean; error?: string } {
  if (!watch || typeof watch !== 'object') {
    return { valid: false, error: `Watch ${index}: Invalid watch object` };
  }

  const w = watch as Partial<ExportedWatch>;

  if (typeof w.id !== 'string' || !w.id) {
    return { valid: false, error: `Watch ${index}: Missing or invalid id` };
  }

  if (typeof w.name !== 'string' || !w.name) {
    return { valid: false, error: `Watch ${index}: Missing or invalid name` };
  }

  if (!VALID_MOVEMENT_TYPES.includes(w.movementType as MovementType)) {
    return { valid: false, error: `Watch ${index}: Invalid movementType: ${w.movementType}` };
  }

  if (typeof w.createdAt !== 'number') {
    return { valid: false, error: `Watch ${index}: Missing or invalid createdAt` };
  }

  if (typeof w.updatedAt !== 'number') {
    return { valid: false, error: `Watch ${index}: Missing or invalid updatedAt` };
  }

  return { valid: true };
}

function validateMeasurement(
  measurement: unknown,
  watchIndex: number,
  measurementIndex: number
): { valid: boolean; error?: string } {
  if (!measurement || typeof measurement !== 'object') {
    return { valid: false, error: `Watch ${watchIndex}, Measurement ${measurementIndex}: Invalid measurement object` };
  }

  const m = measurement as Partial<ExportedMeasurement>;

  if (typeof m.id !== 'string' || !m.id) {
    return { valid: false, error: `Watch ${watchIndex}, Measurement ${measurementIndex}: Missing or invalid id` };
  }

  if (typeof m.watchTime !== 'number') {
    return { valid: false, error: `Watch ${watchIndex}, Measurement ${measurementIndex}: Missing or invalid watchTime` };
  }

  if (typeof m.deviceTime !== 'number') {
    return { valid: false, error: `Watch ${watchIndex}, Measurement ${measurementIndex}: Missing or invalid deviceTime` };
  }

  if (typeof m.deltaMs !== 'number') {
    return { valid: false, error: `Watch ${watchIndex}, Measurement ${measurementIndex}: Missing or invalid deltaMs` };
  }

  if (!VALID_TIME_SOURCES.includes(m.timeSource as TimeSource)) {
    return { valid: false, error: `Watch ${watchIndex}, Measurement ${measurementIndex}: Invalid timeSource: ${m.timeSource}` };
  }

  if (typeof m.isBaseline !== 'boolean') {
    return { valid: false, error: `Watch ${watchIndex}, Measurement ${measurementIndex}: Missing or invalid isBaseline` };
  }

  if (typeof m.createdAt !== 'number') {
    return { valid: false, error: `Watch ${watchIndex}, Measurement ${measurementIndex}: Missing or invalid createdAt` };
  }

  return { valid: true };
}

export async function importData(jsonString: string, mode: ImportMode): Promise<ImportResult> {
  let data: unknown;
  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON format');
  }

  const validation = validateImportData(data);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const exportData = data as ExportData;

  if (mode === 'replace') {
    await clearAllData();
  }

  const result: ImportResult = {
    watchesImported: 0,
    watchesSkipped: 0,
    measurementsImported: 0,
    measurementsSkipped: 0,
  };

  for (const watch of exportData.data.watches) {
    const exists = await watchExists(watch.id);

    if (exists && mode === 'merge') {
      result.watchesSkipped++;
    } else {
      await createWatchWithId(
        watch.id,
        {
          name: watch.name,
          brand: watch.brand,
          model: watch.model,
          movementType: watch.movementType,
        },
        watch.createdAt,
        watch.updatedAt
      );
      result.watchesImported++;
    }

    for (const measurement of watch.measurements) {
      const measurementExistsCheck = mode === 'merge' ? await measurementExists(measurement.id) : false;

      if (measurementExistsCheck) {
        result.measurementsSkipped++;
        continue;
      }

      await createMeasurementWithId(
        measurement.id,
        {
          watchId: watch.id,
          watchTime: measurement.watchTime,
          deviceTime: measurement.deviceTime,
          deltaMs: measurement.deltaMs,
          timeSource: measurement.timeSource,
          isBaseline: measurement.isBaseline,
        },
        measurement.createdAt
      );
      result.measurementsImported++;
    }
  }

  return result;
}
