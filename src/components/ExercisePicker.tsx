import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createExercise, getExercises } from '@/services/exerciseService';
import type { Exercise } from '@/types';

const MUSCLES = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Core'];

type Props = {
  visible: boolean;
  onClose: () => void;
  // May be async; if it throws, the error is shown inside the picker
  onPick: (exercise: Exercise) => void | Promise<void>;
  pickedIds: string[];
};

export default function ExercisePicker({ visible, onClose, onPick, pickedIds }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setLoading(true);
    getExercises()
      .then(setExercises)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [visible]);

  const filtered = exercises.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  async function pick(exercise: Exercise) {
    setError(null);
    try {
      await onPick(exercise);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add exercise.');
    }
  }

  async function create() {
    if (!newName.trim() || !newMuscle) {
      setError('Enter a name and pick a muscle.');
      return;
    }
    setError(null);
    try {
      const exercise = await createExercise({
        name: newName.trim(),
        muscle_target: newMuscle,
      });
      setExercises((prev) => [...prev, exercise]);
      setNewName('');
      setNewMuscle('');
      await onPick(exercise);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create exercise.');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add exercise</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <TextInput
            style={styles.input}
            placeholder="Search exercises"
            value={search}
            onChangeText={setSearch}
          />

          {loading ? (
            <ActivityIndicator style={styles.spacer} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.empty}>No matching exercises.</Text>}
              renderItem={({ item }) => {
                const picked = pickedIds.includes(item.id);
                return (
                  <Pressable
                    style={[styles.row, picked && styles.disabled]}
                    onPress={() => pick(item)}
                    disabled={picked}
                  >
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    <Text style={styles.exerciseMuscle}>
                      {picked ? 'Added' : item.muscle_target}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}

          <Text style={styles.label}>Or create a new exercise</Text>
          <TextInput
            style={styles.input}
            placeholder="Name, e.g. Preacher curl"
            value={newName}
            onChangeText={setNewName}
          />
          <View style={styles.chips}>
            {MUSCLES.map((m) => (
              <Pressable
                key={m}
                style={[styles.chip, newMuscle === m && styles.chipActive]}
                onPress={() => setNewMuscle(m)}
              >
                <Text style={newMuscle === m ? styles.chipTextActive : styles.chipText}>{m}</Text>
              </Pressable>
            ))}
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable style={styles.secondaryButton} onPress={create}>
            <Text style={styles.secondaryButtonText}>Create & add</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
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
  spacer: { marginVertical: 20 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalTitle: { fontSize: 22, fontWeight: '700' },
  done: { fontSize: 16, fontWeight: '600', color: '#0a84ff' },
  list: { maxHeight: 220 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  exerciseName: { fontSize: 16, fontWeight: '600' },
  exerciseMuscle: { color: '#666' },
  disabled: { opacity: 0.5 },
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
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#111',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '600' },
});