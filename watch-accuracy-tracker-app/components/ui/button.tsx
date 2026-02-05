import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';

export type ButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function Button({ title, variant = 'primary', style, disabled, ...rest }: ButtonProps) {
  const primaryBg = useThemeColor({}, 'buttonPrimary');
  const primaryText = useThemeColor({}, 'buttonText');
  const secondaryBg = useThemeColor({}, 'card');
  const secondaryText = useThemeColor({}, 'text');
  const dangerBg = useThemeColor({}, 'accuracyPoor');

  const backgroundColor = variant === 'primary' ? primaryBg : variant === 'danger' ? dangerBg : secondaryBg;
  const textColor = variant === 'secondary' ? secondaryText : primaryText;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, opacity: pressed || disabled ? 0.7 : 1 },
        style,
      ]}
      disabled={disabled}
      {...rest}
    >
      <ThemedText style={[styles.text, { color: textColor }]}>{title}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
