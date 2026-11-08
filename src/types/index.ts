export type Exercise = {
  id: string;
  name: string;
  muscle_target: string;
  external_id: string | null;
  created_at: string;
};
export type NewExercise = {
  name: string;
  muscle_target: string;
  external_id?: string | null;
};

export type Workout = {
  id: string;
  name: string;
  created_at: string;
};
export type NewWorkout = { name: string };

export type WorkoutExercise = {
  id: string;
  workout_id: string;
  exercise_id: string;
  position: number;
  target_sets: number | null;
};
export type NewWorkoutExercise = {
  workout_id: string;
  exercise_id: string;
  position: number;
  target_sets?: number | null;
};
export type WorkoutExerciseWithExercise = WorkoutExercise & { exercise: Exercise };

export type WorkoutSession = {
  id: string;
  workout_id: string | null;
  started_at: string;
  completed_at: string | null;
};

export type LoggedSet = {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  completed_at: string;
};
export type NewLoggedSet = {
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight_kg: number;
};