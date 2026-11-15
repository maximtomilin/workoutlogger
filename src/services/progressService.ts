import { supabase } from '../lib/supabase';

export type ProgressPoint = {
  sessionId: string;
  date: string; // when the first set of that session was logged
  maxWeightKg: number;
  repsAtMax: number; // best reps at that max weight
};

type Row = { session_id: string; weight_kg: number | string; reps: number; completed_at: string };

// Heaviest weight lifted per session for one exercise, oldest first
export async function getExerciseProgress(exerciseId: string): Promise<ProgressPoint[]> {
  const { data, error } = await supabase
    .from('logged_sets')
    .select('session_id, weight_kg, reps, completed_at')
    .eq('exercise_id', exerciseId)
    .order('completed_at', { ascending: true });
  if (error) throw error;

  const bySession = new Map<string, ProgressPoint>();
  for (const row of data as Row[]) {
    const weight = Number(row.weight_kg);
    const existing = bySession.get(row.session_id);
    if (!existing) {
      bySession.set(row.session_id, {
        sessionId: row.session_id,
        date: row.completed_at,
        maxWeightKg: weight,
        repsAtMax: row.reps,
      });
    } else if (
      weight > existing.maxWeightKg ||
      (weight === existing.maxWeightKg && row.reps > existing.repsAtMax)
    ) {
      existing.maxWeightKg = weight;
      existing.repsAtMax = row.reps;
    }
  }
  // Map keeps insertion order, which is already oldest first
  return [...bySession.values()];
}