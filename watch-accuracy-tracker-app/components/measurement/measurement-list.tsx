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
  const borderColor = useThemeColor({}, 'border');

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
    const date = new Date(item.referenceTime);
    const dateStr = date.toLocaleDateString();
    const timeStr = formatTimeShort(item.referenceTime);

    return (
      <Card style={styles.item}>
        <View style={styles.itemHeader}>
          <ThemedText style={styles.itemNumber}>#{measurements.length - index}</ThemedText>
          <ThemedText style={styles.itemOffset}>{formatOffset(item.offsetMs)}</ThemedText>
        </View>
        <View style={styles.itemDetails}>
          <ThemedText style={styles.itemDate}>{dateStr} at {timeStr}</ThemedText>
          <ThemedText style={styles.itemSource}>
            via {item.timeSource === 'ntp' ? 'NTP' : 'Device'}
          </ThemedText>
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
    marginBottom: 8,
  },
  itemNumber: {
    fontSize: 14,
    opacity: 0.5,
  },
  itemOffset: {
    fontSize: 18,
    fontWeight: '600',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  itemSource: {
    fontSize: 12,
    opacity: 0.5,
  },
});
