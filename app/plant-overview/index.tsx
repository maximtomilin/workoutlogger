import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { Text } from '@/components/primitives/Text';
import { StyledButton } from '@/components/StyledButton';
import { getPlants } from '@/services/plantService';
import type { Plant } from '@/types';
import { colors } from '@/theme';

/* -------------------------------------------------------------------------- */
/*  Config & helpers                                                          */
/* -------------------------------------------------------------------------- */

// Change this to wherever your Add Plant screen lives
const ADD_PLANT_ROUTE = '/add-plant';

const ACCENT = colors.accent || '#2D6A4F';
const NUM_COLUMNS = 2;
const GRID_GAP = 12;

/** "Today", "Yesterday", "5 days ago". Returns '' if the date can't be read. */
const formatLastWatered = (value?: string): string => {
  if (!value) return 'Not watered yet';

  // Take only YYYY-MM-DD so the result doesn't shift with timezones
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '';

  const watered = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Math.round((today.getTime() - watered.getTime()) / 86_400_000);
  if (days <= 0) return 'Watered today';
  if (days === 1) return 'Watered yesterday';
  return `Watered ${days} days ago`;
};

/** Pads the list to an even length so a lone last card keeps half width. */
type GridItem = Plant | { id: 'spacer' };
const withSpacer = (plants: Plant[]): GridItem[] =>
  plants.length % NUM_COLUMNS === 0 ? plants : [...plants, { id: 'spacer' }];

/* -------------------------------------------------------------------------- */
/*  Card                                                                      */
/* -------------------------------------------------------------------------- */

function PlantCard({ plant, onPress }: { plant: Plant; onPress: () => void }) {
  const subtitle = plant.common_name || plant.other_name;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressedState]}
      onPress={onPress}
    >
      {plant.image_url ? (
        <Image source={{ uri: plant.image_url }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.imagePlaceholder]}>
          <Text size="xl">🌿</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <Text weight="bold" numberOfLines={1}>
          {plant.name}
        </Text>
        {subtitle ? (
          <Text size="sm" color="#666" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        <Text size="sm" color="#888" style={styles.cardMeta}>
          {formatLastWatered(plant.last_watered)}
        </Text>
      </View>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*  Screen                                                                    */
/* -------------------------------------------------------------------------- */

export default function PlantsScreen() {
  const router = useRouter();

  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlants = useCallback(async () => {
    try {
      setError(null);
      setPlants(await getPlants());
    } catch (e: any) {
      setError(e.message || 'Failed to load plants.');
    }
  }, []);

  // Reload every time the screen comes into focus (e.g. after adding a plant)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        await loadPlants();
        if (active) setIsLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [loadPlants])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPlants();
    setIsRefreshing(false);
  };

  const renderItem = ({ item }: { item: GridItem }) => {
    if (item.id === 'spacer') return <View style={styles.spacer} />;
    const plant = item as Plant;
    return (
      <PlantCard
        plant={plant}
        // Hook up a details screen here when you have one
        onPress={() => console.log('Pressed plant', plant.id)}
      />
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;

    if (error) {
      return (
        
        <View style={styles.centered}>
          <View style={styles.footer}>
        </View>
          <Text weight="bold">Couldn't load your plants</Text>
          <Text size="sm" color="#666" style={styles.centeredText}>
            {error}
          </Text>
          <View style={styles.emptyButton}>
            <StyledButton label="Try again" onPress={handleRefresh} variant="secondary" />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.centered}>
        <Text size="xl">🪴</Text>
        <Text weight="bold" style={styles.centeredText}>
          No plants yet
        </Text>
        <Text size="sm" color="#666" style={styles.centeredText}>
          Add your first plant to start tracking its care.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            
            <Text size="xl" weight="bold">
              My Plants
            </Text>
            {!isLoading && plants.length > 0 ? (
              <Text size="sm" color="#666">
                {plants.length} {plants.length === 1 ? 'plant' : 'plants'}
              </Text>
            ) : null}
          </View>
          <StyledButton
            label="Add Plant"
            onPress={() => router.push(ADD_PLANT_ROUTE as any)}
            variant="primary"
          />
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={ACCENT} />
          </View>
        ) : (
          <FlatList
            data={withSpacer(plants)}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={styles.row}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.listContent, plants.length === 0 && styles.listEmpty]}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={ACCENT}
                colors={[ACCENT]}
              />
            }
          />
        )}
        </View>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F7F9F7',
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background || '#F7F9F7',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: GRID_GAP,
  },
  listEmpty: {
    flexGrow: 1,
  },
  row: {
    gap: GRID_GAP,
  },

  // Card
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    overflow: 'hidden',
  },
  spacer: {
    flex: 1,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#EAEAEA',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 12,
    gap: 2,
  },
  cardMeta: {
    marginTop: 4,
  },
  pressedState: {
    opacity: 0.6,
  },

  // Empty / error / loading
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
  emptyButton: {
    marginTop: 16,
    width: 150,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
});