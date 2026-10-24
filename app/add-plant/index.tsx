import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  Image, 
  ScrollView, 
  Alert,
  Modal,
  FlatList,
  Pressable,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/primitives/Screen';
import { Stack } from '@/components/primitives/Stack';
import { Text } from '@/components/primitives/Text';
import { StyledButton } from '@/components/StyledButton';
import { createPlant } from '@/services/housePlantService';
import { getPlantList } from '@/services/plantService';
import type { PlantSpecies } from '@/types/PlantSpecies';
import { colors, spacing } from '@/theme';

export default function AddPlantScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ photoUri?: string }>();

  // Safely parse base64 photo URI from params
  const parsePhotoUri = (rawUri?: string) => {
    if (!rawUri) return null;
    try {
      return decodeURIComponent(rawUri);
    } catch {
      return rawUri;
    }
  };

  const [photoUri, setPhotoUri] = useState<string | null>(parsePhotoUri(params.photoUri));

  useEffect(() => {
    if (params.photoUri) {
      setPhotoUri(parsePhotoUri(params.photoUri));
    }
  }, [params.photoUri]);

  // API Dropdown State
  const [speciesList, setSpeciesList] = useState<PlantSpecies[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<PlantSpecies | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Simplified Form State
  const [name, setName] = useState('');
  const [plantType, setPlantType] = useState('');
  const [lastWatered, setLastWatered] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSpecies();
  }, []);

  // Debounced API search effect
  useEffect(() => {
    if (!isDropdownOpen) return;

    const timer = setTimeout(() => {
      fetchSpecies(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, isDropdownOpen]);

  const fetchSpecies = async (query?: string) => {
    setIsLoadingApi(true);
    try {
      const response = await getPlantList(query);
      setSpeciesList(response.data || []);
    } catch (error) {
      console.error('Failed to load plant species:', error);
    } finally {
      setIsLoadingApi(false);
    }
  };

  const handleSelectSpecies = (species: PlantSpecies) => {
    setSelectedSpecies(species);
    setPlantType(species.common_name || '');
    setIsDropdownOpen(false);
  };

  const handleRetakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
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

  const setQuickDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    setLastWatered(date.toISOString().split('T')[0]);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !plantType.trim()) {
      Alert.alert('Missing Fields', 'Please fill in both the Plant Name and Plant Type.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createPlant(
        name.trim(),
        plantType.trim(),
        'N/A',            // other_name fallback
        'Average',        // watering default
        'Full sun',       // sunlight default
        lastWatered,      // last_watered date string
        undefined         // camera photo kept in local UI state
      );

      Alert.alert('Success', 'Plant added to your collection!', [
        {
          text: 'OK',
          onPress: () => router.replace('/'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Database Error', error.message || 'Failed to save plant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <Screen backgroundColor={colors.background}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Stack gap="lg">
            <View>
              <Text size="xl" weight="bold">
                Add Plant
              </Text>
              <Text size="sm" color="#666">
                Enter basic details to track your plant
              </Text>
            </View>

            {/* Photo Section */}
            <View style={styles.photoContainer}>
              {photoUri ? (
                <Image 
                  source={{ uri: photoUri }} 
                  style={styles.previewImage} 
                  resizeMode="cover"
                  onError={(e) => console.error("Image load error:", e.nativeEvent.error)}
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

            {/* Species Lookup Field with Enlarged & Centered Thumbnail */}
            <View>
              <Text size="sm" weight="medium" style={styles.fieldLabel}>
                Species Preset (Optional)
              </Text>
              <Pressable 
                style={({ pressed }) => [styles.dropdownTrigger, pressed && styles.pressedState]} 
                onPress={() => setIsDropdownOpen(true)}
              >
                {selectedSpecies?.default_image?.thumbnail || selectedSpecies?.default_image?.medium_url ? (
                  <Image 
                    source={{ 
                      uri: selectedSpecies.default_image.thumbnail || selectedSpecies.default_image.medium_url 
                    }} 
                    style={styles.speciesThumbnail} 
                  />
                ) : null}

                <View style={styles.textContainer}>
                  <Text weight={selectedSpecies ? "medium" : "normal"} color={selectedSpecies ? colors.text : '#888'}>
                    {selectedSpecies ? selectedSpecies.common_name : 'Search species to auto-fill type...'}
                  </Text>
                  {selectedSpecies?.scientific_name?.[0] && (
                    <Text size="sm" color="#666">
                      {selectedSpecies.scientific_name[0]}
                    </Text>
                  )}
                </View>

                <Text color="#888" weight="bold">🔍</Text>
              </Pressable>
            </View>

            {/* Form Fields */}
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
                  onChangeText={setPlantType}
                  placeholder="e.g. Monstera Deliciosa, Snake Plant, Fern"
                  placeholderTextColor="#AAA"
                />
              </View>

              <View>
                <Text size="sm" weight="medium" style={styles.fieldLabel}>
                  Last Watered
                </Text>

                <View style={styles.chipRow}>
                  <Pressable
                    style={[styles.chip, lastWatered === todayStr && styles.chipSelected]}
                    onPress={() => setQuickDate(0)}
                  >
                    <Text
                      size="sm"
                      weight={lastWatered === todayStr ? 'bold' : 'normal'}
                      color={lastWatered === todayStr ? '#FFFFFF' : colors.text || '#333'}
                    >
                      Today
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.chip, lastWatered === yesterdayStr && styles.chipSelected]}
                    onPress={() => setQuickDate(1)}
                  >
                    <Text
                      size="sm"
                      weight={lastWatered === yesterdayStr ? 'bold' : 'normal'}
                      color={lastWatered === yesterdayStr ? '#FFFFFF' : colors.text || '#333'}
                    >
                      Yesterday
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.chip, lastWatered === '2026-10-17' && styles.chipSelected]}
                    onPress={() => setQuickDate(7)}
                  >
                    <Text size="sm" color={colors.text || '#333'}>
                      1 Week Ago
                    </Text>
                  </Pressable>
                </View>

                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  value={lastWatered}
                  onChangeText={setLastWatered}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#AAA"
                />
              </View>
            </Stack>

            {/* Submit Action */}
            <View style={styles.buttonContainer}>
              <StyledButton
                label="Save Plant to Database"
                onPress={handleSubmit}
                variant="primary"
                isLoading={isSubmitting}
              />
            </View>
          </Stack>
        </ScrollView>

        {/* Species Search Modal */}
        <Modal visible={isDropdownOpen} animationType="slide">
          <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
            <View style={styles.modalContainer}>
              <View style={{ marginBottom: 16 }}>
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
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />

              {isLoadingApi ? (
                <ActivityIndicator size="large" color={colors.accent || '#2D6A4F'} style={{ marginTop: 28 }} />
              ) : (
                <FlatList
                  data={speciesList}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  style={{ flex: 1, marginTop: 12 }}
                  contentContainerStyle={{ paddingBottom: 16 }}
                  renderItem={({ item }) => {
                    const itemImg = item.default_image?.thumbnail || item.default_image?.medium_url;
                    return (
                      <Pressable 
                        style={({ pressed }) => [styles.speciesItem, pressed && styles.pressedState]} 
                        onPress={() => handleSelectSpecies(item)}
                      >
                        {itemImg ? (
                          <Image source={{ uri: itemImg }} style={styles.modalItemImage} />
                        ) : (
                          <View style={[styles.modalItemImage, styles.placeholderBox]}>
                            <Text size="lg" color="#AAA">🌿</Text>
                          </View>
                        )}

                        <View style={styles.textContainer}>
                          <Text weight="bold" size="md">{item.common_name}</Text>
                          <Text size="sm" color="#666">
                            {item.scientific_name?.[0] || 'Unknown scientific name'}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  }}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
              )}

              <View style={{ marginTop: 12 }}>
                <StyledButton
                  label="Cancel"
                  onPress={() => setIsDropdownOpen(false)}
                  variant="secondary"
                />
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background || '#F7F9F7',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
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
  fieldLabel: {
    marginBottom: 6,
    color: colors.text || '#222',
  },
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
  textContainer: {
    flex: 1,
    justifyContent: 'center',
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
    backgroundColor: colors.accent || '#2D6A4F',
    borderColor: colors.accent || '#2D6A4F',
  },
  modalContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: colors.background || '#F7F9F7',
  },
  modalSearchInput: {
    fontSize: 16,
    paddingVertical: 14,
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
  pressedState: {
    opacity: 0.6,
  },
  separator: {
    height: 1,
    backgroundColor: '#EDF2F7',
  },
  buttonContainer: {
    marginTop: spacing.xs || 8,
    marginBottom: spacing.lg || 32,
  },
});