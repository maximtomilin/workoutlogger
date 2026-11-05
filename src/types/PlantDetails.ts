import { PlantSpecies } from './PlantSpecies';

export interface PlantDetails extends PlantSpecies {
  description: string;
  dimension: string;
  care_level: string;
  growth_rate: string;
  drought_tolerant: boolean;
  indoor: boolean;
}