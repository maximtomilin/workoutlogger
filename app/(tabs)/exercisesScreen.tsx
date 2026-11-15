import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import EditExerciseModal from '@/components/EditExerciseModal';
import { getExercises } from '@/services/exerciseService';
import type { Exercise } from '@/types';

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Exercise | null>(null);

  // Tab screens stay mounted, so reload whenever the tab is focused
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getExercises()
        .then((data) => {
          if (!active) return;
          setExercises(data);
          setError(null);
        })
        .catch((e: unknown) => {
          if (active) setError(e instanceof Error ? e.message : 'Failed to load exercises');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [])
  );

  function handleSaved(updated: Exercise) {
    setExercises((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e)).sort((a, b) => a.name.localeCompare(b.name))
    );
  }

  function handleDeleted(id: string) {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }

  const query = search.trim().toLowerCase();
  const filtered = exercises.filter(
    (e) => e.name.toLowerCase().includes(query) || e.muscle_target.toLowerCase().includes(query)
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Exercises</Text>
      <Text style={styles.subtitle}>
        {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'} saved
      </Text>

      <TextInput
        style={styles.search}
        placeholder="Search by name or muscle"
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <ActivityIndicator style={styles.center} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.empty}>
              {exercises.length === 0
                ? 'No exercises yet. Create one while adding exercises to a workout.'
                : 'No exercises match your search.'}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{item.muscle_target}</Text>
              </View>
              <Pressable onPress={() => setEditing(item)} hitSlop={8}>
                <Text style={styles.edit}>Edit</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      <EditExerciseModal
        exercise={editing}
        onClose={() => setEditing(null)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#666', marginTop: 2, marginBottom: 16 },
  search: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  center: { marginTop: 40 },
  list: { gap: 10, paddingBottom: 20 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  error: { color: '#c00' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f3f3f3',
  },
  name: { flex: 1, fontSize: 16, fontWeight: '600' },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipText: { color: '#444', fontSize: 13 },
  edit: { color: '#0a84ff', fontWeight: '600' },
});