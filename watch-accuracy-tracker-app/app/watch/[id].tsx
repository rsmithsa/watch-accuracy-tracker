import { StyleSheet, ScrollView, View, Alert } from 'react-native';
import { useEffect } from 'react';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AccuracyDisplay } from '@/components/watch/accuracy-display';
import { MovementTypeBadge } from '@/components/watch/movement-type-badge';
import { useWatchStore } from '@/store';
import { calculateAccuracy } from '@/services/accuracyService';

export default function WatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedWatch, measurements, isLoading, loadWatch, resetBaseline, deleteWatch } = useWatchStore();

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

  const stats = calculateAccuracy(measurements);
  const subtitle = [selectedWatch.brand, selectedWatch.model].filter(Boolean).join(' ');

  const handleMeasure = () => {
    router.push(`/watch/${id}/measure`);
  };

  const handleHistory = () => {
    router.push(`/watch/${id}/history`);
  };

  const handleEdit = () => {
    router.push(`/watch/${id}/edit`);
  };

  const handleResetBaseline = () => {
    Alert.alert(
      'Reset Baseline',
      'This will archive current measurements and start a new tracking period. You should sync your watch to the reference time after this.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            resetBaseline(id!);
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Watch',
      'This will permanently delete this watch and all its measurement history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteWatch(id!);
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: selectedWatch.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerInfo}>
              <ThemedText type="title" style={styles.name}>{selectedWatch.name}</ThemedText>
              {subtitle && <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>}
            </View>
            <MovementTypeBadge type={selectedWatch.movementType} />
          </View>
        </Card>

        <Card style={styles.accuracyCard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Accuracy</ThemedText>
          <AccuracyDisplay stats={stats} size="large" />
          <ThemedText style={styles.measurementInfo}>
            {measurements.length} measurement{measurements.length !== 1 ? 's' : ''} in current period
          </ThemedText>
        </Card>

        <View style={styles.actions}>
          <Button title="Measure Time" onPress={handleMeasure} style={styles.primaryAction} />
          <View style={styles.secondaryActions}>
            <Button title="History" variant="secondary" onPress={handleHistory} style={styles.action} />
            <Button title="Edit" variant="secondary" onPress={handleEdit} style={styles.action} />
          </View>
        </View>

        <Card style={styles.advancedCard}>
          <ThemedText type="defaultSemiBold">Advanced</ThemedText>
          <Button
            title="Reset Baseline"
            variant="secondary"
            onPress={handleResetBaseline}
            style={styles.advancedAction}
          />
          <ThemedText style={styles.advancedHint}>
            Reset when you manually adjust your watch time
          </ThemedText>
          <Button
            title="Delete Watch"
            variant="danger"
            onPress={handleDelete}
            style={styles.advancedAction}
          />
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
    marginRight: 16,
  },
  name: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  accuracyCard: {
    marginBottom: 24,
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: 8,
  },
  measurementInfo: {
    marginTop: 16,
    opacity: 0.7,
  },
  actions: {
    marginBottom: 24,
  },
  primaryAction: {
    marginBottom: 12,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  action: {
    flex: 1,
  },
  advancedCard: {
    marginBottom: 24,
  },
  advancedAction: {
    marginTop: 12,
  },
  advancedHint: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
});
