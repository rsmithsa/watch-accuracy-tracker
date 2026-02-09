import { StyleSheet } from 'react-native';
import { useEffect, useCallback } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { MeasurementList } from '@/components/measurement/measurement-list';
import { useWatchStore } from '@/store';

export default function HistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedWatch, measurements, loadWatch, deleteMeasurement } = useWatchStore();

  const handleDelete = useCallback((measurementId: string) => {
    deleteMeasurement(measurementId);
  }, [deleteMeasurement]);

  useEffect(() => {
    if (id) {
      loadWatch(id);
    }
  }, [id]);

  if (!selectedWatch) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: `History - ${selectedWatch.name}` }} />
      <MeasurementList measurements={measurements} onDelete={handleDelete} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
