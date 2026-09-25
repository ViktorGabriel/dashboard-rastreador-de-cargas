import { db, schema } from "@/db";
import { asc } from "drizzle-orm";

export interface ExportSet {
  id: number;
  setNumber: number;
  setType: string;
  weightKg: number;
  reps: number;
  rpe: number | null;
  rir: number | null;
  restSeconds: number | null;
  estimated1rm: number;
  volumeLoad: number;
}

export interface ExportWorkoutExercise {
  id: number;
  exerciseId: number;
  name: string;
  canonicalName: string;
  targetMuscleGroup: string;
  category: string;
  orderIndex: number;
  notes: string | null;
  sets: ExportSet[];
}

export interface ExportWorkout {
  id: number;
  date: string;
  title: string | null;
  notes: string | null;
  rawInputText: string;
  createdAt: number | null;
  totalVolumeKg: number;
  totalSets: number;
  workingSets: number;
  exercises: ExportWorkoutExercise[];
}

export interface ExportExerciseCatalogItem {
  id: number;
  name: string;
  canonicalName: string;
  targetMuscleGroup: string;
  category: string;
  createdAt: number | null;
}

export interface ExportRoutineExerciseItem {
  id: number;
  exerciseId: number;
  exerciseName: string;
  canonicalName: string;
  targetMuscleGroup: string;
  category: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRpe: number | null;
  notes: string | null;
  orderIndex: number;
}

export interface ExportRoutine {
  id: number;
  splitType: string;
  name: string;
  letter: string;
  dayLabel: string | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: number | null;
  exercises: ExportRoutineExerciseItem[];
}

export interface ExportPayload {
  metadata: {
    app: string;
    version: string;
    exportedAt: string;
    counts: {
      workouts: number;
      workoutExercises: number;
      exerciseSets: number;
      exercisesCatalog: number;
      routines: number;
    };
  };
  workouts: ExportWorkout[];
  exercisesCatalog: ExportExerciseCatalogItem[];
  routines: ExportRoutine[];
}

/**
 * Escapes a single value according to RFC 4180 standards for CSV format.
 */
export function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) {
    return "";
  }
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts an array of values into a single CSV row.
 */
export function toCSVRow(values: unknown[]): string {
  return values.map(escapeCSV).join(",");
}

/**
 * Generates formatted JSON string from complete export data.
 */
export function generateExportJSON(data: ExportPayload): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Generates detailed CSV where each row corresponds to an individual set with all context.
 * Prefix with UTF-8 BOM (\uFEFF) for seamless Microsoft Excel compatibility.
 */
export function generateDetailedSetsCSV(data: ExportPayload): string {
  const headers = [
    "workout_id",
    "workout_date",
    "workout_title",
    "workout_notes",
    "exercise_order",
    "exercise_name",
    "exercise_canonical_name",
    "target_muscle_group",
    "exercise_category",
    "set_number",
    "set_type",
    "weight_kg",
    "reps",
    "rpe",
    "rir",
    "rest_seconds",
    "estimated_1rm_kg",
    "volume_load_kg",
    "exercise_notes",
  ];

  const rows: string[] = [toCSVRow(headers)];

  for (const w of data.workouts) {
    for (const ex of w.exercises) {
      if (ex.sets.length === 0) {
        // Exercise logged without sets
        rows.push(
          toCSVRow([
            w.id,
            w.date,
            w.title || "",
            w.notes || "",
            ex.orderIndex,
            ex.name,
            ex.canonicalName,
            ex.targetMuscleGroup,
            ex.category,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ex.notes || "",
          ])
        );
      } else {
        for (const s of ex.sets) {
          rows.push(
            toCSVRow([
              w.id,
              w.date,
              w.title || "",
              w.notes || "",
              ex.orderIndex,
              ex.name,
              ex.canonicalName,
              ex.targetMuscleGroup,
              ex.category,
              s.setNumber,
              s.setType,
              s.weightKg,
              s.reps,
              s.rpe ?? "",
              s.rir ?? "",
              s.restSeconds ?? "",
              s.estimated1rm,
              s.volumeLoad,
              ex.notes || "",
            ])
          );
        }
      }
    }
  }

  return "\uFEFF" + rows.join("\r\n");
}

/**
 * Generates workouts summary CSV where each row corresponds to a workout session.
 */
export function generateWorkoutsSummaryCSV(data: ExportPayload): string {
  const headers = [
    "workout_id",
    "date",
    "title",
    "total_volume_kg",
    "total_sets",
    "total_working_sets",
    "exercises_count",
    "notes",
    "raw_input_text",
  ];

  const rows: string[] = [toCSVRow(headers)];

  for (const w of data.workouts) {
    rows.push(
      toCSVRow([
        w.id,
        w.date,
        w.title || "",
        w.totalVolumeKg,
        w.totalSets,
        w.workingSets,
        w.exercises.length,
        w.notes || "",
        w.rawInputText,
      ])
    );
  }

  return "\uFEFF" + rows.join("\r\n");
}

/**
 * Generates exercises catalog CSV.
 */
export function generateExercisesCSV(data: ExportPayload): string {
  const headers = ["id", "name", "canonical_name", "target_muscle_group", "category"];

  const rows: string[] = [toCSVRow(headers)];

  for (const ex of data.exercisesCatalog) {
    rows.push(toCSVRow([ex.id, ex.name, ex.canonicalName, ex.targetMuscleGroup, ex.category]));
  }

  return "\uFEFF" + rows.join("\r\n");
}

/**
 * Generates routines & splits CSV.
 */
