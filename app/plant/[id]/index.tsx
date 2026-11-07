import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Text } from '@/components/primitives/Text';
import { StyledButton } from '@/components/StyledButton';
import { getPlantById } from '@/services/plantService';
import type { Plant } from '@/types';
import { colors } from '@/theme';

const ACCENT = colors.accent || '#2D6A4F';

/** "Today", "Yesterday", "5 days ago" plus the date itself. */
const formatLastWatered = (value?: string): string => {
  if (!value) return 'Not watered yet';

  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '';

  const watered = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Math.round((today.getTime() - watered.getTime()) / 86_400_000);
  const relative =
    days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;

  return `${relative} (${value.slice(0, 10)})`;
};

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text size="sm" color="#888">
        {label}
      </Text>
      <Text weight="medium">{value || 'Unknown'}</Text>
    </View>
  );
}

export default function PlantDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [plant, setPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let active = true;
    setIsLoading(true);
    setError(null);

    getPlantById(id)
      .then((result) => {
        if (active) setPlant(result);
      })
      .catch((e) => {
        if (active) setError(e.message || 'Failed to load plant.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/plant-overview' as any);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !plant) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text weight="bold">{error ? "Couldn't load this plant" : 'Plant not found'}</Text>
          {error ? (
            <Text size="sm" color="#666" style={styles.centeredText}>
              {error}
            </Text>
          ) : null}
          <View style={styles.backButtonSmall}>
            <StyledButton label="Go back" onPress={handleBack} variant="secondary" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {plant.image_url ? (
          <Image source={{ uri: plant.image_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text size="xl">🌿</Text>
          </View>
        )}

        <View style={styles.titleBlock}>
          <Text size="xl" weight="bold">
            {plant.name}
          </Text>
          {plant.common_name ? (
            <Text size="md" color="#666">
              {plant.common_name}
            </Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <InfoRow label="Other names" value={plant.other_name} />
          <View style={styles.separator} />
          <InfoRow label="Watering" value={plant.watering} />
          <View style={styles.separator} />
          <InfoRow label="Sunlight" value={plant.sunlight} />
          <View style={styles.separator} />
          <InfoRow label="Last watered" value={formatLastWatered(plant.last_watered)} />
        </View>

        <View style={styles.backButton}>
          <StyledButton label="Back to my plants" onPress={handleBack} variant="secondary" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background || '#F7F9F7',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  centeredText: {
    marginTop: 6,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#EAEAEA',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    gap: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  infoRow: {
    paddingVertical: 14,
    gap: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#EDF2F7',
  },
  backButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonSmall: {
    marginTop: 16,
    width: 150,
  },
});