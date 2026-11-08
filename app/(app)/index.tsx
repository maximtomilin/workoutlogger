import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getWorkoutsWithLastCompleted,
  type WorkoutWithLastCompleted,
} from '@/services/workoutService';

export default function HomeScreen() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<WorkoutWithLastCompleted[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reload every time the screen comes into focus (e.g. after saving a workout)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getWorkoutsWithLastCompleted()
        .then((data) => {
          if (!active) return;
          setWorkouts(data);
          setError(null);
        })
        .catch((e: unknown) => {
          if (active) setError(e instanceof Error ? e.message : 'Failed to load workouts');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Workouts</Text>

      <Pressable style={styles.primaryButton} onPress={() => router.push('/workout')}>
        <Text style={styles.primaryButtonText}>+ New workout</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator style={styles.center} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No workouts yet. Create your first one!</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSub}>
                {item.last_completed
                  ? `Last done ${new Date(item.last_completed).toLocaleDateString()}`
                  : 'Never done'}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  primaryButton: {
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  center: { marginTop: 40 },
  list: { gap: 12 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  error: { color: '#c00', marginTop: 20 },
  card: { padding: 16, borderRadius: 12, backgroundColor: '#f3f3f3' },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardSub: { color: '#666', marginTop: 4 },
});