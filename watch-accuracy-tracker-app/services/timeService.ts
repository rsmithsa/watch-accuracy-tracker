import { TimeSource } from '@/types/database';

interface TimeResult {
  timestamp: number;
  source: TimeSource;
}

export async function getReferenceTime(): Promise<TimeResult> {
  // Device time is already NTP-synced by the OS
  return {
    timestamp: Date.now(),
    source: 'device',
  };
}

export function getDeviceTime(): TimeResult {
  return {
    timestamp: Date.now(),
    source: 'device',
  };
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

export function formatTimeShort(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}
