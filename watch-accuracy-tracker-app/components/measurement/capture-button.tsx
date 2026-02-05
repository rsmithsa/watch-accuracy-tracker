import { Pressable, StyleSheet, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import * as Haptics from 'expo-haptics';

export type CaptureButtonProps = {
  onCapture: () => void;
  isCapturing?: boolean;
  disabled?: boolean;
  size?: number;
};

export function CaptureButton({ onCapture, isCapturing, disabled, size = 150 }: CaptureButtonProps) {
  const primaryColor = useThemeColor({}, 'buttonPrimary');
  const textColor = useThemeColor({}, 'buttonText');

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onCapture();
  };

  const scale = size / 150;
  const fontSize = Math.round(18 * scale);
  const hintSize = Math.round(10 * scale);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || isCapturing}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: primaryColor,
          opacity: pressed || disabled || isCapturing ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <View style={styles.content}>
        <ThemedText style={[styles.text, { color: textColor, fontSize }]}>
          {isCapturing ? 'CAPTURING...' : 'CAPTURE'}
        </ThemedText>
        <ThemedText style={[styles.hint, { color: textColor, fontSize: hintSize }]}>
          Tap when second hand hits 12
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  content: {
    alignItems: 'center',
  },
  text: {
    fontWeight: 'bold',
  },
  hint: {
    marginTop: 6,
    textAlign: 'center',
    opacity: 0.8,
  },
});
