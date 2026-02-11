import { StyleSheet, ScrollView, View, Alert, useWindowDimensions, Pressable } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AccuracyDisplay } from '@/components/watch/accuracy-display';
import { AccuracyChart } from '@/components/watch/accuracy-chart';
import { MovementTypeBadge } from '@/components/watch/movement-type-badge';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useWatchStore } from '@/store';
import { calculateAccuracy } from '@/services/accuracyService';

export default function WatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedWatch, measurements, isLoading, loadWatch, deleteWatch } = useWatchStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const iconColor = useThemeColor({}, 'icon');

  const { width, height } = useWindowDimensions();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const availableHeight = height - headerHeight - insets.bottom;
  const isSmallScreen = availableHeight < 500;

  const responsiveStyles = useMemo(() => {
    const baseScale = Math.min(width / 375, availableHeight / 600, 1.2);
    const scale = isSmallScreen ? baseScale * 0.85 : baseScale;

    return {
      padding: Math.round(16 * scale),
      titleSize: Math.round(24 * scale),
      subtitleSize: Math.round(16 * scale),
      cardMargin: Math.round(16 * scale),
      sectionMargin: Math.round(24 * scale),
      buttonGap: Math.round(12 * scale),
    };
  }, [width, availableHeight, isSmallScreen]);

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
      <ScrollView
        contentContainerStyle={[styles.content, { padding: responsiveStyles.padding }]}
        showsVerticalScrollIndicator={true}
      >
        <Card style={[styles.header, { marginBottom: responsiveStyles.cardMargin }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerInfo}>
              <ThemedText type="title" style={[styles.name, { fontSize: responsiveStyles.titleSize }]}>
                {selectedWatch.name}
              </ThemedText>
              {subtitle && (
                <ThemedText style={[styles.subtitle, { fontSize: responsiveStyles.subtitleSize }]}>
                  {subtitle}
                </ThemedText>
              )}
            </View>
            <MovementTypeBadge type={selectedWatch.movementType} />
          </View>
        </Card>

        <Card style={[styles.accuracyCard, { marginBottom: responsiveStyles.cardMargin }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Accuracy</ThemedText>
          <AccuracyDisplay stats={stats} size="large" />
          <ThemedText style={styles.measurementInfo}>
            {measurements.length} measurement{measurements.length !== 1 ? 's' : ''} in current period
          </ThemedText>
        </Card>

        {measurements.length >= 2 && (
          <Card style={[styles.chartCard, { marginBottom: responsiveStyles.sectionMargin }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Drift Over Time</ThemedText>
            <AccuracyChart measurements={measurements} />
          </Card>
        )}

        <View style={[styles.actions, { marginBottom: responsiveStyles.sectionMargin }]}>
          <Button title="Measure Time" onPress={handleMeasure} style={[styles.primaryAction, { marginBottom: responsiveStyles.buttonGap }]} />
          <View style={[styles.secondaryActions, { gap: responsiveStyles.buttonGap }]}>
            <Button title="History" variant="secondary" onPress={handleHistory} style={styles.action} />
            <Button title="Edit" variant="secondary" onPress={handleEdit} style={styles.action} />
          </View>
        </View>

        <Card style={[styles.advancedCard, { marginBottom: responsiveStyles.sectionMargin }]}>
          <Pressable onPress={() => setShowAdvanced(!showAdvanced)} style={styles.advancedHeader}>
            <ThemedText type="defaultSemiBold">Advanced</ThemedText>
            <IconSymbol
              name={showAdvanced ? 'chevron.up' : 'chevron.down'}
              size={20}
              color={iconColor}
            />
          </Pressable>
          {showAdvanced && (
            <Button
              title="Delete Watch"
              variant="danger"
              onPress={handleDelete}
              style={styles.advancedAction}
            />
          )}
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
    paddingBottom: 32,
  },
  header: {},
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
    marginRight: 16,
  },
  name: {},
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  accuracyCard: {
    alignItems: 'center',
  },
  chartCard: {},
  sectionTitle: {
    marginBottom: 8,
  },
  measurementInfo: {
    marginTop: 16,
    opacity: 0.7,
  },
  actions: {},
  primaryAction: {},
  secondaryActions: {
    flexDirection: 'row',
  },
  action: {
    flex: 1,
  },
  advancedCard: {},
  advancedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  advancedAction: {
    marginTop: 12,
  },
});
