import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ExercisePicker from '@/components/ExercisePicker';
import { exportText } from '@/services/exportActions';
import { getLatestWorkoutExport } from '@/services/exportService';
import {
  addExerciseToWorkout,
  getWorkoutExercises,
  removeExerciseFromWorkout,
  updateWorkoutExercise,
} from '@/services/workoutExerciseService';
import { deleteWorkout, getWorkout } from '@/services/workoutService';
import { parseRepRange } from '@/types/repRange';
import type { Exercise, WorkoutExerciseWithExercise } from '@/types';

const DEFAULT_SETS = 3;

type Draft = { sets: string; min: string; max: string };

function summary(item: WorkoutExerciseWithExercise): string {
  const parts = [item.exercise.muscle_target];
  if (item.target_sets) parts.push(`${item.target_sets} sets`);
  if (item.rep_min !== null && item.rep_max !== null) {
    parts.push(`${item.rep_min}–${item.rep_max} reps`);
  }
  return parts.join(' · ');
}

export default function EditWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState('Edit workout');
  const [items, setItems] = useState<WorkoutExerciseWithExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ sets: '', min: '', max: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
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

  function startEdit(item: WorkoutExerciseWithExercise) {
    setError(null);
    setEditingId(item.id);
    setDraft({
      sets: item.target_sets !== null ? String(item.target_sets) : '',
      min: item.rep_min !== null ? String(item.rep_min) : '',
      max: item.rep_max !== null ? String(item.rep_max) : '',
    });
  }

  async function saveEdit(item: WorkoutExerciseWithExercise) {
    const range = parseRepRange(draft.min, draft.max);
    if (range.error !== null) {
      setError(range.error);
      return;
    }
    const sets = parseInt(draft.sets, 10);
    setSavingEdit(true);
    setError(null);
    try {
      const updated = await updateWorkoutExercise(item.id, {
        target_sets: Number.isNaN(sets) ? null : sets,
        rep_min: range.repMin,
        rep_max: range.repMax,
      });
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...updated } : i)));
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save changes.');
    } finally {
      setSavingEdit(false);
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

  // Exports the most recent completed session of this workout
  async function exportLatest() {
    setExporting(true);
    setError(null);
    try {
      const data = await getLatestWorkoutExport(id);
      if (!data) {
        setError("You haven't completed this workout yet, so there's nothing to export.");
        return;
      }
      await exportText(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setExporting(false);
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
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Exercises</Text>
          {items.length === 0 && <Text style={styles.empty}>No exercises in this workout.</Text>}

          {items.map((item) => {
            const editing = editingId === item.id;
            return (
              <View key={item.id} style={styles.row}>
                <View style={styles.rowTop}>
                  <View style={styles.rowInfo}>
                    <Text style={styles.exerciseName}>{item.exercise.name}</Text>
                    <Text style={styles.exerciseSub}>{summary(item)}</Text>
                  </View>
                  {!editing && (
                    <View style={styles.rowActions}>
                      <Pressable onPress={() => startEdit(item)} hitSlop={8}>
                        <Text style={styles.edit}>Edit</Text>
                      </Pressable>
                      <Pressable onPress={() => removeItem(item.id)} hitSlop={8}>
                        <Text style={styles.remove}>Remove</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {editing && (
                  <>
                    <View style={styles.fieldsRow}>
                      <TextInput
                        style={styles.smallInput}
                        keyboardType="number-pad"
                        value={draft.sets}
                        onChangeText={(t) => setDraft((d) => ({ ...d, sets: t }))}
                      />
                      <Text style={styles.fieldLabel}>sets</Text>
                      <TextInput
                        style={styles.smallInput}
                        keyboardType="number-pad"
                        placeholder="8"
                        value={draft.min}
                        onChangeText={(t) => setDraft((d) => ({ ...d, min: t }))}
                      />
                      <Text style={styles.fieldLabel}>to</Text>
                      <TextInput
                        style={styles.smallInput}
                        keyboardType="number-pad"
                        placeholder="12"
                        value={draft.max}
                        onChangeText={(t) => setDraft((d) => ({ ...d, max: t }))}
                      />
                      <Text style={styles.fieldLabel}>reps</Text>
                    </View>
                    <View style={styles.rowButtons}>
                      <Pressable
                        style={styles.cancelButton}
                        onPress={() => setEditingId(null)}
                        disabled={savingEdit}
                      >
                        <Text style={styles.cancelText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.saveButton, savingEdit && styles.disabled]}
                        onPress={() => saveEdit(item)}
                        disabled={savingEdit}
                      >
                        {savingEdit ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.saveText}>Save</Text>
                        )}
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            );
          })}

          <Pressable style={styles.secondaryButton} onPress={() => setPickerOpen(true)}>
            <Text style={styles.secondaryButtonText}>+ Add exercise</Text>
          </Pressable>

          <Pressable
            style={[styles.secondaryButton, exporting && styles.disabled]}
            onPress={exportLatest}
            disabled={exporting}
          >
            <Text style={styles.secondaryButtonText}>Export last session (.txt)</Text>
          </Pressable>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.danger}>
            {confirming ? (
              <>
                <Text style={styles.confirmText}>
                  Delete this workout? Your logged history is kept.
                </Text>
                <View style={styles.rowButtons}>
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
  row: { padding: 14, borderRadius: 10, backgroundColor: '#f3f3f3', gap: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowInfo: { flex: 1 },
  rowActions: { flexDirection: 'row', gap: 14 },
  exerciseName: { fontSize: 16, fontWeight: '600' },
  exerciseSub: { color: '#666', marginTop: 2 },
  edit: { color: '#0a84ff', fontWeight: '600' },
  remove: { color: '#c00', fontWeight: '600' },
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
  rowButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelText: { fontWeight: '600' },
  saveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#111',
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '600' },
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