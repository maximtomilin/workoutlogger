import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/primitives/Screen';
import { Stack } from '@/components/primitives/Stack';
import { Text } from '@/components/primitives/Text';
import { StyledButton } from '@/components/StyledButton';
import { hasPlants } from '@/services/plantService';
import { colors, spacing } from '@/theme';

// Change this to the route of your plant overview screen
const PLANTS_ROUTE = '/plant-overview';

export default function HomeScreen() {
  const router = useRouter();
  const [isCheckingPlants, setIsCheckingPlants] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // If the user already has plants, skip the welcome screen
  useEffect(() => {
    let active = true;

    hasPlants()
      .then((exists) => {
        if (!active) return;
        if (exists) {
          router.replace(PLANTS_ROUTE as any);
        } else {
          setIsCheckingPlants(false);
        }
      })
      .catch((error) => {
        console.error('Plant check failed:', error);
        // On failure, fall back to the normal welcome screen
        if (active) setIsCheckingPlants(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const handleStartWithoutPhoto = () => {
    router.push('/add-plant' as any);
  };

  const handleGetStarted = async () => {
    setIsLoading(true);

    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Camera access is required to take plant photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
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

  // Avoid flashing the welcome screen before a redirect
  if (isCheckingPlants) {
    return (
      <Screen backgroundColor={colors.background}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent || '#2D6A4F'} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padding="lg" backgroundColor={colors.background}>
      <View style={styles.centerContainer}>
        <Stack gap="lg">
          <Stack gap="sm">
            <Text size="xl" weight="bold">
              Welcome to the Plant Care App
            </Text>
            <Text size="md">Manage your plants and their care easily.</Text>
          </Stack>

          <View style={styles.buttonContainer}>
            <View style={styles.buttonWrapper}>
              <StyledButton
                label="Get Started with Photo"
                onPress={handleGetStarted}
                variant="primary"
                isLoading={isLoading}
              />
            </View>
            <View style={styles.buttonWrapper}>
              <StyledButton
                label="Start without Photo"
                onPress={handleStartWithoutPhoto}
                variant="secondary"
              />
            </View>
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
    gap: 12,
  },
  buttonWrapper: {
    width: '100%',
  },
});