import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { StyledButton } from '@/components/StyledButton';
import { Text } from '@/components/primitives/Text';
import { Stack } from '@/components/primitives/Stack';

interface AddPlantPhotoSectionProps {
  photoUri: string | null;
  onTakePhoto: () => void;
}

export function AddPlantPhotoSection({ photoUri, onTakePhoto }: AddPlantPhotoSectionProps) {
  return (
    <Stack gap="md">
      <View style={styles.imagePreviewContainer}>
        {photoUri ? (
          <Image 
            source={{ uri: photoUri }} 
            style={styles.previewImage} 
            resizeMode="cover"
            onError={(e) => console.error("Image load error:", e.nativeEvent.error, "URI:", photoUri)}
          />
        ) : (
          <View style={[styles.previewImage, styles.placeholderBox]}>
            <Text color="#888">No photo captured yet</Text>
          </View>
        )}
      </View>

      <StyledButton
        label={photoUri ? 'Retake Photo' : 'Take Plant Photo'}
        onPress={onTakePhoto}
        variant="secondary"
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  imagePreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderStyle: 'dashed',
  },
});