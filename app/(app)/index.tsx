import { useEffect, useState } from 'react';
import { FlatList, ActivityIndicator, View, StyleSheet, Image } from 'react-native';
import { useAuthStore } from '../../src/state/useAuthStore';
import { Screen } from '../../src/components/primitives/Screen';
import { Stack } from '../../src/components/primitives/Stack';
import { Text } from '../../src/components/primitives/Text';
import { EmptyState } from '../../src/components/primitives/EmptyState';
import { StyledButton } from '../../src/components/StyledButton';
import { Badge } from "@/components/primitives";
import { colors, spacing } from "@/theme";
import { getPlantList } from '../../src/services/plantService';
import type { PlantSpecies } from '../../src/types/PlantSpecies';

export default function HomeScreen() {
  const { user, logout } = useAuthStore?.() || { user: null, logout: () => {} };

  const [plants, setPlants] = useState<PlantSpecies[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlants();
  }, []);

  const loadPlants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = (await getPlantList()) as { data: PlantSpecies[] };
      setPlants(response.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load plants.');
    } finally {
      setLoading(false);
    }
  };

  const renderPlantCard = ({ item }: { item: PlantSpecies }) => (
    <View style={styles.card}>
      {item.default_image?.thumbnail ? (
        <Image 
          source={{ uri: item.default_image.thumbnail }} 
          style={styles.plantImage} 
        />
      ) : (
        <View style={[styles.plantImage, styles.placeholderImage]}>
          <Text size="sm">No Image</Text>
        </View>
      )}

      {/* FIXED: Removed 'style' prop from Stack and applied to View container instead */}
      <View style={styles.cardContent}>
        <Stack gap="sm">
          <Text weight="bold" size="md">{item.common_name || 'Unknown Plant'}</Text>
          {item.scientific_name?.[0] && (
            <Text size="sm">
              {item.scientific_name[0]}
            </Text>
          )}
          {/* FIXED: Removed unsupported 'direction' and 'style' props from Stack */}
          <View style={styles.badgeRow}>
            {item.watering && <Badge label={`Water: ${item.watering}`} variant="default" />}
            {item.cycle && <Badge label={item.cycle} variant="success" />}
          </View>
        </Stack>
      </View>
    </View>
  );

  return (
    <Screen padding="lg" backgroundColor={colors.background}>
      {/* FIXED: Applied flex style to outer View instead of Stack */}
      <View style={styles.container}>
        <Stack gap="lg">
          {/* Header */}
          <Stack gap="sm">
            <Text size="xl" weight="bold">
              {user?.email ? `Welcome, ${user.email}` : 'Welcome to Plant Tracker'}
            </Text>
            <Badge label="Plant Library" variant="success" />
          </Stack>

          {/* Content States */}
          {loading ? (
            <View style={styles.centerContainer}>
              {/* FIXED: Changed colors.primary to colors.accent */}
              <ActivityIndicator size="large" color={colors.accent} />
              <Text size="sm">Loading plants...</Text>
            </View>
          ) : error ? (
            <EmptyState
              title="Unable to load plants"
              description={error}
              action={<StyledButton label="Retry" onPress={loadPlants} />}
            />
          ) : (
            <FlatList
              data={plants}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderPlantCard}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <EmptyState
                  title="No plants found"
                  description="Check back later or try searching for another species."
                />
              }
            />
          )}

          {/* Action Button */}
          {logout && (
            <StyledButton label="Log out" onPress={logout} variant="secondary" />
          )}
        </Stack>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  plantImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
});