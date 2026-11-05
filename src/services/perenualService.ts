import type { PlantSpecies } from '../types/PlantSpecies';

// 1. Fallback to your hardcoded key string if process.env isn't loaded
const PERENUAL_API_KEY = process.env.EXPO_PUBLIC_PERENUAL_API_KEY || 'YOUR_REAL_API_KEY_HERE';

export async function getPlantList(query?: string) {
  if (!PERENUAL_API_KEY || PERENUAL_API_KEY === 'undefined') {
    throw new Error('Perenual API Key is missing!');
  }

  let url = `https://perenual.com/api/v2/species-list?key=${PERENUAL_API_KEY}&indoor=1`;

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

export async function getPlantDetails(plantId: number): Promise<PlantSpecies | null> {
  if (!PERENUAL_API_KEY || PERENUAL_API_KEY === 'undefined') {
    console.warn('Perenual API Key is missing!');
    return null;
  }

  const url = `https://perenual.com/api/v2/species-details/${plantId}?key=${PERENUAL_API_KEY}`;
  console.log('Fetching Details URL:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();

    // 1. Check if the response is HTML error page instead of JSON
    if (!response.ok || responseText.trim().startsWith('<')) {
      console.warn(`Details endpoint returned HTML or status ${response.status} for ID ${plantId}`);
      return null;
    }

    // 2. Parse JSON safely
    const parsedData = JSON.parse(responseText);

    // 3. Handle both root-level object AND { data: { ... } } structures
    const plantObject = parsedData.data ? parsedData.data : parsedData;

    return plantObject as PlantSpecies;
  } catch (error) {
    console.warn(`Failed to parse details for plant ID ${plantId}:`, error);
    return null;
  }
}