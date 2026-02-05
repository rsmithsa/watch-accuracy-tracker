import { StyleSheet, View, Alert } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CaptureButton } from '@/components/measurement/capture-button';
import { ReferenceTimeDisplay } from '@/components/measurement/reference-time-display';
import { useWatchStore, useTimeStore } from '@/store';

export default function MeasureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedWatch, measurements, addMeasurement, loadWatch } = useWatchStore();
  const { currentTime, timeSource, startTimeUpdates, syncTime } = useTimeStore();
  const [lastCapture, setLastCapture] = useState<{ offsetMs: number; source: 'ntp' | 'device' } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (id) {
      loadWatch(id);
    }
    const cleanup = startTimeUpdates();
    return cleanup;
  }, [id]);

  const handleCapture = useCallback(async () => {
    if (!selectedWatch?.currentBaselinePeriod) {
      Alert.alert('Error', 'No active baseline period');
      return;
    }

    setIsCapturing(true);

    // Sync time right before capture for accuracy
    await syncTime();

    const referenceTime = useTimeStore.getState().currentTime;
    const source = useTimeStore.getState().timeSource || 'device';

    // Calculate offset: first measurement is baseline (offset 0)
    // Subsequent measurements record the reference time when user taps
    // The drift is calculated by comparing reference times between measurements
    const offsetMs = 0;

    await addMeasurement(
      selectedWatch.currentBaselinePeriod.id,
      referenceTime,
      offsetMs,
      source
    );

    setLastCapture({ offsetMs, source });
    setIsCapturing(false);
  }, [selectedWatch, measurements, addMeasurement, syncTime]);

  if (!selectedWatch) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  const isFirstMeasurement = measurements.length === 0;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: `Measure - ${selectedWatch.name}` }} />

      <View style={styles.content}>
        <Card style={styles.instructions}>
          {isFirstMeasurement ? (
            <>
              <ThemedText type="defaultSemiBold">First Measurement (Baseline)</ThemedText>
              <ThemedText style={styles.instructionText}>
                Sync your watch to the reference time shown below, then tap CAPTURE when your watch second hand hits 12.
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText type="defaultSemiBold">Take Measurement</ThemedText>
              <ThemedText style={styles.instructionText}>
                Tap CAPTURE when your watch second hand hits 12. The app will record any drift from the reference time.
              </ThemedText>
            </>
          )}
        </Card>

        <View style={styles.timeDisplay}>
          <ThemedText style={styles.label}>Reference Time</ThemedText>
          <ReferenceTimeDisplay time={currentTime} source={timeSource} />
        </View>

        <View style={styles.captureArea}>
          <CaptureButton onCapture={handleCapture} isCapturing={isCapturing} />
        </View>

        {lastCapture && (
          <Card style={styles.result}>
            <ThemedText type="defaultSemiBold">Captured!</ThemedText>
            <ThemedText style={styles.resultText}>
              Measurement recorded via {lastCapture.source === 'ntp' ? 'NTP' : 'Device'} time
            </ThemedText>
          </Card>
        )}

        <ThemedText style={styles.measurementCount}>
          {measurements.length} measurement{measurements.length !== 1 ? 's' : ''} recorded
        </ThemedText>

        <Button title="Done" variant="secondary" onPress={() => router.back()} style={styles.doneButton} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  instructions: {
    marginBottom: 24,
  },
  instructionText: {
    marginTop: 8,
    lineHeight: 22,
  },
  timeDisplay: {
    alignItems: 'center',
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
  },
  captureArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  result: {
    marginBottom: 24,
    alignItems: 'center',
  },
  resultText: {
    marginTop: 4,
    opacity: 0.7,
  },
  measurementCount: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 16,
  },
  doneButton: {
    marginTop: 'auto',
  },
});
