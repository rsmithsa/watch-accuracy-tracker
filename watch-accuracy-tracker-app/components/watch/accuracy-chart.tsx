import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ChartDataPoint, getChartData } from '@/services/accuracyService';
import { Measurement } from '@/types/database';
import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

export type AccuracyChartProps = {
  measurements: Measurement[];
};

/** Linearly interpolate y at a given x between the surrounding data points. */
function interpolateY(points: ChartDataPoint[], x: number): number {
  if (x <= points[0].x) return points[0].y;
  if (x >= points[points.length - 1].x) return points[points.length - 1].y;
  for (let i = 0; i < points.length - 1; i++) {
    if (x >= points[i].x && x <= points[i + 1].x) {
      const t = (x - points[i].x) / (points[i + 1].x - points[i].x);
      return points[i].y + t * (points[i + 1].y - points[i].y);
    }
  }
  return points[0].y;
}

export function AccuracyChart({ measurements }: AccuracyChartProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'card');

  const chartData = getChartData(measurements);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  // Need at least 2 points to show chart
  if (chartData.points.length < 2 || !chartData.regressionLine) {
    return (
      <View style={styles.emptyContainer} onLayout={onLayout}>
        <ThemedText style={styles.emptyText}>
          Add more measurements to see drift chart
        </ThemedText>
      </View>
    );
  }

  // Wait for layout measurement before rendering chart
  if (containerWidth === 0) {
    return <View style={styles.container} onLayout={onLayout} />;
  }

  const chartWidth = containerWidth;
  const points = chartData.points;
  const { start, end } = chartData.regressionLine;

  // Regression line slope/intercept
  const slope =
    end.x - start.x !== 0 ? (end.y - start.y) / (end.x - start.x) : 0;
  const intercept = start.y - slope * start.x;

  // Create uniform time grid — each slot represents an equal time interval
  const xMin = points[0].x;
  const xMax = points[points.length - 1].x;
  const totalXRange = xMax - xMin || 1;
  const numSlots = Math.min(Math.max(points.length * 3, 10), 25);
  const gridStep = totalXRange / Math.max(numSlots - 1, 1);

  // Map each measurement to its nearest grid slot (avoid collisions)
  const slotToMeas = new Map<number, number>();
  const usedSlots = new Set<number>();
  points.forEach((p, i) => {
    let slot = Math.round((p.x - xMin) / gridStep);
    slot = Math.max(0, Math.min(slot, numSlots - 1));
    while (usedSlots.has(slot) && slot < numSlots - 1) slot++;
    slotToMeas.set(slot, i);
    usedSlots.add(slot);
  });

  // Custom data point renderers — dots only at real measurements
  const measurementDot = () => (
    <View
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: tintColor,
      }}
    />
  );
  const emptyDot = () => <View style={{ width: 0, height: 0 }} />;

  // Uniform spacing to fit all slots within chart width
  // width prop = data area only (y-axis labels are rendered outside it)
  const yAxisLabelWidth = 50;
  const initialSpacing = 10;
  const rightPadding = 10;
  const dataAreaWidth = chartWidth - yAxisLabelWidth;
  const spacing = Math.floor(
    (dataAreaWidth - initialSpacing - rightPadding) / Math.max(numSlots - 1, 1),
  );

  // Build gridded data arrays
  // Thin out labels so they don't overlap — only show a label when there's
  // enough pixel distance from the previous one.
  const minLabelPx = 32;
  const slotsPerLabel = Math.max(1, Math.ceil(minLabelPx / Math.max(spacing, 1)));
  let lastLabelSlot = -slotsPerLabel; // ensures first measurement gets a label

  const measurementData: any[] = [];
  const regressionData: any[] = [];

  for (let s = 0; s < numSlots; s++) {
    const x = xMin + s * gridStep;
    const measIdx = slotToMeas.get(s);

    const showLabel =
      measIdx != null && s - lastLabelSlot >= slotsPerLabel;
    if (showLabel) lastLabelSlot = s;

    measurementData.push({
      value: measIdx != null ? points[measIdx].y : interpolateY(points, x),
      label: showLabel ? points[measIdx!].x.toFixed(1) : '',
      day: measIdx != null ? points[measIdx].x : x,
      isMeasurement: measIdx != null,
      customDataPoint: measIdx != null ? measurementDot : emptyDot,
    });

    regressionData.push({
      value: slope * x + intercept,
    });
  }

  // Y-axis scaling — offset so axis doesn't start at 0
  const allValues = [
    ...measurementData.map((d: any) => d.value),
    ...regressionData.map((d: any) => d.value),
  ];
  const yDataMin = Math.min(...allValues);
  const yDataMax = Math.max(...allValues);
  const yRange = yDataMax - yDataMin || 1;
  const yPad = yRange * 0.15;
  const yAxisOffset = Math.floor((yDataMin - yPad) * 10) / 10;
  const maxValue = Math.ceil((yDataMax + yPad - yAxisOffset) * 10) / 10;

  return (
    <View style={styles.container} onLayout={onLayout}>
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
        labelsExtraHeight={6}
        width={dataAreaWidth}
        spacing={spacing}
        initialSpacing={initialSpacing}
        endSpacing={0}
        disableScroll
        yAxisLabelWidth={yAxisLabelWidth}
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
            if (!item || !item.isMeasurement) return null;
            const value = (item.value ?? 0) + yAxisOffset;
            const day = item.day ?? 0;
            return (
              <View
                style={[
                  styles.tooltip,
                  { backgroundColor, borderColor: tintColor },
                ]}
              >
                <ThemedText style={styles.tooltipText}>
                  Baseline +{typeof day === 'number' ? day.toFixed(2) : day} days
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
    overflow: 'hidden',
    width: '100%',
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
