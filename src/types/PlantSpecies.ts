export interface PlantSpecies {
  id: number;
  common_name: string;
  scientific_name: string[];
  other_name: string[];
  cycle: string;
  watering: string;
  sunlight: string[];
  default_image?: {
    original_url: string;
    regular_url: string;
    medium_url: string;
    thumbnail: string;
  };
}