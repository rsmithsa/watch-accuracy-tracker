import { StyleSheet, ScrollView } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';

export default function SettingsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <ThemedText type="defaultSemiBold">About</ThemedText>
          <ThemedText style={styles.description}>
            Watch Accuracy Tracker helps you monitor the accuracy of your mechanical watches by comparing their time to NTP atomic time.
          </ThemedText>
        </Card>

        <Card style={styles.card}>
          <ThemedText type="defaultSemiBold">How to Use</ThemedText>
          <ThemedText style={styles.description}>
            1. Add a watch with its details{'\n'}
            2. Sync your watch to the displayed reference time{'\n'}
            3. Take measurements periodically by tapping when your watch second hand hits 12{'\n'}
            4. View accuracy stats showing seconds gained/lost per day
          </ThemedText>
        </Card>

        <Card style={styles.card}>
          <ThemedText type="defaultSemiBold">Tips</ThemedText>
          <ThemedText style={styles.description}>
            • Take measurements at consistent times (e.g., morning){'\n'}
            • More measurements over longer periods give more accurate results{'\n'}
            • Reset baseline when you manually adjust your watch time
          </ThemedText>
        </Card>

        <ThemedText style={styles.version}>Version 1.0.0</ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  description: {
    marginTop: 8,
    lineHeight: 22,
  },
  version: {
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 16,
  },
});
