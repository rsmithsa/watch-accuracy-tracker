import NTPClient from 'react-native-ntp-client';
import { TimeSource } from '@/types/database';

const NTP_SERVERS = [
  'pool.ntp.org',
  'time.google.com',
  'time.cloudflare.com',
];

interface TimeResult {
  timestamp: number;
  source: TimeSource;
  serverUsed?: string;
}

let cachedNtpOffset: number | null = null;
let lastNtpSync: number = 0;
const NTP_CACHE_DURATION = 60000; // Re-sync every 60 seconds

export async function getReferenceTime(): Promise<TimeResult> {
  const now = Date.now();

  // Use cached offset if recent
  if (cachedNtpOffset !== null && (now - lastNtpSync) < NTP_CACHE_DURATION) {
    return {
      timestamp: now + cachedNtpOffset,
      source: 'ntp',
    };
  }

  // Try each NTP server
  for (const server of NTP_SERVERS) {
    try {
      const ntpTime = await NTPClient.getNetworkTime(server, 123, 5000);
      const deviceTime = Date.now();
      cachedNtpOffset = ntpTime.getTime() - deviceTime;
      lastNtpSync = deviceTime;

      return {
        timestamp: ntpTime.getTime(),
        source: 'ntp',
        serverUsed: server,
      };
    } catch (error) {
      console.warn(`NTP server ${server} failed:`, error);
      continue;
    }
  }

  // Fallback to device time
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

export function clearNtpCache(): void {
  cachedNtpOffset = null;
  lastNtpSync = 0;
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
