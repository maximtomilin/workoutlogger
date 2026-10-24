import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/primitives/Screen';
import { Stack } from '@/components/primitives/Stack';
import { Text } from '@/components/primitives/Text';
import { StyledButton } from '@/components/StyledButton';
import { colors, spacing } from "@/theme";

export default function HomeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = async () => {
    setIsLoading(true);

    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Camera access is required to take plant photos.');
        setIsLoading(false);
        return;
      }

      // Launch camera with base64 enabled
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true, // Generate base64 data string
      });

      if (!result.canceled && result.assets[0]?.base64) {
        const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;

        router.push({
          pathname: '/add-plant',
          params: { photoUri: encodeURIComponent(base64Uri) },
        } as any);
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture plant photo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen padding="lg" backgroundColor={colors.background}>
      <View style={styles.centerContainer}>
        <Stack gap="lg">
          <Stack gap="sm">
            <Text size="xl" weight="bold">
              Welcome to the Plant Care App
            </Text>
            <Text size="md">
              Manage your plants and their care easily.
            </Text>
          </Stack>

          <View style={styles.buttonContainer}>
            <StyledButton
              label="Get Started" 
              onPress={handleGetStarted} 
              variant="primary" 
              isLoading={isLoading}
            />
          </View>
        </Stack>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
});