export interface Plant {
  id: number;
  name: string;
  common_name: string;
  other_name: string;
  watering: string;
  sunlight: string;
  last_watered?: string;
  image_url?: string;
  water_interval_days?: number;
}