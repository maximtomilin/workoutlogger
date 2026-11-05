import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export async function takePlantPhoto(): Promise<string | null> {
  // 1. Request camera permissions
  const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

  if (!permissionResult.granted) {
    Alert.alert(
      'Permission Denied',
      'You need to grant camera access to take photos of your plants.'
    );
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],   
    quality: 0.8,       
  });

  if (!result.canceled && result.assets[0]?.uri) {
    return result.assets[0].uri;
  }

  return null;
}