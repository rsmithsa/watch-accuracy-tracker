import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getChartData } from '@/services/accuracyService';
import { Measurement } from '@/types/database';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

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

  // Chart dimensions
  const chartWidth = width - 64;
  const chartHeight = 200;

  // Data
  const measurementData = chartData.points.map(p => p.y);
  const xValues = chartData.points.map(p => p.x);

  // Calculate regression values at each measurement x-position
  const { start, end } = chartData.regressionLine;
  const slope = (end.x - start.x) !== 0
    ? (end.y - start.y) / (end.x - start.x)
    : 0;
  const intercept = start.y - slope * start.x;
  const regressionData = xValues.map(x => slope * x + intercept);

  // Prepare labels (show first and last x values)
  const labels = chartData.points.map((p, i) =>
    i === 0 || i === chartData.points.length - 1 ? p.x.toFixed(1) : ''
  );

  const datasets = [
    {
      data: measurementData,
      color: () => 'transparent', // Hide connecting line between measurements
      strokeWidth: 0,
    },
    {
      data: regressionData,
      color: () => tintColor,
      strokeWidth: 2,
      withDots: false, // No dots on regression line
    },
  ];

  return (
    <View style={styles.container}>
      <LineChart
        data={{
          labels,
          datasets,
        }}
        width={chartWidth}
        height={chartHeight}
        chartConfig={{
          backgroundColor,
          backgroundGradientFrom: backgroundColor,
          backgroundGradientTo: backgroundColor,
          decimalPlaces: 1,
          color: () => textColor,
          labelColor: () => `${textColor}99`,
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: `${textColor}20`,
          },
          propsForDots: {
            r: '5',
            fill: tintColor,
          },
        }}
        bezier={false}
        withDots={true}
        withShadow={false}
        withInnerLines={true}
        withOuterLines={true}
        style={styles.chart}
        yAxisSuffix="s"
        formatYLabel={(value) => parseFloat(value).toFixed(1)}
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
  chart: {
    marginVertical: 8,
    borderRadius: 8,
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
});
