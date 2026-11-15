export type RepRange =
  | { error: null; repMin: number | null; repMax: number | null }
  | { error: string };

// A rep range is optional, but both ends must be filled in together
export function parseRepRange(minText: string, maxText: string): RepRange {
  const a = minText.trim();
  const b = maxText.trim();
  if (a === '' && b === '') return { error: null, repMin: null, repMax: null };
  if (a === '' || b === '') {
    return { error: 'Fill in both ends of the rep range, or leave both empty.' };
  }
  const repMin = parseInt(a, 10);
  const repMax = parseInt(b, 10);
  if (Number.isNaN(repMin) || Number.isNaN(repMax) || repMin < 1 || repMax < 1) {
    return { error: 'The rep range must be positive numbers.' };
  }
  if (repMin > repMax) return { error: 'The minimum reps cannot be higher than the maximum.' };
  return { error: null, repMin, repMax };
}