import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getChartData } from '@/services/accuracyService';
import { Measurement } from '@/types/database';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

export type AccuracyChartProps = {
  measurements: Measurement[];
};

export function AccuracyChart({ measurements }: AccuracyChartProps) {
  const { width } = useWindowDimensions();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'card');

  const chartData = getChartData(measurements);

  // Need at least 2 points to show chart
  if (chartData.points.length < 2 || !chartData.regressionLine) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>
          Add more measurements to see drift chart
        </ThemedText>
      </View>
    );
  }

  const chartWidth = width - 64;
  const points = chartData.points;
  const { start, end } = chartData.regressionLine;

  // Regression line slope/intercept
  const slope =
    end.x - start.x !== 0 ? (end.y - start.y) / (end.x - start.x) : 0;
  const intercept = start.y - slope * start.x;

  // Build data arrays for gifted-charts (raw values, library handles yAxisOffset)
  const measurementData = points.map((p, i) => ({
    value: p.y,
    label: i === 0 || i === points.length - 1 ? p.x.toFixed(1) : '',
    day: p.x,
  }));

  const regressionData = points.map(p => ({
    value: slope * p.x + intercept,
  }));

  // Y-axis scaling — offset so axis doesn't start at 0
  const allValues = [
    ...points.map(p => p.y),
    ...points.map(p => slope * p.x + intercept),
  ];
  const yDataMin = Math.min(...allValues);
  const yDataMax = Math.max(...allValues);
  const yRange = yDataMax - yDataMin || 1;
  const yPad = yRange * 0.15;
  const yAxisOffset = Math.floor((yDataMin - yPad) * 10) / 10;
  const maxValue = Math.ceil((yDataMax + yPad) * 10) / 10;

  // Spacing to fit all points within chart width
  const yAxisLabelWidth = 50;
  const edgeSpacing = 15;
  const availableWidth = chartWidth - yAxisLabelWidth - edgeSpacing * 2;
  const spacing = Math.max(
    Math.floor(availableWidth / Math.max(points.length - 1, 1)),
    20,
  );

  return (
    <View style={styles.container}>
      <LineChart
        dataSet={[
          {
            data: measurementData,
            color: tintColor,
            thickness: 1,
            strokeDashArray: [4, 3],
            hideDataPoints: false,
            dataPointsRadius: 5,
            dataPointsColor: tintColor,
          },
          {
            data: regressionData,
            color: tintColor,
            thickness: 2,
            hideDataPoints: true,
          },
        ]}
        height={180}
        spacing={spacing}
        initialSpacing={edgeSpacing}
        endSpacing={edgeSpacing}
        disableScroll
        noOfSections={4}
        yAxisOffset={yAxisOffset}
        maxValue={maxValue}
        yAxisTextStyle={{ color: `${textColor}99`, fontSize: 11 }}
        xAxisLabelTextStyle={{ color: `${textColor}99`, fontSize: 11 }}
        rulesColor={`${textColor}20`}
        rulesType="solid"
        yAxisColor={`${textColor}20`}
        xAxisColor={`${textColor}20`}
        formatYLabel={(label: string) => `${parseFloat(label).toFixed(1)}s`}
        backgroundColor="transparent"
        pointerConfig={{
          pointerStripHeight: 160,
          pointerStripColor: `${textColor}30`,
          pointerStripWidth: 1,
          pointerColor: tintColor,
          radius: 6,
          pointerLabelWidth: 140,
          pointerLabelHeight: 60,
          autoAdjustPointerLabelPosition: true,
          pointerVanishDelay: 5000,
          pointerLabelComponent: (items: any[]) => {
            const item = items[0];
            if (!item) return null;
            const value = item.value ?? 0;
            const day = item.day ?? 0;
            return (
              <View
                style={[
                  styles.tooltip,
                  { backgroundColor, borderColor: tintColor },
                ]}
              >
                <ThemedText style={styles.tooltipText}>
                  Day {typeof day === 'number' ? day.toFixed(2) : day}
                </ThemedText>
                <ThemedText style={[styles.tooltipText, styles.tooltipValue]}>
                  {value >= 0 ? '+' : ''}
                  {value.toFixed(1)} s/day
                </ThemedText>
              </View>
            );
          },
        }}
      />
      <View style={styles.axisLabels}>
        <ThemedText style={styles.axisLabel}>Days since baseline</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  axisLabels: {
    alignItems: 'center',
    marginTop: 4,
  },
  axisLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  tooltip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  tooltipText: {
    fontSize: 12,
    textAlign: 'center',
  },
  tooltipValue: {
    fontWeight: '600',
  },
});
