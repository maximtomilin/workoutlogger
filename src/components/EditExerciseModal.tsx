
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MUSCLES } from '@/types/muscles';
import { deleteExercise, updateExercise } from '@/services/exerciseService';
import type { Exercise } from '@/types';
 
type Props = {
  exercise: Exercise | null; // the modal is visible while this is set
  onClose: () => void;
  onSaved: (exercise: Exercise) => void;
  onDeleted: (id: string) => void;
};
 
export default function EditExerciseModal({ exercise, onClose, onSaved, onDeleted }: Props) {
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  // Reset the form each time a different exercise is opened
  useEffect(() => {
    if (!exercise) return;
    setName(exercise.name);
    setMuscle(exercise.muscle_target);
    setConfirming(false);
    setError(null);
    setBusy(false);
  }, [exercise]);
 
  // Keep a custom muscle value selectable if it isn't one of the standard ones
  const muscles =
    exercise && !MUSCLES.includes(exercise.muscle_target)
      ? [...MUSCLES, exercise.muscle_target]
      : MUSCLES;
 
  async function save() {
    if (!exercise) return;
    if (!name.trim() || !muscle) {
      setError('Enter a name and pick a muscle.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await updateExercise(exercise.id, {
        name: name.trim(),
        muscle_target: muscle,
      });
      onSaved(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save exercise.');
    } finally {
      setBusy(false);
    }
  }
 
  async function remove() {
    if (!exercise) return;
    setBusy(true);
    setError(null);
    try {
      await deleteExercise(exercise.id);
      onDeleted(exercise.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete exercise.');
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }
 
  return (
    <Modal visible={exercise !== null} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit exercise</Text>
          <Pressable onPress={onClose} disabled={busy}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>
 
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
 
          <Text style={styles.label}>Muscle group</Text>
          <View style={styles.chips}>
            {muscles.map((m) => (
              <Pressable
                key={m}
                style={[styles.chip, muscle === m && styles.chipActive]}
                onPress={() => setMuscle(m)}
              >
                <Text style={muscle === m ? styles.chipTextActive : styles.chipText}>{m}</Text>
              </Pressable>
            ))}
          </View>
 
          {error && <Text style={styles.error}>{error}</Text>}
 
          <Pressable style={[styles.saveButton, busy && styles.disabled]} onPress={save} disabled={busy}>
            {busy && !confirming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Save changes</Text>
            )}
          </Pressable>
 
          <View style={styles.danger}>
            {confirming ? (
              <>
                <Text style={styles.confirmText}>
                  Delete this exercise? It will also be removed from any workouts that use it.
                </Text>
                <View style={styles.row}>
                  <Pressable
                    style={styles.cancelButton}
                    onPress={() => setConfirming(false)}
                    disabled={busy}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.deleteButton, busy && styles.disabled]}
                    onPress={remove}
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
                <Text style={styles.deleteOutlineText}>Delete exercise</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', width: '100%', maxWidth: 520, alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: { fontSize: 22, fontWeight: '700' },
  cancel: { fontSize: 16, fontWeight: '600', color: '#0a84ff' },
  content: { padding: 20, gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  chipActive: { backgroundColor: '#111', borderColor: '#111' },
  chipText: { color: '#333' },
  chipTextActive: { color: '#fff' },
  error: { color: '#c00' },
  saveButton: {
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  danger: { marginTop: 24, gap: 12 },
  confirmText: { color: '#444' },
  row: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelButtonText: { fontWeight: '600' },
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
 