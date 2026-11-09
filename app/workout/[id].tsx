import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ExercisePicker from '@/components/ExercisePicker';
import {
  addExerciseToWorkout,
  getWorkoutExercises,
  removeExerciseFromWorkout,
} from '@/services/workoutExerciseService';
import { deleteWorkout, getWorkout } from '@/services/workoutService';
import type { Exercise, WorkoutExerciseWithExercise } from '@/types';

const DEFAULT_SETS = 3;

export default function EditWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState('Edit workout');
  const [items, setItems] = useState<WorkoutExerciseWithExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Next free position, kept in a ref so quick taps in the picker can't reuse a number
  const nextPosition = useRef(0);
  const pending = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    Promise.all([getWorkout(id), getWorkoutExercises(id)])
      .then(([workout, exercises]) => {
        if (!active) return;
        setName(workout.name);
        setItems(exercises);
        nextPosition.current = exercises.reduce((max, i) => Math.max(max, i.position), -1) + 1;
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load workout.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  // Throws on failure so the picker can show the error
  async function addItem(exercise: Exercise) {
    if (pending.current.has(exercise.id) || items.some((i) => i.exercise_id === exercise.id)) {
      return;
    }
    pending.current.add(exercise.id);
    const position = nextPosition.current++;
    try {
      const saved = await addExerciseToWorkout({
        workout_id: id,
        exercise_id: exercise.id,
        position,
        target_sets: DEFAULT_SETS,
      });
      setItems((prev) => [...prev, { ...saved, exercise }]);
    } finally {
      pending.current.delete(exercise.id);
    }
  }

  async function removeItem(itemId: string) {
    setError(null);
    try {
      await removeExerciseFromWorkout(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove exercise.');
    }
  }

  async function removeWorkout() {
    setBusy(true);
    setError(null);
    try {
      await deleteWorkout(id);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete workout.');
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: name }} />

      {loading ? (
        <ActivityIndicator style={styles.center} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>Exercises</Text>
          {items.length === 0 && <Text style={styles.empty}>No exercises in this workout.</Text>}

          {items.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.exerciseName}>{item.exercise.name}</Text>
                <Text style={styles.exerciseSub}>
                  {item.exercise.muscle_target}
                  {item.target_sets ? ` · ${item.target_sets} sets` : ''}
                </Text>
              </View>
              <Pressable onPress={() => removeItem(item.id)} hitSlop={8}>
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            </View>
          ))}

          <Pressable style={styles.secondaryButton} onPress={() => setPickerOpen(true)}>
            <Text style={styles.secondaryButtonText}>+ Add exercise</Text>
          </Pressable>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.danger}>
            {confirming ? (
              <>
                <Text style={styles.confirmText}>
                  Delete this workout? Your logged history is kept.
                </Text>
                <View style={styles.confirmButtons}>
                  <Pressable
                    style={styles.cancelButton}
                    onPress={() => setConfirming(false)}
                    disabled={busy}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.deleteButton, busy && styles.disabled]}
                    onPress={removeWorkout}
                    disabled={busy}
                  >
                    {busy ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.deleteText}>Yes, delete</Text>
                    )}
                  </Pressable>
                </View>
              </>
            ) : (
              <Pressable style={styles.deleteOutline} onPress={() => setConfirming(true)}>
                <Text style={styles.deleteOutlineText}>Delete workout</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      )}

      <ExercisePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addItem}
        pickedIds={items.map((i) => i.exercise_id)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { marginTop: 40 },
  content: { padding: 20, gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#444' },
  empty: { color: '#888' },
  error: { color: '#c00' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f3f3f3',
  },
  rowInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '600' },
  exerciseSub: { color: '#666', marginTop: 2 },
  remove: { color: '#c00', fontWeight: '600' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#111',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '600' },
  danger: { marginTop: 24, gap: 12 },
  confirmText: { color: '#444' },
  confirmButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelText: { fontWeight: '600' },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#c00',
    alignItems: 'center',
  },
  deleteText: { color: '#fff', fontWeight: '600' },
  deleteOutline: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c00',
    alignItems: 'center',
  },
  deleteOutlineText: { color: '#c00', fontWeight: '600' },
  disabled: { opacity: 0.5 },
});