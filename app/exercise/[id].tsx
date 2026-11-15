import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressChart from '@/components/ProgressChart';
import { getExercise } from '@/services/exerciseService';
import { getExerciseProgress, type ProgressPoint } from '@/services/progressService';
import type { Exercise } from '@/types';

const round = (n: number) => Math.round(n * 100) / 100;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export default function ExerciseProgressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [points, setPoints] = useState<ProgressPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getExercise(id), getExerciseProgress(id)])
      .then(([ex, progress]) => {
        if (!active) return;
        setExercise(ex);
        setPoints(progress);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load progress.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const hasWeight = points.some((p) => p.maxWeightKg > 0);
  const best = hasWeight ? Math.max(...points.map((p) => p.maxWeightKg)) : 0;
  const first = points[0];
  const latest = points[points.length - 1];
  const change = first && latest ? round(latest.maxWeightKg - first.maxWeightKg) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: exercise?.name ?? 'Progress' }} />

      {loading ? (
        <ActivityIndicator style={styles.center} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {exercise && <Text style={styles.muscle}>{exercise.muscle_target}</Text>}

          {points.length === 0 ? (
            <Text style={styles.empty}>
              No sets logged for this exercise yet. Once you log some, your progress shows up here.
            </Text>
          ) : !hasWeight ? (
            <Text style={styles.empty}>
              Every set for this exercise was bodyweight, so there is no weight to chart yet.
            </Text>
          ) : (
            <>
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{best} kg</Text>
                  <Text style={styles.statLabel}>Best</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{latest.maxWeightKg} kg</Text>
                  <Text style={styles.statLabel}>Latest</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>
                    {change > 0 ? '+' : ''}
                    {change} kg
                  </Text>
                  <Text style={styles.statLabel}>Since first</Text>
                </View>
              </View>

              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Max weight per session</Text>
                <ProgressChart
                  points={points.map((p) => ({
                    time: new Date(p.date).getTime(),
                    value: p.maxWeightKg,
                  }))}
                />
              </View>

              <Text style={styles.sectionTitle}>Sessions</Text>
              {[...points].reverse().map((p) => (
                <View key={p.sessionId} style={styles.row}>
                  <Text style={styles.rowDate}>{formatDate(p.date)}</Text>
                  <Text style={styles.rowValue}>
                    {p.maxWeightKg} kg × {p.repsAtMax}
                  </Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', width: '100%', maxWidth: 520, alignSelf: 'center' },
  center: { marginTop: 40 },
  content: { padding: 20, gap: 16 },
  muscle: { color: '#666' },
  empty: { color: '#888', textAlign: 'center', marginTop: 20 },
  error: { color: '#c00', padding: 20 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#f3f3f3', alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#666', marginTop: 2, fontSize: 12 },
  chartCard: { padding: 14, borderRadius: 12, backgroundColor: '#f3f3f3', gap: 8 },
  chartTitle: { fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#444', marginTop: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  rowDate: { color: '#444' },
  rowValue: { fontWeight: '600' },
});