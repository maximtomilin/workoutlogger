import { supabase } from '../lib/supabase';
import type { LoggedSet, NewLoggedSet } from './../types';

export async function getSetsForSession(sessionId: string): Promise<LoggedSet[]> {
  const { data, error } = await supabase
    .from('logged_sets')
    .select('*')
    .eq('session_id', sessionId)
    .order('exercise_id')
    .order('set_number');
  if (error) throw error;
  return data;
}

export async function logSet(set: NewLoggedSet): Promise<LoggedSet> {
  const { data, error } = await supabase.from('logged_sets').insert(set).select().single();
  if (error) throw error;
  return data;
}

export async function updateSet(
  id: string,
  changes: Partial<Pick<LoggedSet, 'reps' | 'weight_kg'>>
): Promise<LoggedSet> {
  const { data, error } = await supabase
    .from('logged_sets')
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSet(id: string): Promise<void> {
  const { error } = await supabase.from('logged_sets').delete().eq('id', id);
  if (error) throw error;
}

// "Last time" sets for an exercise, handy to prefill the logging screen.
// Pass the current session id to exclude it.
export async function getLastSetsForExercise(
  exerciseId: string,
  excludeSessionId?: string
): Promise<LoggedSet[]> {
  let latest = supabase
    .from('logged_sets')
    .select('session_id')
    .eq('exercise_id', exerciseId)
    .order('completed_at', { ascending: false })
    .limit(1);
  if (excludeSessionId) latest = latest.neq('session_id', excludeSessionId);

  const { data: last, error: lastError } = await latest.maybeSingle();
  if (lastError) throw lastError;
  if (!last) return [];

  const { data, error } = await supabase
    .from('logged_sets')
    .select('*')
    .eq('session_id', last.session_id)
    .eq('exercise_id', exerciseId)
    .order('set_number');
  if (error) throw error;
  return data;
}