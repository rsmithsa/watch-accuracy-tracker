import { StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { WatchForm, WatchFormData } from '@/components/watch/watch-form';
import { useWatchStore } from '@/store';

export default function NewWatchScreen() {
  const { addWatch, isLoading } = useWatchStore();

  const handleSubmit = async (data: WatchFormData) => {
    try {
      const watchId = await addWatch(data);
      router.replace(`/watch/${watchId}`);
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        <WatchForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          submitLabel="Add Watch"
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
