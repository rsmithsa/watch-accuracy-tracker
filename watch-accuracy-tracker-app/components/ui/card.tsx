import { Pressable, StyleSheet, View, type ViewProps, type PressableProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

export type CardProps = ViewProps & {
  onPress?: PressableProps['onPress'];
};

export function Card({ style, onPress, children, ...rest }: CardProps) {
  const backgroundColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  const content = (
    <View style={[styles.card, { backgroundColor, borderColor }, style]} {...rest}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
});
