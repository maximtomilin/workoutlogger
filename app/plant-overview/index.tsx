import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Image,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';

import { Screen } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { StyledButton } from '@/components/StyledButton';
import { getPlants } from '@/services/plantService';
import type { Plant } from '@/types/Plant';
import { colors } from '@/theme';

export default function PlantGridScreen() {
  const router = useRouter();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reload plant list whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCollection();
    }, [])
  );

  const fetchCollection = async () => {
    try {
      const data = await getPlants();
      setPlants(data || []);
    } catch (error) {
      console.error('Failed to load plant collection:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCollection();
  };

  const renderPlantCard = ({ item }: { item: Plant }) => {
    const imageUrl = item.imageUrl;

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => router.push(`/${item.id}` as any)}
      >
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImage, styles.placeholderImage]}>
              <Text size="xl">🌿</Text>
            </View>
          )}
        </View>

        <View style={styles.cardDetails}>
          <Text weight="bold" size="md" numberOfLines={1}>
            {item.name}
          </Text>

          <Text size="sm" color="#666" numberOfLines={1} style={{ marginTop: 2 }}>
            {item.plantType}
          </Text>

          {/* Care Quick Badges */}
          <View style={styles.badgeRow}>
            {item.watering ? (
              <View style={styles.badge}>
                <Text size="sm" color={colors.accent || '#2D6A4F'}>
                  💧 {item.watering}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <Screen backgroundColor={colors.background}>
        <View style={styles.header}>
          <View>
            <Text size="xl" weight="bold">
              My Plant Oasis
            </Text>
            <Text size="sm" color="#666">
              {plants.length} {plants.length === 1 ? 'plant' : 'plants'} in collection
            </Text>
          </View>

          <View style={{ width: 110 }}>
            <StyledButton
              label="+ Add"
              onPress={() => router.push('/add-plant')}
              variant="primary"
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.accent || '#2D6A4F'} />
          </View>
        ) : plants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text size="xl">🪴</Text>
            <Text weight="bold" size="md" style={{ marginTop: 12 }}>
              No plants added yet
            </Text>
            <Text size="sm" color="#666" style={{ textAlign: 'center', marginTop: 4 }}>
              Tap the "+ Add" button above to track your first plant.
            </Text>
          </View>
        ) : (
          <FlatList
            data={plants}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderPlantCard}
            numColumns={2}
            columnWrapperStyle={styles.rowWrapper}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent || '#2D6A4F']} />
            }
          />
        )}
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background || '#F7F9F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  rowWrapper: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  card: {
    flex: 0.485,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    width: '100%',
    height: 130,
    backgroundColor: '#EAEAEA',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF2EE',
  },
  cardDetails: {
    padding: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 4,
  },
  badge: {
    backgroundColor: '#EBF5F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
});