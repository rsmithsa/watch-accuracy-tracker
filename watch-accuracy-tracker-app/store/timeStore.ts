import { create } from 'zustand';
import { getReferenceTime } from '@/services/timeService';
import { TimeSource } from '@/types/database';

interface TimeState {
  currentTime: number;
  timeSource: TimeSource | null;
  lastSync: number | null;
  isSyncing: boolean;
  error: string | null;

  syncTime: () => Promise<void>;
  startTimeUpdates: () => () => void;
}

export const useTimeStore = create<TimeState>((set, get) => ({
  currentTime: Date.now(),
  timeSource: null,
  lastSync: null,
  isSyncing: false,
  error: null,

  syncTime: async () => {
    set({ isSyncing: true, error: null });
    try {
      const result = await getReferenceTime();
      set({
        currentTime: result.timestamp,
        timeSource: result.source,
        lastSync: Date.now(),
        isSyncing: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to sync time',
        isSyncing: false,
        timeSource: 'device',
        currentTime: Date.now(),
      });
    }
  },

  startTimeUpdates: () => {
    // Initial sync
    get().syncTime();

    // Update display every 100ms for smooth updates
    const displayInterval = setInterval(() => {
      set((state) => ({
        currentTime: state.currentTime + 100,
      }));
    }, 100);

    // Re-sync periodically to prevent drift
    const syncInterval = setInterval(() => {
      get().syncTime();
    }, 60000);

    // Return cleanup function
    return () => {
      clearInterval(displayInterval);
      clearInterval(syncInterval);
    };
  },
}));
