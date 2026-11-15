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
import { parseRepRange } from '@/types/repRange';
import type { Exercise } from '@/types';

type SelectedExercise = {
  exercise: Exercise;
  targetSets: string;
  repMin: string;
  repMax: string;
};

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
        : [...prev, { exercise, targetSets: '3', repMin: '', repMax: '' }]
    );
  }

  function updateField(
    exerciseId: string,
    changes: Partial<Omit<SelectedExercise, 'exercise'>>
  ) {
    setSelected((prev) =>
      prev.map((s) => (s.exercise.id === exerciseId ? { ...s, ...changes } : s))
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

    // Validate every rep range before anything is saved
    const ranges: { repMin: number | null; repMax: number | null }[] = [];
    for (const s of selected) {
      const range = parseRepRange(s.repMin, s.repMax);
      if (range.error !== null) {
        setError(`${s.exercise.name}: ${range.error}`);
        return;
      }
      ranges.push({ repMin: range.repMin, repMax: range.repMax });
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
          rep_min: ranges[i].repMin,
          rep_max: ranges[i].repMax,
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
        <Text style={styles.help}>
          The rep range is optional. If you hit the top of it on your last set, the app suggests
          going up in weight next time.
        </Text>
        {selected.length === 0 && <Text style={styles.empty}>No exercises added yet.</Text>}
        {selected.map(({ exercise, targetSets, repMin, repMax }) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseTop}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMuscle}>{exercise.muscle_target}</Text>
              </View>
              <Pressable onPress={() => removeExercise(exercise.id)} hitSlop={8}>
                <Text style={styles.remove}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.fieldsRow}>
              <TextInput
                style={styles.smallInput}
                keyboardType="number-pad"
                value={targetSets}
                onChangeText={(t) => updateField(exercise.id, { targetSets: t })}
              />
              <Text style={styles.fieldLabel}>sets</Text>

              <TextInput
                style={styles.smallInput}
                keyboardType="number-pad"
                placeholder="8"
                value={repMin}
                onChangeText={(t) => updateField(exercise.id, { repMin: t })}
              />
              <Text style={styles.fieldLabel}>to</Text>
              <TextInput
                style={styles.smallInput}
                keyboardType="number-pad"
                placeholder="12"
                value={repMax}
                onChangeText={(t) => updateField(exercise.id, { repMax: t })}
              />
              <Text style={styles.fieldLabel}>reps</Text>
            </View>
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
  help: { color: '#666', fontSize: 13, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  empty: { color: '#888' },
  error: { color: '#c00' },
  exerciseCard: { padding: 12, borderRadius: 10, backgroundColor: '#f3f3f3', gap: 10 },
  exerciseTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '600' },
  exerciseMuscle: { color: '#666', marginTop: 2 },
  fieldsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  smallInput: {
    width: 48,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    padding: 8,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  fieldLabel: { color: '#666', marginRight: 6 },
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