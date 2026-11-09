import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ExercisePicker from '@/components/ExercisePicker';
import { addExerciseToWorkout } from '@/services/workoutExerciseService';
import { createWorkout, deleteWorkout } from '@/services/workoutService';
import type { Exercise } from '@/types';

type SelectedExercise = { exercise: Exercise; targetSets: string };

export default function NewWorkoutScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<SelectedExercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addExercise(exercise: Exercise) {
    setSelected((prev) =>
      prev.some((s) => s.exercise.id === exercise.id)
        ? prev
        : [...prev, { exercise, targetSets: '3' }]
    );
  }

  function updateSets(exerciseId: string, targetSets: string) {
    setSelected((prev) =>
      prev.map((s) => (s.exercise.id === exerciseId ? { ...s, targetSets } : s))
    );
  }

  function removeExercise(exerciseId: string) {
    setSelected((prev) => prev.filter((s) => s.exercise.id !== exerciseId));
  }

  async function save() {
    if (!name.trim()) {
      setError('Give your workout a name.');
      return;
    }
    setSaving(true);
    setError(null);

    let workoutId: string | null = null;
    try {
      const workout = await createWorkout({ name: name.trim() });
      workoutId = workout.id;
      for (let i = 0; i < selected.length; i++) {
        const sets = parseInt(selected[i].targetSets, 10);
        await addExerciseToWorkout({
          workout_id: workout.id,
          exercise_id: selected[i].exercise.id,
          position: i,
          target_sets: Number.isNaN(sets) ? null : sets,
        });
      }
      router.back();
    } catch (e) {
      // Don't leave a half-created workout behind
      if (workoutId) await deleteWorkout(workoutId).catch(() => {});
      setError(e instanceof Error ? e.message : 'Could not save workout.');
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: 'New workout' }} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Upper body"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Exercises</Text>
        {selected.length === 0 && <Text style={styles.empty}>No exercises added yet.</Text>}
        {selected.map(({ exercise, targetSets }) => (
          <View key={exercise.id} style={styles.exerciseRow}>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseMuscle}>{exercise.muscle_target}</Text>
            </View>
            <TextInput
              style={styles.setsInput}
              keyboardType="number-pad"
              value={targetSets}
              onChangeText={(t) => updateSets(exercise.id, t)}
            />
            <Text style={styles.setsLabel}>sets</Text>
            <Pressable onPress={() => removeExercise(exercise.id)} hitSlop={8}>
              <Text style={styles.remove}>✕</Text>
            </Pressable>
          </View>
        ))}

        <Pressable style={styles.secondaryButton} onPress={() => setPickerOpen(true)}>
          <Text style={styles.secondaryButtonText}>+ Add exercise</Text>
        </Pressable>

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <Pressable
        style={[styles.primaryButton, saving && styles.disabled]}
        onPress={save}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Save workout</Text>
        )}
      </Pressable>

      <ExercisePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addExercise}
        pickedIds={selected.map((s) => s.exercise.id)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  empty: { color: '#888' },
  error: { color: '#c00' },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f3f3f3',
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '600' },
  exerciseMuscle: { color: '#666', marginTop: 2 },
  setsInput: {
    width: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 6,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  setsLabel: { color: '#666' },
  remove: { fontSize: 18, color: '#c00', paddingHorizontal: 4 },
  primaryButton: {
    backgroundColor: '#111',
    margin: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#111',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});