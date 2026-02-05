import { create } from 'zustand';
import { Watch, WatchWithStats, Measurement, MovementType } from '@/types/database';
import * as watchService from '@/services/database/watches';
import * as baselineService from '@/services/database/baselinePeriods';
import * as measurementService from '@/services/database/measurements';
import { calculateAccuracy } from '@/services/accuracyService';

interface WatchState {
  watches: WatchWithStats[];
  selectedWatch: WatchWithStats | null;
  measurements: Measurement[];
  isLoading: boolean;
  error: string | null;

  loadWatches: () => Promise<void>;
  loadWatch: (id: string) => Promise<void>;
  addWatch: (input: { name: string; brand?: string; model?: string; movementType: MovementType }) => Promise<string>;
  updateWatch: (id: string, updates: { name?: string; brand?: string; model?: string; movementType?: MovementType }) => Promise<void>;
  deleteWatch: (id: string) => Promise<void>;
  loadMeasurements: (baselinePeriodId: string) => Promise<void>;
  addMeasurement: (baselinePeriodId: string, watchTime: number, deviceTime: number, deltaMs: number, timeSource: 'ntp' | 'device', isBaseline: boolean) => Promise<void>;
  resetBaseline: (watchId: string, notes?: string) => Promise<void>;
  clearError: () => void;
}

export const useWatchStore = create<WatchState>((set, get) => ({
  watches: [],
  selectedWatch: null,
  measurements: [],
  isLoading: false,
  error: null,

  loadWatches: async () => {
    set({ isLoading: true, error: null });
    try {
      const watches = await watchService.getAllWatches();
      const watchesWithStats = await Promise.all(
        watches.map(async (watch) => {
          const baseline = await baselineService.getActiveBaselinePeriod(watch.id);
          let measurementCount = 0;
          let latestOffset: number | null = null;
          let accuracyPerDay: number | null = null;

          if (baseline) {
            const measurements = await measurementService.getMeasurements(baseline.id);
            measurementCount = measurements.length;
            if (measurements.length > 0) {
              latestOffset = measurements[measurements.length - 1].deltaMs;
              const accuracy = calculateAccuracy(measurements);
              accuracyPerDay = accuracy.secondsPerDay;
            }
          }

          return {
            ...watch,
            currentBaselinePeriod: baseline,
            measurementCount,
            latestOffset,
            accuracyPerDay,
          };
        })
      );
      set({ watches: watchesWithStats, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load watches', isLoading: false });
    }
  },

  loadWatch: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const watch = await watchService.getWatch(id);
      if (!watch) {
        set({ selectedWatch: null, isLoading: false, error: 'Watch not found' });
        return;
      }

      const baseline = await baselineService.getActiveBaselinePeriod(watch.id);
      let measurementCount = 0;
      let latestOffset: number | null = null;
      let accuracyPerDay: number | null = null;
      let measurements: Measurement[] = [];

      if (baseline) {
        measurements = await measurementService.getMeasurements(baseline.id);
        measurementCount = measurements.length;
        if (measurements.length > 0) {
          latestOffset = measurements[measurements.length - 1].deltaMs;
          const accuracy = calculateAccuracy(measurements);
          accuracyPerDay = accuracy.secondsPerDay;
        }
      }

      set({
        selectedWatch: {
          ...watch,
          currentBaselinePeriod: baseline,
          measurementCount,
          latestOffset,
          accuracyPerDay,
        },
        measurements,
        isLoading: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load watch', isLoading: false });
    }
  },

  addWatch: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const watch = await watchService.createWatch(input);
      // Create initial baseline period
      await baselineService.createBaselinePeriod(watch.id);
      await get().loadWatches();
      return watch.id;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to add watch', isLoading: false });
      throw err;
    }
  },

  updateWatch: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await watchService.updateWatch(id, updates);
      await get().loadWatches();
      if (get().selectedWatch?.id === id) {
        await get().loadWatch(id);
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update watch', isLoading: false });
    }
  },

  deleteWatch: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await watchService.deleteWatch(id);
      if (get().selectedWatch?.id === id) {
        set({ selectedWatch: null });
      }
      await get().loadWatches();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete watch', isLoading: false });
    }
  },

  loadMeasurements: async (baselinePeriodId) => {
    try {
      const measurements = await measurementService.getMeasurements(baselinePeriodId);
      set({ measurements });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load measurements' });
    }
  },

  addMeasurement: async (baselinePeriodId, watchTime, deviceTime, deltaMs, timeSource, isBaseline) => {
    try {
      await measurementService.createMeasurement({
        baselinePeriodId,
        watchTime,
        deviceTime,
        deltaMs,
        timeSource,
        isBaseline,
      });
      await get().loadMeasurements(baselinePeriodId);
      // Reload watch to update stats
      const watch = get().selectedWatch;
      if (watch) {
        await get().loadWatch(watch.id);
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to add measurement' });
    }
  },

  resetBaseline: async (watchId, notes) => {
    set({ isLoading: true, error: null });
    try {
      await baselineService.resetBaseline(watchId, notes);
      await get().loadWatch(watchId);
      await get().loadWatches();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to reset baseline', isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
