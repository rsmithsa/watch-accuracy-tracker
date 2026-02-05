import { StyleSheet, ScrollView } from 'react-native';
import { useEffect } from 'react';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { WatchForm, WatchFormData } from '@/components/watch/watch-form';
import { useWatchStore } from '@/store';

export default function EditWatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedWatch, isLoading, loadWatch, updateWatch } = useWatchStore();

  useEffect(() => {
    if (id) {
      loadWatch(id);
    }
  }, [id]);

  const handleSubmit = async (data: WatchFormData) => {
    if (!id) return;
    await updateWatch(id, data);
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  if (!selectedWatch) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: `Edit ${selectedWatch.name}` }} />
      <ScrollView>
        <WatchForm
          initialData={{
            name: selectedWatch.name,
            brand: selectedWatch.brand || '',
            model: selectedWatch.model || '',
            movementType: selectedWatch.movementType,
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          submitLabel="Save Changes"
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
