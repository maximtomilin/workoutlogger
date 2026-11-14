import { supabase } from '../lib/supabase';

export type ExportedSet = { setNumber: number; reps: number; weightKg: number };
export type ExportedExercise = {
  name: string;
  muscle: string;
  sets: ExportedSet[];
  volume: number;
};
export type WorkoutExport = {
  workoutName: string;
  startedAt: string;
  completedAt: string;
  durationMin: number;
  exercises: ExportedExercise[];
  totalVolume: number;
};

type RawSet = {
  exercise_id: string;
  set_number: number;
  reps: number;
  weight_kg: number | string;
  completed_at: string;
  exercise: { name: string; muscle_target: string } | null;
};
type RawSession = {
  started_at: string;
  completed_at: string;
  workout: { name: string } | null;
  logged_sets: RawSet[];
};

const round = (n: number) => Math.round(n * 100) / 100;

// The most recently completed session, with its sets and exercise names
export async function getLatestWorkoutExport(workoutId?: string): Promise<WorkoutExport | null> {
  let query = supabase
    .from('workout_sessions')
    .select(
      'started_at, completed_at, workout:workouts(name), logged_sets(exercise_id, set_number, reps, weight_kg, completed_at, exercise:exercises(name, muscle_target))'
    )
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1);
  if (workoutId) query = query.eq('workout_id', workoutId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const session = data as unknown as RawSession;
  const sorted = [...session.logged_sets].sort(
    (a, b) => a.completed_at.localeCompare(b.completed_at) || a.set_number - b.set_number
  );

  // Group by exercise, in the order you first logged them
  const byExercise = new Map<string, ExportedExercise>();
  for (const s of sorted) {
    let ex = byExercise.get(s.exercise_id);
    if (!ex) {
      ex = {
        name: s.exercise?.name ?? 'Unknown exercise',
        muscle: s.exercise?.muscle_target ?? '',
        sets: [],
        volume: 0,
      };
      byExercise.set(s.exercise_id, ex);
    }
    const weightKg = Number(s.weight_kg);
    ex.sets.push({ setNumber: s.set_number, reps: s.reps, weightKg });
    ex.volume = round(ex.volume + s.reps * weightKg);
  }
  const exercises = [...byExercise.values()];
  for (const ex of exercises) ex.sets.sort((a, b) => a.setNumber - b.setNumber);

  const durationMs = new Date(session.completed_at).getTime() - new Date(session.started_at).getTime();
  return {
    workoutName: session.workout?.name ?? 'Workout',
    startedAt: session.started_at,
    completedAt: session.completed_at,
    durationMin: Math.max(1, Math.round(durationMs / 60000)),
    exercises,
    totalVolume: round(exercises.reduce((sum, e) => sum + e.volume, 0)),
  };
}

function formatSet(s: ExportedSet): string {
  return s.weightKg > 0 ? `${s.reps} x ${s.weightKg} kg` : `${s.reps} reps (bodyweight)`;
}

export function formatAsText(w: WorkoutExport): string {
  const lines: string[] = [
    w.workoutName,
    `${new Date(w.completedAt).toLocaleString()} (${w.durationMin} min)`,
    '',
  ];
  for (const ex of w.exercises) {
    lines.push(ex.muscle ? `${ex.name} (${ex.muscle})` : ex.name);
    for (const s of ex.sets) lines.push(`  Set ${s.setNumber}: ${formatSet(s)}`);
    lines.push(`  Volume: ${ex.volume} kg`, '');
  }
  lines.push(`Total volume: ${w.totalVolume} kg`);
  return lines.join('\n');
}