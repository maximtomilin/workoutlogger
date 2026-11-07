import { supabase } from '../lib/supabase';
import type { Plant } from '../types';

function mapPlant(row: Record<string, unknown>): Plant {
  return {
    id: row.id as number,
    name: row.name as string,
    common_name: row.common_name as string,
    other_name: row.other_name as string,
    watering: row.watering as string,
    sunlight: row.sunlight as string,
    last_watered: (row.last_watered as string | null) ?? undefined,
    image_url: (row.image_url as string | null) ?? undefined,
  };
}

export async function getPlants(): Promise<Plant[]> {
  const { data, error } = await supabase.from('plant').select('*');
  if (error) throw new Error(error.message);
  return (data || []).map(mapPlant);
}

export async function createPlant(
    name: string,
    common_name: string,
    other_name: string,
    watering: string,
    sunlight: string,
    last_watered?: string,
    image_url?: string
    ): Promise<Plant> {
        const { data, error } = await supabase
        .from('plant')
        .insert({
            name,
            common_name,
            other_name,
            watering,
            sunlight,
            last_watered,
            image_url,
            })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return mapPlant(data);
}

export async function updatePlant(
    id: number | string,
    name: string
    ): Promise<Plant> {
    const { data, error } = await supabase
        .from('plant')
        .update({ name })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return mapPlant(data);
}

export async function deletePlant(id: number | string): Promise<void> {
    const { error } = await supabase.from('plant').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

export async function hasPlants(): Promise<boolean> {
  const { count, error } = await supabase
    .from('plant')
    .select('id', { count: 'exact', head: true });

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function getPlantById(id: number | string): Promise<Plant | null> {
  const { data, error } = await supabase
    .from('plant')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapPlant(data) : null;
}