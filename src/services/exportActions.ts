import { Platform, Share } from 'react-native';
import { formatAsText, type WorkoutExport } from './exportService';

function fileName(w: WorkoutExport): string {
  const slug = w.workoutName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug || 'workout'}-${w.completedAt.slice(0, 10)}.txt`;
}

// Web: downloads a .txt file. Native: opens the share sheet (save to Files, Notes, etc.)
export async function exportText(w: WorkoutExport): Promise<void> {
  const text = formatAsText(w);
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName(w);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return;
  }
  await Share.share({ message: text, title: fileName(w) });
}