import { create } from 'zustand';
import { Watch, WatchWithStats, Measurement, MovementType } from '@/types/database';
import * as watchService from '@/services/database/watches';
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
  addMeasurement: (watchId: string, watchTime: number, deviceTime: number, deltaMs: number, timeSource: 'ntp' | 'device', isBaseline: boolean) => Promise<void>;
  deleteMeasurement: (measurementId: string) => Promise<void>;
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
          const measurements = await measurementService.getMeasurements(watch.id);
          let latestOffset: number | null = null;
          let accuracyPerDay: number | null = null;

          if (measurements.length > 0) {
            latestOffset = measurements[measurements.length - 1].deltaMs;
            const accuracy = calculateAccuracy(measurements);
            accuracyPerDay = accuracy.secondsPerDay;
          }

          return {
            ...watch,
            measurementCount: measurements.length,
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

      const measurements = await measurementService.getMeasurements(watch.id);
      let latestOffset: number | null = null;
      let accuracyPerDay: number | null = null;

      if (measurements.length > 0) {
        latestOffset = measurements[measurements.length - 1].deltaMs;
        const accuracy = calculateAccuracy(measurements);
        accuracyPerDay = accuracy.secondsPerDay;
      }

      set({
        selectedWatch: {
          ...watch,
          measurementCount: measurements.length,
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

  addMeasurement: async (watchId, watchTime, deviceTime, deltaMs, timeSource, isBaseline) => {
    try {
      await measurementService.createMeasurement({
        watchId,
        watchTime,
        deviceTime,
        deltaMs,
        timeSource,
        isBaseline,
      });
      // Reload watch to update stats and measurements
      await get().loadWatch(watchId);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to add measurement' });
    }
  },

  deleteMeasurement: async (measurementId) => {
    try {
      await measurementService.deleteMeasurement(measurementId);
      // Reload watch to update stats and measurements
      const watch = get().selectedWatch;
      if (watch) {
        await get().loadWatch(watch.id);
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete measurement' });
    }
  },

  clearError: () => set({ error: null }),
}));
