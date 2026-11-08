import { supabase } from '../lib/supabase';
import type { Exercise, NewExercise } from './../types';

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

export async function deleteExercise(id: string): Promise<void> {
  const { error } = await supabase.from('exercises').delete().eq('id', id);
  if (error) throw error;
}