import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Text } from '@/components/primitives/Text';
import { StyledButton } from '@/components/StyledButton';
import { getPlantById, updateLastWatered, updatePlantCare } from '@/services/plantService';
import { showAlert } from '@/services/showAlert';
import { getWateringStatus } from '@/services/watering';
import type { Plant } from '@/types';
import { colors } from '@/theme';

const ACCENT = colors.accent || '#2D6A4F';

/** Default interval (days) for each watering category. Estimates, same as in add-plant. */
const CATEGORY_INTERVAL_DAYS: Record<string, number> = {
  frequent: 3,
  average: 7,
  minimum: 14,
};

const WATERING_OPTIONS = [
  { label: 'Frequent', value: 'Frequent' },
  { label: 'Average', value: 'Average' },
  { label: 'Minimum', value: 'Minimum' },
];

const SUNLIGHT_OPTIONS = [
  { label: 'Full sun', value: 'full sun' },
  { label: 'Part shade', value: 'part shade' },
  { label: 'Full shade', value: 'full shade' },
];

type CarePatch = Partial<Pick<Plant, 'watering' | 'sunlight' | 'water_interval_days'>>;

const isUnknown = (value?: string | null): boolean =>
  !value || !value.trim() || value.trim().toLowerCase() === 'unknown';

const todayString = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** "Today", "Yesterday", "5 days ago" plus the date itself. */
const formatLastWatered = (value?: string): string => {
  if (!value) return 'Not watered yet';

  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '';

  const watered = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Math.round((today.getTime() - watered.getTime()) / 86_400_000);
  const relative = days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;

  return `${relative} (${value.slice(0, 10)})`;
};

/* -------------------------------------------------------------------------- */
/*  Small components                                                          */
/* -------------------------------------------------------------------------- */

function InfoRow({
  label,
  value,
  valueColor,
  children,
}: {
  label: string;
  value?: string;
  valueColor?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.infoRow}>
      <Text size="sm" color="#888">
        {label}
      </Text>
      <Text weight="medium" color={valueColor}>
        {value || 'Unknown'}
      </Text>
      {children}
    </View>
  );
}

function ChoiceChips({
  options,
  onSelect,
  disabled,
}: {
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          disabled={disabled}
          style={({ pressed }) => [
            styles.chip,
            pressed && styles.pressedState,
            disabled && styles.chipDisabled,
          ]}
          onPress={() => onSelect(option.value)}
        >
          <Text size="sm">{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function IntervalEditor({
  onSave,
  isSaving,
}: {
  onSave: (days: number) => void;
  isSaving: boolean;
}) {
  const [text, setText] = useState('');

  const submit = () => {
    const days = parseInt(text, 10);
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      showAlert('Invalid number', 'Enter a number of days between 1 and 365.');
      return;
    }
    onSave(days);
  };

  return (
    <View style={styles.intervalRow}>
      <Text size="sm" color="#666">
        Every
      </Text>
      <TextInput
        style={styles.intervalInput}
        value={text}
        onChangeText={(t) => setText(t.replace(/[^0-9]/g, ''))}
        placeholder="7"
        placeholderTextColor="#AAA"
        keyboardType="number-pad"
        maxLength={3}
      />
      <Text size="sm" color="#666">
        days
      </Text>
      <View style={styles.intervalButton}>
        <StyledButton label="Save" onPress={submit} variant="secondary" isLoading={isSaving} />
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Screen                                                                    */
/* -------------------------------------------------------------------------- */

export default function PlantDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [plant, setPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWatering, setIsWatering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleWater = async () => {
    if (!plant) return;

    const today = todayString();
    setIsWatering(true);

    try {
      await updateLastWatered(plant.id, today);
      setPlant({ ...plant, last_watered: today });
    } catch (e: any) {
      showAlert('Error', e.message || 'Failed to update watering date.');
    } finally {
      setIsWatering(false);
    }
  };

  /** Saves user-provided care info and updates the screen. */
  const savePatch = async (patch: CarePatch) => {
    if (!plant) return;
    setIsSaving(true);

    try {
      await updatePlantCare(plant.id, patch);
      setPlant({ ...plant, ...patch });
    } catch (e: any) {
      showAlert('Error', e.message || 'Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickWatering = (value: string) => {
    const patch: CarePatch = { watering: value };
    // No interval yet? Use the default for this category so the schedule works right away
    if (!plant?.water_interval_days) {
      patch.water_interval_days = CATEGORY_INTERVAL_DAYS[value.toLowerCase()];
    }
    savePatch(patch);
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

  const status = getWateringStatus(plant.last_watered, plant.water_interval_days);
  const wateredToday = plant.last_watered?.slice(0, 10) === todayString();

  const wateringUnknown = isUnknown(plant.watering);
  const sunlightUnknown = isUnknown(plant.sunlight);
  const intervalUnknown = !plant.water_interval_days;

  const scheduleText = plant.water_interval_days
    ? `Every ~${plant.water_interval_days} days${status ? ` · ${status.label}` : ''}`
    : 'Not set';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
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

          <InfoRow label="Watering" value={wateringUnknown ? 'Unknown' : plant.watering}>
            {wateringUnknown ? (
              <>
                <Text size="sm" color="#666" style={styles.editHint}>
                  Not available for this plant. Choose it yourself:
                </Text>
                <ChoiceChips
                  options={WATERING_OPTIONS}
                  onSelect={handlePickWatering}
                  disabled={isSaving}
                />
              </>
            ) : null}
          </InfoRow>
          <View style={styles.separator} />

          <InfoRow
            label="Watering schedule"
            value={scheduleText}
            valueColor={status?.overdue ? '#C53030' : undefined}
          >
            {intervalUnknown ? (
              <>
                <Text size="sm" color="#666" style={styles.editHint}>
                  How often should this plant be watered?
                </Text>
                <IntervalEditor
                  onSave={(days) => savePatch({ water_interval_days: days })}
                  isSaving={isSaving}
                />
              </>
            ) : null}
          </InfoRow>
          <View style={styles.separator} />

          <InfoRow label="Sunlight" value={sunlightUnknown ? 'Unknown' : plant.sunlight}>
            {sunlightUnknown ? (
              <>
                <Text size="sm" color="#666" style={styles.editHint}>
                  Not available for this plant. Choose it yourself:
                </Text>
                <ChoiceChips
                  options={SUNLIGHT_OPTIONS}
                  onSelect={(value) => savePatch({ sunlight: value })}
                  disabled={isSaving}
                />
              </>
            ) : null}
          </InfoRow>
          <View style={styles.separator} />

          <InfoRow label="Last watered" value={formatLastWatered(plant.last_watered)} />
        </View>

        <View style={styles.waterButton}>
          <StyledButton
            label={wateredToday ? 'Watered today ✓' : '💧 Water'}
            onPress={handleWater}
            variant="primary"
            isLoading={isWatering}
          />
        </View>

        <View style={styles.backButton}>
          <StyledButton label="Back to my plants" onPress={handleBack} variant="secondary" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

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

  // Editing unknown fields
  editHint: {
    marginTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EDF2F7',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipDisabled: {
    opacity: 0.5,
  },
  pressedState: {
    opacity: 0.6,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  intervalInput: {
    width: 64,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    textAlign: 'center',
    color: colors.text || '#000',
  },
  intervalButton: {
    width: 90,
    marginLeft: 'auto',
  },

  waterButton: {
    alignItems: 'center',
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