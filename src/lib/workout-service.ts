import { db, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import { ParsedWorkoutResult } from "./formulas";
import { sanitizeCanonical, calculate1RM, calculateVolumeLoad } from "./gemini-parser";

export async function createWorkoutFromParsedData(parsedData: ParsedWorkoutResult) {
  const { date, title, notes, exercises } = parsedData;

  if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
    throw new Error("Nenhum exercício para salvar.");
  }

  const workoutDate = date || new Date().toISOString().split("T")[0];

  return db.transaction((tx) => {
    // 1. Insert Workout
    const insertedWorkout = tx
      .insert(schema.workouts)
      .values({
        date: workoutDate,
        title: title || "Sessão de Treino",
        rawInputText: "Registro de treino processado pela IA",
        notes: notes || null,
      })
      .returning()
      .get();

    // 2. Process Exercises
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      let exerciseId = ex.matched_exercise_id;

      if (!exerciseId) {
        const canonical = sanitizeCanonical(ex.name);
        const existing = tx
          .select()
          .from(schema.exercises)
          .where(eq(schema.exercises.canonicalName, canonical))
          .get();

        if (existing) {
          exerciseId = existing.id;
        } else {
          const newEx = tx
            .insert(schema.exercises)
            .values({
              name: ex.name,
              canonicalName: canonical,
              targetMuscleGroup: ex.target_muscle_group || "Geral",
              category: ex.category || "COMPOUND",
            })
            .returning()
            .get();
          exerciseId = newEx.id;
        }
      }

      // 3. Link to Workout
      const workoutEx = tx
        .insert(schema.workoutExercises)
        .values({
          workoutId: insertedWorkout.id,
          exerciseId: exerciseId,
          orderIndex: i + 1,
          notes: ex.notes || null,
        })
        .returning()
        .get();

      // 4. Insert Sets
      for (const s of ex.sets || []) {
        const weight = Number(s.weight_kg) || 0;
        const reps = Number(s.reps) || 0;
        const est1RM = calculate1RM(weight, reps);
        const vol = calculateVolumeLoad(weight, reps);

        tx.insert(schema.exerciseSets)
          .values({
            workoutExerciseId: workoutEx.id,
            setNumber: s.set_number || 1,
            setType: s.set_type || "WORKING",
            weightKg: weight,
            reps: reps,
            rpe: s.rpe ? Number(s.rpe) : null,
            rir: s.rir ? Number(s.rir) : null,
            restSeconds: s.rest_seconds ? Number(s.rest_seconds) : null,
            estimated1rm: est1RM,
            volumeLoad: vol,
          })
          .run();
      }
    }

    return insertedWorkout.id;
  });
}

export async function getWorkouts() {
  const rawWorkouts = await db.query.workouts.findMany({
    orderBy: [desc(schema.workouts.date), desc(schema.workouts.id)],
    with: {
      workoutExercises: {
        with: {
          exercise: true,
          sets: true,
        },
      },
    },
  });

  const fullWorkouts = rawWorkouts.map((w) => {
    let totalVolume = 0;
    let totalSets = 0;

    const exercisesWithSets = w.workoutExercises.map((we) => {
      const sets = we.sets.map((s) => {
        totalVolume += s.volumeLoad;
        totalSets++;
        return {
          id: s.id,
          set_number: s.setNumber,
          set_type: s.setType,
          weight_kg: s.weightKg,
          reps: s.reps,
          rpe: s.rpe,
          estimated_1rm: s.estimated1rm,
          volume_load: s.volumeLoad,
        };
      });

      return {
        id: we.exercise.id,
        name: we.exercise.name,
        target_muscle_group: we.exercise.targetMuscleGroup,
        category: we.exercise.category,
        notes: we.notes,
        sets,
      };
    });

    return {
      id: w.id,
      date: w.date,
      title: w.title,
      notes: w.notes,
      raw_input_text: w.rawInputText,
      total_volume: Math.round(totalVolume),
      total_sets: totalSets,
      exercises: exercisesWithSets,
    };
  });

  return fullWorkouts;
}
