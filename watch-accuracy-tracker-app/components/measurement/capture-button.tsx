import { Pressable, StyleSheet, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import * as Haptics from 'expo-haptics';

export type CaptureButtonProps = {
  onCapture: () => void;
  isCapturing?: boolean;
  disabled?: boolean;
};

export function CaptureButton({ onCapture, isCapturing, disabled }: CaptureButtonProps) {
  const primaryColor = useThemeColor({}, 'buttonPrimary');
  const textColor = useThemeColor({}, 'buttonText');

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onCapture();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || isCapturing}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: primaryColor,
          opacity: pressed || disabled || isCapturing ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <View style={styles.content}>
        <ThemedText style={[styles.text, { color: textColor }]}>
          {isCapturing ? 'CAPTURING...' : 'CAPTURE'}
        </ThemedText>
        <ThemedText style={[styles.hint, { color: textColor }]}>
          Tap when second hand hits 12
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
});
