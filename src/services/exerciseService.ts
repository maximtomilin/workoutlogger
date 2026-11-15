import { supabase } from '../lib/supabase';
import type { Exercise, NewExercise } from '@/types';

export async function getExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase.from('exercises').select('*').order('name');
  if (error) throw error;
  return data;
}

export async function getExercise(id: string): Promise<Exercise> {
  const { data, error } = await supabase.from('exercises').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function searchExercises(query: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name');
  if (error) throw error;
  return data;
}

export async function createExercise(exercise: NewExercise): Promise<Exercise> {
  const { data, error } = await supabase.from('exercises').insert(exercise).select().single();
  if (error) throw error;
  return data;
}

export async function updateExercise(id: string, changes: Partial<NewExercise>): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Removes the exercise from any workouts and deletes it. Refuses if it has logged sets in your
// history, so past workouts are never silently changed.
export async function deleteExercise(id: string): Promise<void> {
  const { count, error: countError } = await supabase
    .from('logged_sets')
    .select('id', { count: 'exact', head: true })
    .eq('exercise_id', id);
  if (countError) throw countError;
  if (count && count > 0) {
    throw new Error(
      `This exercise is in ${count} logged ${count === 1 ? 'set' : 'sets'} in your history, so it can't be deleted. Remove those workouts from History first.`
    );
  }

  const { error: linkError } = await supabase.from('workout_exercises').delete().eq('exercise_id', id);
  if (linkError) throw linkError;

  const { error } = await supabase.from('exercises').delete().eq('id', id);
  if (error) throw error;
}