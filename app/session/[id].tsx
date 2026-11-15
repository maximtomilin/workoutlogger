import { useEffect, useState } from 'react';
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
import {
  deleteSet,
  getLastSetsForExercise,
  getSetsForSession,
  logSet,
  updateSet,
} from '@/services/loggedSetService';
import { getWorkoutExercises } from '@/services/workoutExerciseService';
import { getWorkout } from '@/services/workoutService';
import { completeSession, getSession } from '@/services/workoutSessionService';
import type { LoggedSet, WorkoutExerciseWithExercise } from '@/types';

type SavedValues = { reps: string; weight: string };

type SetRow = {
  key: string;
  setNumber: number; // fixed once created, so it matches the DB row
  reps: string;
  weight: string;
  loggedId: string | null; // set once saved to the database
  saved: SavedValues | null; // what is currently stored, used to detect edits
};

type ExerciseState = {
  item: WorkoutExerciseWithExercise;
  rows: SetRow[];
  last: LoggedSet[]; // sets from the previous session
};

function emptyRow(exerciseId: string, setNumber: number): SetRow {
  return {
    key: `new-${exerciseId}-${setNumber}`,
    setNumber,
    reps: '',
    weight: '',
    loggedId: null,
    saved: null,
  };
}

type SetInputProps = {
  value: string;
  placeholder: string;
  keyboardType: 'decimal-pad' | 'number-pad';
  done: boolean;
  focused: boolean;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
};

function SetInput({ done, focused, ...props }: SetInputProps) {
  return (
    <TextInput
      {...props}
      style={[
        styles.input,
        styles.colInput,
        done && styles.inputDone,
        focused && styles.inputFocused,
      ]}
      placeholderTextColor="#aaa"
      selectTextOnFocus
    />
  );
}

