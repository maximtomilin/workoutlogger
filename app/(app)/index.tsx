import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/primitives/Screen';
import { Stack } from '@/components/primitives/Stack';
import { Text } from '@/components/primitives/Text';
import { StyledButton } from '@/components/StyledButton';
import { capturePhoto, setPendingPhoto } from '@/services/photo';
import { hasPlants } from '@/services/plantService';
import { showAlert } from '@/services/showAlert';
import { colors, spacing } from '@/theme';

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
        if (active) setIsCheckingPlants(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const handleGetStarted = async () => {
    setIsLoading(true);

    try {
      const photo = await capturePhoto();

      if (photo) {
        setPendingPhoto(photo);
        router.push('/add-plant' as any);
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      showAlert('Error', 'Failed to capture plant photo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartWithoutPhoto = () => {
    setPendingPhoto(null); // make sure no old photo is carried over
    router.push('/add-plant' as any);
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
    width: 260,
    alignItems: 'stretch',
    marginTop: spacing.lg,
    gap: 12,
  },
  buttonWrapper: {
    width: '100%',
  },
});