import { supabase } from '../lib/supabase';
import type {
  NewWorkoutExercise,
  WorkoutExercise,
  WorkoutExerciseWithExercise,
} from './../types';

// Exercises in a workout, in order, with the exercise details joined in
export async function getWorkoutExercises(
  workoutId: string
): Promise<WorkoutExerciseWithExercise[]> {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select('*, exercise:exercises(*)')
    .eq('workout_id', workoutId)
    .order('position');
  if (error) throw error;
  return data as unknown as WorkoutExerciseWithExercise[];
}

export async function addExerciseToWorkout(item: NewWorkoutExercise): Promise<WorkoutExercise> {
  const { data, error } = await supabase.from('workout_exercises').insert(item).select().single();
  if (error) throw error;
  return data;
}

export async function updateWorkoutExercise(
  id: string,
  changes: Partial<Pick<WorkoutExercise, 'target_sets' | 'position'>>
): Promise<WorkoutExercise> {
  const { data, error } = await supabase
    .from('workout_exercises')
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeExerciseFromWorkout(id: string): Promise<void> {
  const { error } = await supabase.from('workout_exercises').delete().eq('id', id);
  if (error) throw error;
}