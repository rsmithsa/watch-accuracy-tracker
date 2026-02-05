import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { getDatabase } from '@/services/database';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    getDatabase().then(() => setIsDbReady(true));
  }, []);

  if (!isDbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="watch/new" options={{ presentation: 'modal', title: 'Add Watch' }} />
        <Stack.Screen name="watch/[id]" options={{ title: 'Watch Details' }} />
        <Stack.Screen name="watch/[id]/edit" options={{ presentation: 'modal', title: 'Edit Watch' }} />
        <Stack.Screen name="watch/[id]/measure" options={{ title: 'Measure Time' }} />
        <Stack.Screen name="watch/[id]/history" options={{ title: 'History' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
