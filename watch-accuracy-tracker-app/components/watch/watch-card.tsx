import { StyleSheet, View } from 'react-native';
import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { AccuracyDisplay } from './accuracy-display';
import { MovementTypeBadge } from './movement-type-badge';
import { WatchWithStats } from '@/types/database';

export type WatchCardProps = {
  watch: WatchWithStats;
  onPress: () => void;
};

export function WatchCard({ watch, onPress }: WatchCardProps) {
  const stats = watch.accuracyPerDay !== null
    ? {
        secondsPerDay: watch.accuracyPerDay,
        trend: watch.accuracyPerDay > 0.5 ? 'gaining' : watch.accuracyPerDay < -0.5 ? 'losing' : 'stable',
        confidence: 'medium',
        elapsedDays: 0,
        totalDriftMs: 0,
        measurementCount: watch.measurementCount,
      } as const
    : null;

  const subtitle = [watch.brand, watch.model].filter(Boolean).join(' ');

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.info}>
          <ThemedText type="defaultSemiBold" style={styles.name}>{watch.name}</ThemedText>
          {subtitle && <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>}
        </View>
        <AccuracyDisplay stats={stats} size="small" />
      </View>
      <View style={styles.footer}>
        <MovementTypeBadge type={watch.movementType} />
        <ThemedText style={styles.measurements}>
          {watch.measurementCount} measurement{watch.measurementCount !== 1 ? 's' : ''}
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  info: {
    flex: 1,
    marginRight: 16,
  },
  name: {
    fontSize: 18,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  measurements: {
    fontSize: 12,
    opacity: 0.7,
  },
});
