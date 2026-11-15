import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { exportText } from '@/services/exportActions';
import { getWorkoutExports, type WorkoutExport } from '@/services/exportService';
import { deleteSession } from '@/services/workoutSessionService';

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<WorkoutExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Tab screens stay mounted, so reload whenever the tab is focused
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getWorkoutExports()
        .then((data) => {
          if (!active) return;
          setSessions(data);
          setError(null);
        })
        .catch((e: unknown) => {
          if (active) setError(e instanceof Error ? e.message : 'Failed to load history');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [])
  );

  function toggle(id: string) {
    setExpandedId((current) => (current === id ? null : id));
    setConfirmId(null);
  }

  async function exportSession(session: WorkoutExport) {
    setError(null);
    try {
      await exportText(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.');
    }
  }

  async function removeSession(id: string) {
    setRemovingId(id);
    setError(null);
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setExpandedId(null);
      setConfirmId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove workout.');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>History</Text>
      <Text style={styles.subtitle}>Your completed workouts</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator style={styles.center} />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          extraData={[expandedId, confirmId, removingId]}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No completed workouts yet. Finish one and it shows up here.</Text>
          }
          renderItem={({ item }) => {
            const expanded = expandedId === item.id;
            const removing = removingId === item.id;
            const setCount = item.exercises.reduce((n, e) => n + e.sets.length, 0);
            return (
              <View style={styles.card}>
                <Pressable onPress={() => toggle(item.id)}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.workoutName}</Text>
                    <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
                  </View>
                  <Text style={styles.cardDate}>
                    {new Date(item.completedAt).toLocaleDateString(undefined, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.cardStats}>
                    {item.durationMin} min · {setCount} {setCount === 1 ? 'set' : 'sets'} ·{' '}
                    {item.totalVolume} kg
                  </Text>
                </Pressable>

                {expanded && (
                  <View style={styles.details}>
                    {item.exercises.length === 0 && (
                      <Text style={styles.empty}>No sets were logged.</Text>
                    )}
                    {item.exercises.map((ex) => (
                      <View key={ex.name} style={styles.exercise}>
                        <Text style={styles.exerciseName}>{ex.name}</Text>
                        {ex.sets.map((s) => (
                          <Text key={s.setNumber} style={styles.setLine}>
                            Set {s.setNumber}:{' '}
                            {s.weightKg > 0 ? `${s.reps} x ${s.weightKg} kg` : `${s.reps} reps`}
                          </Text>
                        ))}
                      </View>
                    ))}

                    {confirmId === item.id ? (
                      <View style={styles.confirmBox}>
                        <Text style={styles.confirmText}>
                          Remove this workout from your history? This can't be undone.
                        </Text>
                        <View style={styles.actionRow}>
                          <Pressable
                            style={styles.cancelButton}
                            onPress={() => setConfirmId(null)}
                            disabled={removing}
                          >
                            <Text style={styles.cancelText}>Cancel</Text>
                          </Pressable>
                          <Pressable
                            style={[styles.removeButton, removing && styles.disabled]}
                            onPress={() => removeSession(item.id)}
                            disabled={removing}
                          >
                            {removing ? (
                              <ActivityIndicator color="#fff" />
                            ) : (
                              <Text style={styles.removeText}>Yes, remove</Text>
                            )}
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.actionRow}>
                        <Pressable style={styles.exportButton} onPress={() => exportSession(item)}>
                          <Text style={styles.exportButtonText}>Export (.txt)</Text>
                        </Pressable>
                        <Pressable style={styles.removeOutline} onPress={() => setConfirmId(item.id)}>
                          <Text style={styles.removeOutlineText}>Remove</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
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
  center: { marginTop: 40 },
  list: { gap: 12, paddingBottom: 20 },
  empty: { textAlign: 'center', color: '#888', marginTop: 20 },
  error: { color: '#c00', marginBottom: 12 },
  card: { padding: 16, borderRadius: 12, backgroundColor: '#f3f3f3' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  chevron: { color: '#888', fontSize: 12 },
  cardDate: { color: '#444', marginTop: 4 },
  cardStats: { color: '#666', marginTop: 2 },
  details: { marginTop: 14, gap: 12, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 14 },
  exercise: { gap: 2 },
  exerciseName: { fontWeight: '600', marginBottom: 2 },
  setLine: { color: '#444' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  exportButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#111',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  exportButtonText: { fontWeight: '600' },
  removeOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#c00',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  removeOutlineText: { color: '#c00', fontWeight: '600' },
  confirmBox: { gap: 10 },
  confirmText: { color: '#444' },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelText: { fontWeight: '600' },
  removeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#c00',
    alignItems: 'center',
  },
  removeText: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.5 },
});