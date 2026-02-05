export type MovementType = 'automatic' | 'manual' | 'quartz';
export type TimeSource = 'ntp' | 'device';

export interface Watch {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  movementType: MovementType;
  createdAt: number;
  updatedAt: number;
}

export interface BaselinePeriod {
  id: string;
  watchId: string;
  startedAt: number;
  endedAt: number | null;
  notes: string | null;
}

export interface Measurement {
  id: string;
  baselinePeriodId: string;
  watchTime: number;      // User-selected time (HH:MM:00) as timestamp
  deviceTime: number;     // Actual atomic/device time at capture
  deltaMs: number;        // device_time - watch_time (+ = watch slow, - = watch fast)
  timeSource: TimeSource;
  isBaseline: boolean;    // true = baseline measurement
  createdAt: number;
}

export interface WatchWithStats extends Watch {
  currentBaselinePeriod: BaselinePeriod | null;
  measurementCount: number;
  latestOffset: number | null;
  accuracyPerDay: number | null;
}

export interface AccuracyStats {
  secondsPerDay: number | null;
  trend: 'gaining' | 'losing' | 'stable' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  elapsedDays: number;
  totalDriftMs: number;
  measurementCount: number;
}
