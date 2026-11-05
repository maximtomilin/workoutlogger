import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen } from '@/components/primitives/Screen';
import { Stack } from '@/components/primitives/Stack';
import { Text } from '@/components/primitives/Text';
import { StyledButton } from '@/components/StyledButton';
import { createPlant } from '@/services/plantService';
import { getPlantDetails, getPlantList } from '@/services/perenualService';
import type { PlantSpecies } from '@/types/PlantSpecies';
import { colors, spacing } from '@/theme';

/* -------------------------------------------------------------------------- */
/*  Constants & helpers                                                       */
/* -------------------------------------------------------------------------- */

const ACCENT = colors.accent || '#2D6A4F';
const SEARCH_DEBOUNCE_MS = 400;

/** Local-time YYYY-MM-DD (toISOString would use UTC and can be off by a day). */
const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const daysAgoString = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatDate(date);
};

const isValidDateString = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime()) && formatDate(parsed) === value;
};

const parsePhotoUri = (rawUri?: string): string | null => {
  if (!rawUri) return null;
  try {
    return decodeURIComponent(rawUri);
  } catch {
    return rawUri;
  }
};

/** Returns '' for non-strings, "N/A", and Perenual's free-tier upgrade placeholders. */
const cleanString = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed.toUpperCase() === 'N/A' || /upgrade plan/i.test(trimmed)) return '';
  return trimmed;
};

const toCleanList = (value: unknown): string[] => {
  const list = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  return list.map(cleanString).filter(Boolean);
};

const extractPlantInfo = (details: PlantSpecies | null, listItem: PlantSpecies | null) => {
  const sources = [details, listItem].filter(Boolean) as PlantSpecies[];

  const firstString = (pick: (s: PlantSpecies) => unknown): string => {
    for (const s of sources) {
      const v = cleanString(pick(s));
      if (v) return v;
    }
    return '';
  };

  const firstList = (pick: (s: PlantSpecies) => unknown): string[] => {
    for (const s of sources) {
      const v = toCleanList(pick(s));
      if (v.length > 0) return v;
    }
    return [];
  };

  const scientificName = firstList((s) => s.scientific_name)[0] ?? '';
  const otherNames = firstList((s) => s.other_name);

  return {
    commonName: firstString((s) => s.common_name),
    otherName: otherNames.length > 0 ? otherNames.join(', ') : scientificName,
    watering: firstString((s) => s.watering),
    sunlight: firstList((s) => s.sunlight).join(', '),
  };
};

const getThumbnail = (species?: PlantSpecies | null): string | undefined =>
  species?.default_image?.thumbnail || species?.default_image?.medium_url || undefined;

/* -------------------------------------------------------------------------- */
/*  Small components                                                          */
/* -------------------------------------------------------------------------- */

type DateChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function DateChip({ label, selected, onPress }: DateChipProps) {
  return (
    <Pressable style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text
        size="sm"
        weight={selected ? 'bold' : 'normal'}
        color={selected ? '#FFFFFF' : colors.text || '#333'}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type SpeciesPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (species: PlantSpecies) => void;
};

/** Owns its own search state so the main screen stays simple. */
function SpeciesPickerModal({ visible, onClose, onSelect }: SpeciesPickerModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlantSpecies[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const latestRequest = useRef(0);

  useEffect(() => {
    if (!visible) return;

    // Load the initial list right away, debounce once the user starts typing.
    const delay = query.trim() ? SEARCH_DEBOUNCE_MS : 0;

    const timer = setTimeout(async () => {
      const requestId = ++latestRequest.current;
      setIsLoading(true);
      try {
        const response = await getPlantList(query);
        if (requestId === latestRequest.current) {
          setResults(response.data || []);
        }
      } catch (error) {
        console.error('Failed to load plant species:', error);
      } finally {
        if (requestId === latestRequest.current) {
          setIsLoading(false);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [query, visible]);

  const renderItem = useCallback(
    ({ item }: { item: PlantSpecies }) => {
      const image = getThumbnail(item);
      return (
        <Pressable
          style={({ pressed }) => [styles.speciesItem, pressed && styles.pressedState]}
          onPress={() => onSelect(item)}
        >
          {image ? (
            <Image source={{ uri: image }} style={styles.modalItemImage} />
          ) : (
            <View style={[styles.modalItemImage, styles.placeholderBox]}>
              <Text size="lg" color="#AAA">
                🌿
              </Text>
            </View>
          )}

          <View style={styles.textContainer}>
            <Text weight="bold" size="md">
              {item.common_name}
            </Text>
            <Text size="sm" color="#666">
              {item.scientific_name?.[0] || 'Unknown scientific name'}
            </Text>
          </View>
        </Pressable>
      );
    },
    [onSelect]
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text size="lg" weight="bold">
              Search Species
            </Text>
            <Text size="sm" color="#666">
              Tap a species to select it
            </Text>
          </View>

          <TextInput
            style={[styles.input, styles.modalSearchInput]}
            placeholder="Type species name..."
            placeholderTextColor="#AAA"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />

          {isLoading ? (
            <ActivityIndicator size="large" color={ACCENT} style={styles.modalLoader} />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <Text size="sm" color="#888" style={styles.emptyText}>
                  No species found.
                </Text>
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.modalList}
              contentContainerStyle={styles.modalListContent}
            />
          )}

          <View style={styles.modalFooter}>
            <StyledButton label="Cancel" onPress={onClose} variant="secondary" />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Screen                                                                    */
/* -------------------------------------------------------------------------- */

export default function AddPlantScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ photoUri?: string }>();

  // Photo
  const [photoUri, setPhotoUri] = useState<string | null>(parsePhotoUri(params.photoUri));

  useEffect(() => {
    if (params.photoUri) setPhotoUri(parsePhotoUri(params.photoUri));
  }, [params.photoUri]);

  // Species selection (we only keep the ID, then look up the details by ID)
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [selectedSpeciesDetails, setSelectedSpeciesDetails] = useState<PlantSpecies | null>(null);
  const [selectedListItem, setSelectedListItem] = useState<PlantSpecies | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [plantType, setPlantType] = useState('');
  const [lastWatered, setLastWatered] = useState(() => daysAgoString(0));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch full plant details whenever the selected ID changes
  useEffect(() => {
    if (selectedPlantId === null) return;

    let cancelled = false;
    setIsLoadingDetails(true);

    getPlantDetails(selectedPlantId)
      .then((details) => {
        if (!cancelled) setSelectedSpeciesDetails(details);
      })
      .catch((error) => {
        console.error('Failed to fetch plant details for ID', selectedPlantId, error);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDetails(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedPlantId]);

  const handleSelectSpecies = useCallback((species: PlantSpecies) => {
  setSelectedListItem(species);
  setSelectedSpeciesDetails((prev) => (prev?.id === species.id ? prev : null));
  setSelectedPlantId(species.id);
  setPlantType(species.common_name || '');
  setIsPickerOpen(false);
}, []);

  const handlePlantTypeChange = (text: string) => {
    setPlantType(text);
    // Typing a custom type means the species data no longer applies
    if (selectedPlantId !== null) {
      setSelectedPlantId(null);
      setSelectedSpeciesDetails(null);
      setSelectedListItem(null);
    }
  };

  const handleRetakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Camera access is required.');
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
      setPhotoUri(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !plantType.trim()) {
      Alert.alert('Missing Fields', 'Please fill in both the Plant Name and Plant Type.');
      return;
    }

    if (!isValidDateString(lastWatered)) {
      Alert.alert('Invalid Date', 'Please enter the last watered date as YYYY-MM-DD.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Make sure we have details for the selected ID, even if the effect hasn't finished
      let details = selectedSpeciesDetails;
      if (selectedPlantId !== null && (!details || details.id !== selectedPlantId)) {
        details = await getPlantDetails(selectedPlantId);
      }

      const info = extractPlantInfo(details, selectedListItem);
      console.log('Saving plant info:', info, { detailsLoaded: !!details });

      await createPlant(
        name.trim(),
        plantType.trim() || info.commonName,
        info.otherName,
        info.watering,
        info.sunlight,
        lastWatered,
        photoUri || undefined
      );

      Alert.alert('Success', 'Plant added to your collection!', [
        { text: 'OK', onPress: () => router.replace('/plant-overview') },
      ]);
    } catch (error: any) {
      Alert.alert('Database Error', error.message || 'Failed to save plant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const thumbnailUri = getThumbnail(selectedSpeciesDetails);
  const hasSelection = selectedPlantId !== null;

  const dateChips = [
    { label: 'Today', daysAgo: 0 },
    { label: 'Yesterday', daysAgo: 1 },
    { label: '1 Week Ago', daysAgo: 7 },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <Screen backgroundColor={colors.background}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <Stack gap="lg">
            <View>
              <Text size="xl" weight="bold">
                Add Plant
              </Text>
              <Text size="sm" color="#666">
                Enter basic details to track your plant
              </Text>
            </View>

            {/* Photo */}
            <View style={styles.photoContainer}>
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                  onError={(e) => console.error('Image load error:', e.nativeEvent.error)}
                />
              ) : (
                <View style={[styles.previewImage, styles.placeholderBox]}>
                  <Text color="#888">No photo taken</Text>
                </View>
              )}
              <View style={styles.retakeButtonWrapper}>
                <StyledButton
                  label={photoUri ? 'Retake Photo' : 'Take Photo'}
                  onPress={handleRetakePhoto}
                  variant="secondary"
                />
              </View>
            </View>

            {/* Species lookup */}
            <View>
              <Text size="sm" weight="medium" style={styles.fieldLabel}>
                Species Preset (Optional)
              </Text>
              <Pressable
                style={({ pressed }) => [styles.dropdownTrigger, pressed && styles.pressedState]}
                onPress={() => setIsPickerOpen(true)}
              >
                {thumbnailUri ? (
                  <Image source={{ uri: thumbnailUri }} style={styles.speciesThumbnail} />
                ) : null}

                <View style={styles.textContainer}>
                  <Text
                    weight={hasSelection ? 'medium' : 'normal'}
                    color={hasSelection ? colors.text : '#888'}
                  >
                    {selectedSpeciesDetails?.common_name ||
                      (hasSelection ? plantType : '') ||
                      'Search species to auto-fill type...'}
                  </Text>
                  {selectedSpeciesDetails?.scientific_name?.[0] ? (
                    <Text size="sm" color="#666">
                      {selectedSpeciesDetails.scientific_name[0]}
                    </Text>
                  ) : null}
                </View>

                {isLoadingDetails ? (
                  <ActivityIndicator size="small" color={ACCENT} />
                ) : (
                  <Text color="#888" weight="bold">
                    🔍
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Form fields */}
            <Stack gap="md">
              <View>
                <Text size="sm" weight="medium" style={styles.fieldLabel}>
                  Plant Name *
                </Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Sunny or Living Room Monstera"
                  placeholderTextColor="#AAA"
                />
              </View>

              <View>
                <Text size="sm" weight="medium" style={styles.fieldLabel}>
                  Plant Type *
                </Text>
                <TextInput
                  style={styles.input}
                  value={plantType}
                  onChangeText={handlePlantTypeChange}
                  placeholder="e.g. Monstera Deliciosa, Snake Plant, Fern"
                  placeholderTextColor="#AAA"
                />
              </View>

              <View>
                <Text size="sm" weight="medium" style={styles.fieldLabel}>
                  Last Watered
                </Text>

                <View style={styles.chipRow}>
                  {dateChips.map(({ label, daysAgo }) => {
                    const value = daysAgoString(daysAgo);
                    return (
                      <DateChip
                        key={label}
                        label={label}
                        selected={lastWatered === value}
                        onPress={() => setLastWatered(value)}
                      />
                    );
                  })}
                </View>

                <TextInput
                  style={[styles.input, styles.dateInput]}
                  value={lastWatered}
                  onChangeText={setLastWatered}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#AAA"
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
              </View>
            </Stack>

            {/* Submit */}
            <View style={styles.buttonContainer}>
              <StyledButton
                label="Save Plant"
                onPress={handleSubmit}
                variant="primary"
                isLoading={isSubmitting}
              />
            </View>
          </Stack>
        </ScrollView>

        <SpeciesPickerModal
          visible={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelect={handleSelectSpecies}
        />
      </Screen>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  // Photo
  photoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#EAEAEA',
  },
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCC',
    borderStyle: 'dashed',
  },
  retakeButtonWrapper: {
    marginTop: 12,
    width: 150,
  },

  // Form
  fieldLabel: {
    marginBottom: 6,
    color: colors.text || '#222',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text || '#000',
  },
  dateInput: {
    marginTop: 8,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  buttonContainer: {
    marginTop: spacing.xs || 8,
    marginBottom: spacing.lg || 32,
  },

  // Species trigger
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  speciesThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#EAEAEA',
  },

  // Date chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EDF2F7',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipSelected: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },

  // Modal
  modalContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: colors.background || '#F7F9F7',
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalSearchInput: {
    fontSize: 16,
    paddingVertical: 14,
  },
  modalLoader: {
    marginTop: 28,
  },
  modalList: {
    flex: 1,
    marginTop: 12,
  },
  modalListContent: {
    paddingBottom: 16,
  },
  modalFooter: {
    marginTop: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
  },
  speciesItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 16,
  },
  modalItemImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#EAEAEA',
  },
  separator: {
    height: 1,
    backgroundColor: '#EDF2F7',
  },
  pressedState: {
    opacity: 0.6,
  },
});