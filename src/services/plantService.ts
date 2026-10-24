import type { PlantSpecies } from '../types/PlantSpecies';

// 1. Fallback to your hardcoded key string if process.env isn't loaded
const PERENUAL_API_KEY = process.env.EXPO_PUBLIC_PERENUAL_API_KEY || 'YOUR_REAL_API_KEY_HERE';

export async function getPlantList(query?: string) {
  if (!PERENUAL_API_KEY || PERENUAL_API_KEY === 'undefined') {
    throw new Error('Perenual API Key is missing!');
  }

  let url = `https://perenual.com/api/v2/species-list?key=${PERENUAL_API_KEY}&indoor=1&poisonous=0`;

  if (query && query.trim() !== '') {
    url += `&q=${encodeURIComponent(query.trim())}`;
  }

  console.log('Fetching URL:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Perenual API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data as { data: PlantSpecies[] };
}