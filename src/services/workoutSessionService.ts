import { supabase } from '../lib/supabase';
import type { WorkoutSession } from './../types';

export async function startSession(workoutId: string): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({ workout_id: workoutId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completeSession(id: string): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSession(id: string): Promise<WorkoutSession> {
  const { data, error } = await supabase.from('workout_sessions').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

// A session that was started but never completed, if any
export async function getActiveSession(workoutId?: string): Promise<WorkoutSession | null> {
  let query = supabase
    .from('workout_sessions')
    .select('*')
    .is('completed_at', null)
    .order('started_at', { ascending: false })
    .limit(1);
  if (workoutId) query = query.eq('workout_id', workoutId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

export async function getSessionHistory(workoutId?: string): Promise<WorkoutSession[]> {
  let query = supabase
    .from('workout_sessions')
    .select('*')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });
  if (workoutId) query = query.eq('workout_id', workoutId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getLastCompletedAt(workoutId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('completed_at')
    .eq('workout_id', workoutId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.completed_at ?? null;
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from('workout_sessions').delete().eq('id', id);
  if (error) throw error;
}