import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { useCallback } from 'react';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { WatchCard } from '@/components/watch/watch-card';
import { useWatchStore } from '@/store';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function WatchListScreen() {
  const { watches, isLoading, loadWatches } = useWatchStore();
  const primaryColor = useThemeColor({}, 'buttonPrimary');

  useFocusEffect(
    useCallback(() => {
      loadWatches();
    }, [loadWatches])
  );

  const handleAddWatch = () => {
    router.push('/watch/new');
  };

  const handleWatchPress = (watchId: string) => {
    router.push(`/watch/${watchId}`);
  };

  return (
    <ThemedView style={styles.container}>
      {watches.length === 0 && !isLoading ? (
        <View style={styles.empty}>
          <IconSymbol name="clock" size={64} color={primaryColor} />
          <ThemedText style={styles.emptyTitle}>No watches yet</ThemedText>
          <ThemedText style={styles.emptyHint}>
            Add your first watch to start tracking its accuracy
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={watches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WatchCard watch={item} onPress={() => handleWatchPress(item.id)} />
          )}
          contentContainerStyle={styles.list}
          onRefresh={loadWatches}
          refreshing={isLoading}
        />
      )}

      <Pressable
        style={[styles.fab, { backgroundColor: primaryColor }]}
        onPress={handleAddWatch}
      >
        <IconSymbol name="plus" size={24} color="#fff" />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyHint: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
