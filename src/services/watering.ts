export type WateringStatus = { label: string; overdue: boolean; dueToday: boolean };

export const getWateringStatus = (
  lastWatered?: string,
  intervalDays?: number
): WateringStatus | null => {
  if (!lastWatered || !intervalDays) return null;

  const [y, m, d] = lastWatered.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;

  const due = new Date(y, m - 1, d + intervalDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (diff < 0) return { label: `Overdue by ${-diff} ${-diff === 1 ? 'day' : 'days'}`, overdue: true, dueToday: false };
  if (diff === 0) return { label: 'Water today', overdue: false, dueToday: true };
  if (diff === 1) return { label: 'Water tomorrow', overdue: false, dueToday: false };
  return { label: `Water in ${diff} days`, overdue: false, dueToday: false };
};