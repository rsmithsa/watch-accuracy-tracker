import { StyleSheet, View, Alert, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CaptureButton } from '@/components/measurement/capture-button';
import { ReferenceTimeDisplay } from '@/components/measurement/reference-time-display';
import { TimePicker } from '@/components/measurement/time-picker';
import { useWatchStore, useTimeStore } from '@/store';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatOffset } from '@/services/accuracyService';

export default function MeasureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedWatch, measurements, addMeasurement, loadWatch } = useWatchStore();
  const { currentTime, timeSource, startTimeUpdates, syncTime } = useTimeStore();

  // Initialize time picker with current time rounded to next minute
  const now = new Date();
  const [hours, setHours] = useState(now.getHours());
  const [minutes, setMinutes] = useState((now.getMinutes() + 1) % 60);
  const [isBaseline, setIsBaseline] = useState(false);
  const [lastCapture, setLastCapture] = useState<{ deltaMs: number; source: 'ntp' | 'device' } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const primaryColor = useThemeColor({}, 'buttonPrimary');
  const iconColor = useThemeColor({}, 'icon');

  const { width, height } = useWindowDimensions();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  // Calculate available content height (screen minus header and safe areas)
  const availableHeight = height - headerHeight - insets.bottom;

  const isSmallScreen = availableHeight < 550;
  const isTinyScreen = availableHeight < 450;

  const responsiveStyles = useMemo(() => {
    const baseScale = Math.min(width / 375, availableHeight / 550, 1.2);
    const scale = isTinyScreen ? baseScale * 0.75 : isSmallScreen ? baseScale * 0.85 : baseScale;

    return {
      captureButtonSize: Math.round(150 * scale),
      timePickerScale: scale,
      sectionMargin: Math.round(24 * scale),
      resultFontSize: Math.round(32 * scale),
      padding: Math.round(16 * scale),
    };
  }, [width, availableHeight, isSmallScreen, isTinyScreen]);

  useEffect(() => {
    if (id) {
      loadWatch(id);
    }
    const cleanup = startTimeUpdates();
    return cleanup;
  }, [id]);

  const isFirstMeasurement = measurements.length === 0;

  const handleCapture = useCallback(async () => {
    if (!selectedWatch?.currentBaselinePeriod) {
      Alert.alert('Error', 'No active baseline period');
      return;
    }

    setIsCapturing(true);

    // Sync time right before capture for accuracy
    await syncTime();

    const deviceTime = useTimeStore.getState().currentTime;
    const source = useTimeStore.getState().timeSource || 'device';

    // Calculate watch time from selected hours/minutes (at :00 seconds)
    const watchDate = new Date(deviceTime);
    watchDate.setHours(hours, minutes, 0, 0);
    const watchTime = watchDate.getTime();

    // If watch time is more than 12 hours in the future, assume it was yesterday
    if (watchTime - deviceTime > 12 * 60 * 60 * 1000) {
      watchDate.setDate(watchDate.getDate() - 1);
    }
    // If watch time is more than 12 hours in the past, assume it's tomorrow
    else if (deviceTime - watchTime > 12 * 60 * 60 * 1000) {
      watchDate.setDate(watchDate.getDate() + 1);
    }

    const adjustedWatchTime = watchDate.getTime();

    // Delta = device_time - watch_time
    // Positive delta = watch is slow (device is ahead)
    // Negative delta = watch is fast (device is behind)
    const deltaMs = deviceTime - adjustedWatchTime;

    // First measurement is always a baseline
    const shouldBeBaseline = isFirstMeasurement || isBaseline;

    await addMeasurement(
      selectedWatch.currentBaselinePeriod.id,
      adjustedWatchTime,
      deviceTime,
      deltaMs,
      source,
      shouldBeBaseline
    );

    setLastCapture({ deltaMs, source });
    setIsCapturing(false);
    setIsBaseline(false); // Reset checkbox after capture
  }, [selectedWatch, measurements, addMeasurement, syncTime, hours, minutes, isFirstMeasurement, isBaseline]);

  if (!selectedWatch) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: `Measure - ${selectedWatch.name}` }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding: responsiveStyles.padding }]}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <ThemedText type="defaultSemiBold">
            {isFirstMeasurement ? 'First Measurement (Baseline)' : 'Take Measurement'}
          </ThemedText>
          <Pressable onPress={() => setShowHelp(!showHelp)} hitSlop={8}>
            <IconSymbol
              name={showHelp ? 'xmark.circle' : 'questionmark.circle'}
              size={22}
              color={iconColor}
            />
          </Pressable>
        </View>

        {showHelp && (
          <Card style={styles.instructions}>
            <ThemedText style={styles.instructionText}>
              Set the time your watch will show, then tap CAPTURE when the second hand hits 0.
            </ThemedText>
          </Card>
        )}

        <View style={[styles.section, { marginBottom: responsiveStyles.sectionMargin }]}>
          <ThemedText style={styles.label}>Watch Time (when you will capture)</ThemedText>
          <TimePicker
            hours={hours}
            minutes={minutes}
            onHoursChange={setHours}
            onMinutesChange={setMinutes}
            scale={responsiveStyles.timePickerScale}
          />
        </View>

        <View style={[styles.section, { marginBottom: responsiveStyles.sectionMargin }]}>
          <ThemedText style={styles.label}>Current Time ({timeSource === 'ntp' ? 'NTP' : 'Device'})</ThemedText>
          <ReferenceTimeDisplay time={currentTime} source={timeSource} />
        </View>

        <View style={[styles.captureArea, { marginBottom: responsiveStyles.sectionMargin }]}>
          <CaptureButton
            onCapture={handleCapture}
            isCapturing={isCapturing}
            size={responsiveStyles.captureButtonSize}
          />
        </View>

        {!isFirstMeasurement && (
          <Pressable
            style={[styles.checkboxRow, { marginBottom: responsiveStyles.sectionMargin }]}
            onPress={() => setIsBaseline(!isBaseline)}
          >
            <IconSymbol
              name={isBaseline ? 'checkmark.square' : 'square'}
              size={24}
              color={isBaseline ? primaryColor : iconColor}
            />
            <ThemedText style={styles.checkboxLabel}>
              New baseline (after resetting watch)
            </ThemedText>
          </Pressable>
        )}

        {lastCapture && (
          <Card style={styles.result}>
            <ThemedText type="defaultSemiBold">Captured!</ThemedText>
            <ThemedText style={[styles.resultValue, { fontSize: responsiveStyles.resultFontSize }]}>
              {formatOffset(lastCapture.deltaMs)}
            </ThemedText>
            <ThemedText style={styles.resultText}>
              {lastCapture.deltaMs > 0 ? 'Watch is slow' : lastCapture.deltaMs < 0 ? 'Watch is fast' : 'Perfect!'} (via {lastCapture.source === 'ntp' ? 'NTP' : 'Device'})
            </ThemedText>
          </Card>
        )}

        <ThemedText style={styles.measurementCount}>
          {measurements.length} measurement{measurements.length !== 1 ? 's' : ''} recorded
        </ThemedText>

        <Button title="Done" variant="secondary" onPress={() => router.back()} style={styles.doneButton} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructions: {
    marginBottom: 16,
  },
  instructionText: {
    lineHeight: 22,
  },
  section: {
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  captureArea: {
    alignItems: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 14,
  },
  result: {
    marginBottom: 24,
    alignItems: 'center',
  },
  resultValue: {
    fontWeight: '600',
    marginTop: 8,
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
    marginTop: 24,
  },
});
