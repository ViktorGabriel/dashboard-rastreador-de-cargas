export interface ParsedSet {
  set_number: number;
  set_type: "WARMUP" | "TOP_SET" | "WORKING" | "BACKOFF";
  weight_kg: number;
  reps: number;
  rpe?: number | null;
  rir?: number | null;
  rest_seconds?: number | null;
  notes?: string | null;
  estimated_1rm: number;
  volume_load: number;
}

export interface ParsedExercise {
  name: string;
  matched_exercise_id?: number | null;
  target_muscle_group: string;
  category: "COMPOUND" | "ISOLATION";
  notes?: string | null;
  sets: ParsedSet[];
}

export interface ParsedWorkoutResult {
  is_workout: boolean;
  feedback_message?: string;
  date: string;
  title?: string;
  notes?: string;
  exercises: ParsedExercise[];
}

export function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return Number(weight.toFixed(1));
  // Fórmula de Epley: Carga * (1 + Reps / 30)
  const epley = weight * (1 + reps / 30);
  return Number(epley.toFixed(1));
}

export function calculateVolumeLoad(weight: number, reps: number): number {
  return Number((weight * reps).toFixed(1));
}

export function sanitizeCanonical(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
