import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { showAlert } from '@/services/showAlert';

/**
 * A photo can be hundreds of KB of base64. On native it's fine as a route param,
 * but on web route params end up in the URL, which breaks navigation.
 * So we hand the photo from screen to screen through this in-memory holder instead.
 */
let pendingPhoto: string | null = null;

export const setPendingPhoto = (uri: string | null) => {
  pendingPhoto = uri;
};

export const getPendingPhoto = (): string | null => pendingPhoto;

/** Opens the camera. Returns a data URI, or null if cancelled / failed. */
export async function capturePhoto(): Promise<string | null> {
  // On web the picker uses a file input, so there is no camera permission to ask for
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showAlert('Permission Denied', 'Camera access is required to take plant photos.');
      return null;
    }
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
    base64: true,
  });

  if (result.canceled) return null;

  const asset = result.assets?.[0];
  if (asset?.base64) {
    return `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`;
  }
  // On web the uri is already a data URI
  if (asset?.uri?.startsWith('data:')) return asset.uri;

  showAlert('Error', 'Could not read the photo.');
  return null;
}