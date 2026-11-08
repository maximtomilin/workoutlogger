import { supabase } from '../lib/supabase';
import type { NewWorkout, Workout } from './../types';

export type WorkoutWithLastCompleted = Workout & { last_completed: string | null };

export async function getWorkouts(): Promise<Workout[]> {
  const { data, error } = await supabase.from('workouts').select('*').order('name');
  if (error) throw error;
  return data;
}

// last_completed is derived from workout_sessions, not stored on the workout
export async function getWorkoutsWithLastCompleted(): Promise<WorkoutWithLastCompleted[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*, workout_sessions(completed_at)')
    .order('name');
  if (error) throw error;

  return data.map(({ workout_sessions, ...workout }: any) => {
    const dates: string[] = workout_sessions
      .map((s: { completed_at: string | null }) => s.completed_at)
      .filter(Boolean);
    return { ...workout, last_completed: dates.sort().at(-1) ?? null };
  });
}

export async function getWorkout(id: string): Promise<Workout> {
  const { data, error } = await supabase.from('workouts').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createWorkout(workout: NewWorkout): Promise<Workout> {
  const { data, error } = await supabase.from('workouts').insert(workout).select().single();
  if (error) throw error;
  return data;
}

export async function updateWorkout(id: string, changes: Partial<NewWorkout>): Promise<Workout> {
  const { data, error } = await supabase
    .from('workouts')
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWorkout(id: string): Promise<void> {
  const { error } = await supabase.from('workouts').delete().eq('id', id);
  if (error) throw error;
}