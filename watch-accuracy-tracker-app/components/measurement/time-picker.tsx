import { StyleSheet, View, Pressable } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

export type TimePickerProps = {
  hours: number;
  minutes: number;
  onHoursChange: (hours: number) => void;
  onMinutesChange: (minutes: number) => void;
};

export function TimePicker({ hours, minutes, onHoursChange, onMinutesChange }: TimePickerProps) {
  const backgroundColor = useThemeColor({}, 'inputBackground');
  const borderColor = useThemeColor({}, 'inputBorder');
  const iconColor = useThemeColor({}, 'icon');

  const incrementHours = () => onHoursChange((hours + 1) % 24);
  const decrementHours = () => onHoursChange((hours - 1 + 24) % 24);
  const incrementMinutes = () => onMinutesChange((minutes + 1) % 60);
  const decrementMinutes = () => onMinutesChange((minutes - 1 + 60) % 60);

  return (
    <View style={styles.container}>
      <View style={[styles.pickerColumn, { backgroundColor, borderColor }]}>
        <Pressable onPress={incrementHours} style={styles.button}>
          <IconSymbol name="chevron.up" size={24} color={iconColor} />
        </Pressable>
        <ThemedText style={styles.value}>{hours.toString().padStart(2, '0')}</ThemedText>
        <Pressable onPress={decrementHours} style={styles.button}>
          <IconSymbol name="chevron.down" size={24} color={iconColor} />
        </Pressable>
      </View>

      <ThemedText style={styles.separator}>:</ThemedText>

      <View style={[styles.pickerColumn, { backgroundColor, borderColor }]}>
        <Pressable onPress={incrementMinutes} style={styles.button}>
          <IconSymbol name="chevron.up" size={24} color={iconColor} />
        </Pressable>
        <ThemedText style={styles.value}>{minutes.toString().padStart(2, '0')}</ThemedText>
        <Pressable onPress={decrementMinutes} style={styles.button}>
          <IconSymbol name="chevron.down" size={24} color={iconColor} />
        </Pressable>
      </View>

      <ThemedText style={styles.seconds}>:00</ThemedText>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  button: {
    padding: 8,
  },
  value: {
    fontSize: 36,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    minWidth: 50,
    textAlign: 'center',
  },
  separator: {
    fontSize: 36,
    fontWeight: '300',
    marginHorizontal: 8,
  },
  seconds: {
    fontSize: 36,
    fontWeight: '300',
    marginLeft: 4,
    opacity: 0.5,
  },
});