export function generateRoutinesCSV(data: ExportPayload): string {
  const headers = [
    "routine_id",
    "split_type",
    "routine_name",
    "letter",
    "day_label",
    "is_active",
    "exercise_order",
    "exercise_name",
    "target_muscle_group",
    "target_sets",
    "target_reps_min",
    "target_reps_max",
    "target_rpe",
    "notes",
  ];

  const rows: string[] = [toCSVRow(headers)];

  for (const r of data.routines) {
    if (r.exercises.length === 0) {
      rows.push(
        toCSVRow([
          r.id,
          r.splitType,
          r.name,
          r.letter,
          r.dayLabel || "",
          r.isActive ? "true" : "false",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ])
      );
    } else {
      for (const rx of r.exercises) {
        rows.push(
          toCSVRow([
            r.id,
            r.splitType,
            r.name,
            r.letter,
            r.dayLabel || "",
            r.isActive ? "true" : "false",
            rx.orderIndex,
            rx.exerciseName,
            rx.targetMuscleGroup,
            rx.targetSets,
            rx.targetRepsMin,
            rx.targetRepsMax,
            rx.targetRpe ?? "",
            rx.notes || "",
          ])
        );
      }
    }
  }

  return "\uFEFF" + rows.join("\r\n");
}

/**
 * Fetches the full dataset from SQLite using Drizzle ORM.
 */
export async function getFullExportData(): Promise<ExportPayload> {
  // 1. Fetch workouts with relations
  const rawWorkouts = await db.query.workouts.findMany({
    orderBy: [asc(schema.workouts.date), asc(schema.workouts.id)],
    with: {
      workoutExercises: {
        orderBy: [asc(schema.workoutExercises.orderIndex)],
        with: {
          exercise: true,
          sets: {
            orderBy: [asc(schema.exerciseSets.setNumber)],
          },
        },
      },
    },
  });

  let totalSetsCount = 0;
  let totalWorkoutExercisesCount = 0;

  const workouts: ExportWorkout[] = rawWorkouts.map((w) => {
    let totalVolume = 0;
    let totalSets = 0;
    let workingSets = 0;

    const exercises: ExportWorkoutExercise[] = w.workoutExercises.map((we) => {
      totalWorkoutExercisesCount++;
      const sets: ExportSet[] = we.sets.map((s) => {
        totalVolume += s.volumeLoad;
        totalSets++;
        if (s.setType !== "WARMUP") {
          workingSets++;
        }
        return {
          id: s.id,
          setNumber: s.setNumber,
          setType: s.setType,
          weightKg: s.weightKg,
          reps: s.reps,
          rpe: s.rpe,
          rir: s.rir,
          restSeconds: s.restSeconds,
          estimated1rm: s.estimated1rm,
          volumeLoad: s.volumeLoad,
        };
      });

      return {
        id: we.id,
        exerciseId: we.exercise.id,
        name: we.exercise.name,
        canonicalName: we.exercise.canonicalName,
        targetMuscleGroup: we.exercise.targetMuscleGroup,
        category: we.exercise.category,
        orderIndex: we.orderIndex,
        notes: we.notes,
        sets,
      };
    });

    totalSetsCount += totalSets;

    return {
      id: w.id,
      date: w.date,
      title: w.title,
      notes: w.notes,
      rawInputText: w.rawInputText,
      createdAt: w.createdAt,
      totalVolumeKg: Math.round(totalVolume),
      totalSets,
      workingSets,
      exercises,
    };
  });

  // 2. Fetch exercises catalog
  const rawExercises = await db.query.exercises.findMany({
    orderBy: [asc(schema.exercises.name)],
  });

  const exercisesCatalog: ExportExerciseCatalogItem[] = rawExercises.map((e) => ({
    id: e.id,
    name: e.name,
    canonicalName: e.canonicalName,
    targetMuscleGroup: e.targetMuscleGroup,
    category: e.category,
    createdAt: e.createdAt,
  }));

  // 3. Fetch routines and their template exercises
  const rawRoutines = await db.query.workoutRoutines.findMany({
    orderBy: [asc(schema.workoutRoutines.orderIndex), asc(schema.workoutRoutines.id)],
    with: {
      routineExercises: {
        orderBy: [asc(schema.routineExercises.orderIndex)],
        with: {
          exercise: true,
        },
      },
    },
  });

  const routines: ExportRoutine[] = rawRoutines.map((r) => ({
    id: r.id,
    splitType: r.splitType,
    name: r.name,
    letter: r.letter,
    dayLabel: r.dayLabel,
    orderIndex: r.orderIndex,
    isActive: r.isActive,
    createdAt: r.createdAt,
    exercises: r.routineExercises.map((re) => ({
      id: re.id,
      exerciseId: re.exercise.id,
      exerciseName: re.exercise.name,
      canonicalName: re.exercise.canonicalName,
      targetMuscleGroup: re.exercise.targetMuscleGroup,
      category: re.exercise.category,
      targetSets: re.targetSets,
      targetRepsMin: re.targetRepsMin,
      targetRepsMax: re.targetRepsMax,
      targetRpe: re.targetRpe,
      notes: re.notes,
      orderIndex: re.orderIndex,
    })),
  }));

  const payload: ExportPayload = {
    metadata: {
      app: "IRONPARSE",
      version: "0.1.0",
      exportedAt: new Date().toISOString(),
      counts: {
        workouts: workouts.length,
        workoutExercises: totalWorkoutExercisesCount,
        exerciseSets: totalSetsCount,
        exercisesCatalog: exercisesCatalog.length,
        routines: routines.length,
      },
    },
    workouts,
    exercisesCatalog,
    routines,
  };

  return payload;
}
