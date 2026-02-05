import { StyleSheet, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { MovementType } from '@/types/database';

export type MovementTypeBadgeProps = {
  type: MovementType;
};

const MOVEMENT_LABELS: Record<MovementType, string> = {
  automatic: 'Automatic',
  manual: 'Manual',
  quartz: 'Quartz',
};

export function MovementTypeBadge({ type }: MovementTypeBadgeProps) {
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'icon');

  return (
    <View style={[styles.badge, { borderColor }]}>
      <ThemedText style={[styles.text, { color: textColor }]}>
        {MOVEMENT_LABELS[type]}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
  },
});
