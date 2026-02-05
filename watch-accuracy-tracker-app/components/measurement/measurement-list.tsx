import { StyleSheet, View, FlatList } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Measurement } from '@/types/database';
import { formatOffset } from '@/services/accuracyService';
import { formatTimeShort } from '@/services/timeService';

export type MeasurementListProps = {
  measurements: Measurement[];
};

export function MeasurementList({ measurements }: MeasurementListProps) {
  const primaryColor = useThemeColor({}, 'buttonPrimary');

  if (measurements.length === 0) {
    return (
      <View style={styles.empty}>
        <ThemedText style={styles.emptyText}>No measurements yet</ThemedText>
        <ThemedText style={styles.emptyHint}>
          Take your first measurement to start tracking accuracy
        </ThemedText>
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: Measurement; index: number }) => {
    const watchDate = new Date(item.watchTime);
    const deviceDate = new Date(item.deviceTime);
    const dateStr = deviceDate.toLocaleDateString();
    const watchTimeStr = formatTimeShort(item.watchTime);
    const deviceTimeStr = formatTimeShort(item.deviceTime);

    return (
      <Card style={styles.item}>
        <View style={styles.itemHeader}>
          <View style={styles.itemHeaderLeft}>
            <ThemedText style={styles.itemNumber}>#{measurements.length - index}</ThemedText>
            {item.isBaseline && (
              <View style={[styles.baselineBadge, { backgroundColor: primaryColor }]}>
                <ThemedText style={styles.baselineText}>BASELINE</ThemedText>
              </View>
            )}
          </View>
          <ThemedText style={styles.itemDelta}>{formatOffset(item.deltaMs)}</ThemedText>
        </View>
        <View style={styles.itemDetails}>
          <View style={styles.timesRow}>
            <View style={styles.timeColumn}>
              <ThemedText style={styles.timeLabel}>Watch</ThemedText>
              <ThemedText style={styles.timeValue}>{watchTimeStr}</ThemedText>
            </View>
            <View style={styles.timeColumn}>
              <ThemedText style={styles.timeLabel}>Actual</ThemedText>
              <ThemedText style={styles.timeValue}>{deviceTimeStr}</ThemedText>
            </View>
          </View>
          <View style={styles.metaRow}>
            <ThemedText style={styles.itemDate}>{dateStr}</ThemedText>
            <ThemedText style={styles.itemSource}>
              via {item.timeSource === 'ntp' ? 'NTP' : 'Device'}
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <FlatList
      data={[...measurements].reverse()}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
    textAlign: 'center',
  },
  item: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemNumber: {
    fontSize: 14,
    opacity: 0.5,
  },
  baselineBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  baselineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  itemDelta: {
    fontSize: 20,
    fontWeight: '600',
  },
  itemDetails: {
    gap: 8,
  },
  timesRow: {
    flexDirection: 'row',
    gap: 24,
  },
  timeColumn: {
    alignItems: 'flex-start',
  },
  timeLabel: {
    fontSize: 11,
    opacity: 0.5,
    textTransform: 'uppercase',
  },
  timeValue: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemDate: {
    fontSize: 13,
    opacity: 0.6,
  },
  itemSource: {
    fontSize: 12,
    opacity: 0.5,
  },
});
