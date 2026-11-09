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
import { deleteSet, getLastSetsForExercise, getSetsForSession, logSet } from '@/services/loggedSetService';
import { getWorkoutExercises } from '@/services/workoutExerciseService';
import { getWorkout } from '@/services/workoutService';
import { completeSession, getSession } from '@/services/workoutSessionService';
import type { LoggedSet, WorkoutExerciseWithExercise } from '@/types';

type SetRow = {
  key: string;
  setNumber: number; // fixed once created, so it matches the DB row
  reps: string;
  weight: string;
  loggedId: string | null; // set once saved to the database
};

type ExerciseState = {
  item: WorkoutExerciseWithExercise;
  rows: SetRow[];
  last: LoggedSet[]; // sets from the previous session, shown as placeholders
};

function emptyRow(exerciseId: string, setNumber: number): SetRow {
  return { key: `new-${exerciseId}-${setNumber}`, setNumber, reps: '', weight: '', loggedId: null };
}

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [workoutName, setWorkoutName] = useState('Workout');
  const [exercises, setExercises] = useState<ExerciseState[]>([]);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
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

  // Tapping the checkbox saves the set; tapping it again undoes it so you can edit
  async function toggleSet(exerciseId: string, row: SetRow) {
    setError(null);
    try {
      if (row.loggedId) {
        await deleteSet(row.loggedId);
        patchRow(exerciseId, row.key, { loggedId: null });
        return;
      }
      const reps = parseInt(row.reps, 10);
      if (Number.isNaN(reps) || reps <= 0) {
        setError('Enter the number of reps first.');
        return;
      }
      const w = parseFloat(row.weight.replace(',', '.'));
      const saved = await logSet({
        session_id: id,
        exercise_id: exerciseId,
        set_number: row.setNumber,
        reps,
        weight_kg: Number.isNaN(w) ? 0 : w,
      });
      patchRow(exerciseId, row.key, { loggedId: saved.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save set.');
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
            {exercises.length === 0 && !error && (
              <Text style={styles.empty}>This workout has no exercises.</Text>
            )}

            {exercises.map(({ item, rows, last }) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.exerciseName}>{item.exercise.name}</Text>
                <Text style={styles.exerciseMuscle}>{item.exercise.muscle_target}</Text>

                <View style={styles.headerRow}>
                  <Text style={[styles.headerText, styles.colSet]}>Set</Text>
                  <Text style={[styles.headerText, styles.colInput]}>kg</Text>
                  <Text style={[styles.headerText, styles.colInput]}>Reps</Text>
                  <View style={styles.colAction} />
                </View>

                {rows.map((row) => {
                  const prev = last.find((s) => s.set_number === row.setNumber);
                  const done = row.loggedId !== null;
                  return (
                    <View key={row.key} style={styles.setRow}>
                      <Text style={[styles.setNumber, styles.colSet]}>{row.setNumber}</Text>
                      <TextInput
                        style={[styles.input, styles.colInput, done && styles.inputDone]}
                        keyboardType="decimal-pad"
                        placeholder={prev ? String(prev.weight_kg) : '0'}
                        value={row.weight}
                        editable={!done}
                        onChangeText={(t) => patchRow(item.exercise_id, row.key, { weight: t })}
                      />
                      <TextInput
                        style={[styles.input, styles.colInput, done && styles.inputDone]}
                        keyboardType="number-pad"
                        placeholder={prev ? String(prev.reps) : '0'}
                        value={row.reps}
                        editable={!done}
                        onChangeText={(t) => patchRow(item.exercise_id, row.key, { reps: t })}
                      />
                      <View style={[styles.colAction, styles.actions]}>
                        <Pressable
                          style={[styles.check, done && styles.checkDone]}
                          onPress={() => toggleSet(item.exercise_id, row)}
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
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { marginTop: 40 },
  content: { padding: 20, gap: 16 },
  empty: { color: '#888', textAlign: 'center', marginTop: 20 },
  error: { color: '#c00' },
  card: { padding: 16, borderRadius: 12, backgroundColor: '#f3f3f3', gap: 8 },
  exerciseName: { fontSize: 18, fontWeight: '700' },
  exerciseMuscle: { color: '#666', marginBottom: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { color: '#666', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colSet: { width: 28, textAlign: 'center' },
  colInput: { flex: 1 },
  colAction: { width: 64 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setNumber: { fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    textAlign: 'center',
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputDone: { backgroundColor: '#e3f5e6', borderColor: '#b9e2c0' },
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
  primaryButton: {
    backgroundColor: '#111',
    margin: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});