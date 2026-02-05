import { StyleSheet, View, Pressable } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

export type TimePickerProps = {
  hours: number;
  minutes: number;
  onHoursChange: (hours: number) => void;
  onMinutesChange: (minutes: number) => void;
  scale?: number;
};

export function TimePicker({ hours, minutes, onHoursChange, onMinutesChange, scale = 1 }: TimePickerProps) {
  const backgroundColor = useThemeColor({}, 'inputBackground');
  const borderColor = useThemeColor({}, 'inputBorder');
  const iconColor = useThemeColor({}, 'icon');

  const incrementHours = () => onHoursChange((hours + 1) % 24);
  const decrementHours = () => onHoursChange((hours - 1 + 24) % 24);
  const incrementMinutes = () => onMinutesChange((minutes + 1) % 60);
  const decrementMinutes = () => onMinutesChange((minutes - 1 + 60) % 60);

  const fontSize = Math.round(36 * scale);
  const lineHeight = Math.round(44 * scale);
  const iconSize = Math.round(24 * scale);
  const padding = Math.round(8 * scale);
  const horizontalPadding = Math.round(16 * scale);
  const minWidth = Math.round(50 * scale);

  return (
    <View style={styles.container}>
      <View style={[styles.pickerColumn, { backgroundColor, borderColor, paddingHorizontal: horizontalPadding, paddingVertical: padding }]}>
        <Pressable onPress={incrementHours} style={[styles.button, { padding }]}>
          <IconSymbol name="chevron.up" size={iconSize} color={iconColor} />
        </Pressable>
        <ThemedText style={[styles.value, { fontSize, lineHeight, minWidth }]}>{hours.toString().padStart(2, '0')}</ThemedText>
        <Pressable onPress={decrementHours} style={[styles.button, { padding }]}>
          <IconSymbol name="chevron.down" size={iconSize} color={iconColor} />
        </Pressable>
      </View>

      <ThemedText style={[styles.separator, { fontSize, lineHeight }]}>:</ThemedText>

      <View style={[styles.pickerColumn, { backgroundColor, borderColor, paddingHorizontal: horizontalPadding, paddingVertical: padding }]}>
        <Pressable onPress={incrementMinutes} style={[styles.button, { padding }]}>
          <IconSymbol name="chevron.up" size={iconSize} color={iconColor} />
        </Pressable>
        <ThemedText style={[styles.value, { fontSize, lineHeight, minWidth }]}>{minutes.toString().padStart(2, '0')}</ThemedText>
        <Pressable onPress={decrementMinutes} style={[styles.button, { padding }]}>
          <IconSymbol name="chevron.down" size={iconSize} color={iconColor} />
        </Pressable>
      </View>

      <ThemedText style={[styles.seconds, { fontSize, lineHeight }]}>:00</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerColumn: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  button: {},
  value: {
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  separator: {
    fontWeight: '300',
    marginHorizontal: 8,
  },
  seconds: {
    fontWeight: '300',
    marginLeft: 4,
    opacity: 0.5,
  },
});
