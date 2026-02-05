import { StyleSheet, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { AccuracyStats } from '@/types/database';
import { formatAccuracy, getAccuracyColor } from '@/services/accuracyService';

export type AccuracyDisplayProps = {
  stats: AccuracyStats | null;
  size?: 'small' | 'large';
};

export function AccuracyDisplay({ stats, size = 'small' }: AccuracyDisplayProps) {
  const goodColor = useThemeColor({}, 'accuracyGood');
  const fairColor = useThemeColor({}, 'accuracyFair');
  const poorColor = useThemeColor({}, 'accuracyPoor');
  const unknownColor = useThemeColor({}, 'accuracyUnknown');

  const colorMap = {
    good: goodColor,
    fair: fairColor,
    poor: poorColor,
    unknown: unknownColor,
  };

  const accuracyColor = colorMap[stats ? getAccuracyColor(stats.secondsPerDay) : 'unknown'];
  const displayValue = stats ? formatAccuracy(stats.secondsPerDay) : '--';

  if (size === 'large') {
    return (
      <View style={styles.largeContainer}>
        <ThemedText style={[styles.largeValue, { color: accuracyColor }]}>
          {displayValue}
        </ThemedText>
        {stats && stats.secondsPerDay !== null && (
          <ThemedText style={styles.largeLabel}>
            {stats.trend === 'gaining' ? 'running fast' : stats.trend === 'losing' ? 'running slow' : 'stable'}
          </ThemedText>
        )}
        {stats && stats.confidence !== 'high' && stats.measurementCount > 0 && (
          <ThemedText style={styles.confidenceNote}>
            {stats.confidence === 'low' ? 'More measurements needed' : `Based on ${stats.elapsedDays.toFixed(1)} days`}
          </ThemedText>
        )}
      </View>
    );
  }

  return (
    <View style={styles.smallContainer}>
      <ThemedText style={[styles.smallValue, { color: accuracyColor }]}>
        {displayValue}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  smallContainer: {
    alignItems: 'flex-end',
  },
  smallValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  largeContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  largeValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  largeLabel: {
    fontSize: 16,
    marginTop: 4,
  },
  confidenceNote: {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.7,
  },
});