// Soft suggestion, never enforced: shown when the last set of the previous session
// reached the top of the rep range. It disappears once you log a heavier weight.
function ProgressionHint({
  item,
  rows,
  last,
}: {
  item: WorkoutExerciseWithExercise;
  rows: SetRow[];
  last: LoggedSet[];
}) {
  const prev = last[last.length - 1];
  if (item.rep_max === null || !prev || prev.reps < item.rep_max) return null;

  const prevWeight = Number(prev.weight_kg);
  const increased = rows.some(
    (r) => r.loggedId !== null && parseFloat(r.weight.replace(',', '.')) > prevWeight
  );
  if (increased) return null;

  return (
    <View style={styles.progressBox}>
      <Text style={styles.progressText}>
        Last time you hit {prev.reps} reps on your last set
        {prevWeight > 0 ? ` at ${prevWeight} kg` : ''}. You can go up in weight this time, or stay
        where you are.
      </Text>
    </View>
  );
}

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [workoutName, setWorkoutName] = useState('Workout');
  const [exercises, setExercises] = useState<ExerciseState[]>([]);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const session = await getSession(id);
        if (!session.workout_id) throw new Error('This workout no longer exists.');

        const [workout, items, logged] = await Promise.all([
          getWorkout(session.workout_id),
          getWorkoutExercises(session.workout_id),
          getSetsForSession(id),
        ]);
        const lasts = await Promise.all(
          items.map((i) => getLastSetsForExercise(i.exercise_id, id))
        );

        const states: ExerciseState[] = items.map((item, idx) => {
          const rows: SetRow[] = logged
            .filter((s) => s.exercise_id === item.exercise_id)
            .map((s) => ({
              key: s.id,
              setNumber: s.set_number,
              reps: String(s.reps),
              weight: String(s.weight_kg),
              loggedId: s.id,
              saved: { reps: String(s.reps), weight: String(s.weight_kg) },
            }));
          // Pad with empty rows up to the planned number of sets
          const target = item.target_sets ?? 3;
          let next = rows.reduce((max, r) => Math.max(max, r.setNumber), 0) + 1;
          while (rows.length < target) {
            rows.push(emptyRow(item.exercise_id, next++));
          }
          return { item, rows, last: lasts[idx] };
        });

        if (!active) return;
        setWorkoutName(workout.name);
        setExercises(states);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load workout.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  function patchRow(exerciseId: string, key: string, changes: Partial<SetRow>) {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.item.exercise_id !== exerciseId
          ? ex
          : { ...ex, rows: ex.rows.map((r) => (r.key === key ? { ...r, ...changes } : r)) }
      )
    );
  }

  function addRow(exerciseId: string) {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.item.exercise_id !== exerciseId) return ex;
        const next = ex.rows.reduce((max, r) => Math.max(max, r.setNumber), 0) + 1;
        return { ...ex, rows: [...ex.rows, emptyRow(exerciseId, next)] };
      })
    );
  }

  function removeRow(exerciseId: string, key: string) {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.item.exercise_id !== exerciseId
          ? ex
          : { ...ex, rows: ex.rows.filter((r) => r.key !== key) }
      )
    );
  }

  // Tapping the checkmark saves the set. Empty fields reuse last session's values.
  // Tapping it again undoes the set.
  async function toggleSet(exerciseId: string, row: SetRow, prev: LoggedSet | undefined) {
    setError(null);
    try {
      if (row.loggedId) {
        await deleteSet(row.loggedId);
        patchRow(exerciseId, row.key, { loggedId: null, saved: null });
        return;
      }

      const repsText = row.reps.trim() !== '' ? row.reps : prev ? String(prev.reps) : '';
      const reps = parseInt(repsText, 10);
      if (Number.isNaN(reps) || reps <= 0) {
        setError('Enter the number of reps first.');
        return;
      }
      const weightText = row.weight.trim() !== '' ? row.weight : prev ? String(prev.weight_kg) : '';
      const parsedWeight = parseFloat(weightText.replace(',', '.'));
      const weight = Number.isNaN(parsedWeight) ? 0 : parsedWeight;

      const saved = await logSet({
        session_id: id,
        exercise_id: exerciseId,
        set_number: row.setNumber,
        reps,
        weight_kg: weight,
      });
      // Show the values that were actually saved, including any reused ones
      patchRow(exerciseId, row.key, {
        loggedId: saved.id,
        reps: String(reps),
        weight: String(weight),
        saved: { reps: String(reps), weight: String(weight) },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save set.');
    }
  }

  // Editing a set that is already saved: update it when the field loses focus.
  // An emptied field keeps its saved value.
  async function saveEdit(exerciseId: string, row: SetRow) {
    if (!row.loggedId || !row.saved) return;
    const repsText = row.reps.trim() !== '' ? row.reps : row.saved.reps;
    const weightText = row.weight.trim() !== '' ? row.weight : row.saved.weight;
    if (repsText === row.saved.reps && weightText === row.saved.weight) {
      patchRow(exerciseId, row.key, { reps: repsText, weight: weightText });
      return;
    }

    const reps = parseInt(repsText, 10);
    const weight = parseFloat(weightText.replace(',', '.'));
    if (Number.isNaN(reps) || reps <= 0 || Number.isNaN(weight) || weight < 0) {
      patchRow(exerciseId, row.key, { reps: row.saved.reps, weight: row.saved.weight });
      setError('Reps and weight must be valid numbers.');
      return;
    }
    try {
      await updateSet(row.loggedId, { reps, weight_kg: weight });
      patchRow(exerciseId, row.key, {
        reps: String(reps),
        weight: String(weight),
        saved: { reps: String(reps), weight: String(weight) },
      });
    } catch (e) {
      patchRow(exerciseId, row.key, { reps: row.saved.reps, weight: row.saved.weight });
      setError(e instanceof Error ? e.message : 'Could not update set.');
    }
  }

  async function finish() {
    setFinishing(true);
    setError(null);
    try {
      await completeSession(id);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not finish workout.');
      setFinishing(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: workoutName }} />

      {loading ? (
        <ActivityIndicator style={styles.center} />
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.hint}>
              Tap any weight or reps field to edit it. Grey numbers are from your last session and
              are used if you leave a field empty when you tap ✓.
            </Text>

            {exercises.length === 0 && !error && (
              <Text style={styles.empty}>This workout has no exercises.</Text>
            )}

            {exercises.map(({ item, rows, last }) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.exerciseName}>{item.exercise.name}</Text>
                <Text style={styles.exerciseMuscle}>{item.exercise.muscle_target}</Text>
                {item.rep_min !== null && item.rep_max !== null && (
                  <Text style={styles.target}>
                    Target: {item.rep_min}–{item.rep_max} reps
                  </Text>
                )}
                <ProgressionHint item={item} rows={rows} last={last} />

                <View style={styles.headerRow}>
                  <Text style={[styles.headerText, styles.colSet]}>Set</Text>
                  <Text style={[styles.headerText, styles.colInput]}>kg</Text>
                  <Text style={[styles.headerText, styles.colInput]}>Reps</Text>
                  <View style={styles.colAction} />
                </View>

                {rows.map((row) => {
                  const prev = last.find((s) => s.set_number === row.setNumber);
                  const done = row.loggedId !== null;
                  const weightKey = `${row.key}-weight`;
                  const repsKey = `${row.key}-reps`;
                  return (
                    <View key={row.key} style={styles.setRow}>
                      <Text style={[styles.setNumber, styles.colSet]}>{row.setNumber}</Text>
                      <SetInput
                        value={row.weight}
                        placeholder={prev ? String(prev.weight_kg) : '0'}
                        keyboardType="decimal-pad"
                        done={done}
                        focused={focused === weightKey}
                        onChangeText={(t) => patchRow(item.exercise_id, row.key, { weight: t })}
                        onFocus={() => setFocused(weightKey)}
                        onBlur={() => {
                          setFocused(null);
                          saveEdit(item.exercise_id, row);
                        }}
                      />
                      <SetInput
                        value={row.reps}
                        placeholder={prev ? String(prev.reps) : '0'}
                        keyboardType="number-pad"
                        done={done}
                        focused={focused === repsKey}
                        onChangeText={(t) => patchRow(item.exercise_id, row.key, { reps: t })}
                        onFocus={() => setFocused(repsKey)}
                        onBlur={() => {
                          setFocused(null);
                          saveEdit(item.exercise_id, row);
                        }}
                      />
                      <View style={[styles.colAction, styles.actions]}>
                        <Pressable
                          style={[styles.check, done && styles.checkDone]}
                          onPress={() => toggleSet(item.exercise_id, row, prev)}
                        >
                          <Text style={done ? styles.checkTextDone : styles.checkText}>✓</Text>
                        </Pressable>
                        {!done && (
                          <Pressable onPress={() => removeRow(item.exercise_id, row.key)} hitSlop={8}>
                            <Text style={styles.remove}>✕</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })}

                <Pressable style={styles.addSet} onPress={() => addRow(item.exercise_id)}>
                  <Text style={styles.addSetText}>+ Add set</Text>
                </Pressable>
              </View>
            ))}

            {error && <Text style={styles.error}>{error}</Text>}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.primaryButton, finishing && styles.disabled]}
              onPress={finish}
              disabled={finishing}
            >
              {finishing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Finish workout</Text>
              )}
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { marginTop: 40 },
  content: { padding: 20, gap: 16, width: '100%', maxWidth: 520, alignSelf: 'center' },
  hint: { color: '#666', fontSize: 13, lineHeight: 18 },
  empty: { color: '#888', textAlign: 'center', marginTop: 20 },
  error: { color: '#c00' },
  card: { padding: 16, borderRadius: 12, backgroundColor: '#f3f3f3', gap: 8 },
  exerciseName: { fontSize: 18, fontWeight: '700' },
  exerciseMuscle: { color: '#666', marginBottom: 4 },
  target: { color: '#444', fontWeight: '600' },
  progressBox: {
    backgroundColor: '#fff6d6',
    borderWidth: 1,
    borderColor: '#f0d46a',
    borderRadius: 8,
    padding: 10,
  },
  progressText: { color: '#5c4a00', fontSize: 13, lineHeight: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { color: '#666', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colSet: { width: 28, textAlign: 'center' },
  colInput: { flex: 1, minWidth: 0 },
  colAction: { width: 64 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setNumber: { fontWeight: '600' },
  input: {
    borderWidth: 1.5,
    borderColor: '#9a9a9a',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    backgroundColor: '#fff',
  },
  inputDone: { backgroundColor: '#e3f5e6', borderColor: '#7cc78b' },
  inputFocused: { borderColor: '#0a84ff', borderWidth: 2 },
  check: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bbb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkDone: { backgroundColor: '#2e9e4f', borderColor: '#2e9e4f' },
  checkText: { color: '#bbb', fontWeight: '700' },
  checkTextDone: { color: '#fff', fontWeight: '700' },
  remove: { color: '#c00', fontSize: 16 },
  addSet: { paddingVertical: 8, alignItems: 'center' },
  addSetText: { fontWeight: '600' },
  footer: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: 20 },
  primaryButton: {
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});