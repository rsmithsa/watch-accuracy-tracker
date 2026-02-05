import { StyleSheet, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { TimeSource } from '@/types/database';
import { formatTime } from '@/services/timeService';
import { IconSymbol } from '@/components/ui/icon-symbol';

export type ReferenceTimeDisplayProps = {
  time: number;
  source: TimeSource | null;
};

export function ReferenceTimeDisplay({ time, source }: ReferenceTimeDisplayProps) {
  const goodColor = useThemeColor({}, 'accuracyGood');
  const fairColor = useThemeColor({}, 'accuracyFair');
  const iconColor = useThemeColor({}, 'icon');

  const sourceColor = source === 'ntp' ? goodColor : fairColor;
  const sourceLabel = source === 'ntp' ? 'NTP Time' : source === 'device' ? 'Device Time' : 'Syncing...';

  return (
    <View style={styles.container}>
      <ThemedText style={styles.time}>{formatTime(time)}</ThemedText>
      <View style={styles.sourceContainer}>
        <IconSymbol
          name={source === 'ntp' ? 'wifi' : 'clock'}
          size={14}
          color={sourceColor}
        />
        <ThemedText style={[styles.source, { color: sourceColor }]}>
          {sourceLabel}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  time: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  source: {
    fontSize: 14,
  },
});
