import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, asc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const exerciseIdParam = searchParams.get("exerciseId");
    const summaryType = searchParams.get("summary");

    // 1. Métrica de Sobrecarga Progressiva para um Exercício Específico
    if (exerciseIdParam) {
      const exerciseId = parseInt(exerciseIdParam, 10);
      if (isNaN(exerciseId)) {
        return NextResponse.json({ error: "exerciseId inválido" }, { status: 400 });
      }

      // Buscar informações do exercício
      const exercise = db
        .select()
        .from(schema.exercises)
        .where(eq(schema.exercises.id, exerciseId))
        .get();

      if (!exercise) {
        return NextResponse.json({ error: "Exercício não encontrado" }, { status: 404 });
      }

      // Buscar todas as sessões em que o exercício foi realizado
      const historyRows = db
        .select({
          workoutDate: schema.workouts.date,
          workoutTitle: schema.workouts.title,
          workoutId: schema.workouts.id,
          setNumber: schema.exerciseSets.setNumber,
          setType: schema.exerciseSets.setType,
          weightKg: schema.exerciseSets.weightKg,
          reps: schema.exerciseSets.reps,
          rpe: schema.exerciseSets.rpe,
          estimated1rm: schema.exerciseSets.estimated1rm,
          volumeLoad: schema.exerciseSets.volumeLoad,
        })
        .from(schema.workoutExercises)
        .innerJoin(schema.workouts, eq(schema.workoutExercises.workoutId, schema.workouts.id))
        .innerJoin(
          schema.exerciseSets,
          eq(schema.workoutExercises.id, schema.exerciseSets.workoutExerciseId)
        )
        .where(eq(schema.workoutExercises.exerciseId, exerciseId))
        .orderBy(asc(schema.workouts.date), asc(schema.workouts.id))
        .all();

      // Agrupar por sessão (data + workoutId)
      const sessionMap = new Map<number, {
        date: string;
        title: string;
        max_weight: number;
        top_set_weight: number;
        best_1rm: number;
        total_volume: number;
        sets_count: number;
        best_rpe: number | null;
      }>();

      for (const row of historyRows) {
        const current = sessionMap.get(row.workoutId) || {
          date: row.workoutDate,
          title: row.workoutTitle || "Treino",
          max_weight: 0,
          top_set_weight: 0,
          best_1rm: 0,
          total_volume: 0,
          sets_count: 0,
          best_rpe: null,
        };

        if (row.weightKg > current.max_weight) {
          current.max_weight = row.weightKg;
        }

        if (row.setType === "TOP_SET") {
          current.top_set_weight = Math.max(current.top_set_weight, row.weightKg);
        }

        if (row.estimated1rm > current.best_1rm) {
          current.best_1rm = row.estimated1rm;
        }

        if (row.rpe && (!current.best_rpe || row.rpe > current.best_rpe)) {
          current.best_rpe = row.rpe;
        }

        current.total_volume += row.volumeLoad;
        current.sets_count++;
        sessionMap.set(row.workoutId, current);
      }

      const progressionHistory = Array.from(sessionMap.values()).map((s) => ({
        ...s,
        top_set_weight: s.top_set_weight > 0 ? s.top_set_weight : s.max_weight,
        total_volume: Math.round(s.total_volume),
      }));

      // Calcular deltas de sobrecarga comparando a última sessão com a penúltima
      let overloadDelta = null;
      if (progressionHistory.length >= 2) {
        const latest = progressionHistory[progressionHistory.length - 1];
        const previous = progressionHistory[progressionHistory.length - 2];
        const diffWeight = Number((latest.max_weight - previous.max_weight).toFixed(1));
        const diff1RM = Number((latest.best_1rm - previous.best_1rm).toFixed(1));
        const diffVolume = latest.total_volume - previous.total_volume;

        overloadDelta = {
          diff_weight_kg: diffWeight,
          diff_1rm_kg: diff1RM,
          diff_volume_kg: diffVolume,
          is_progress: diffWeight > 0 || diff1RM > 0 || diffVolume > 0,
        };
      }

      return NextResponse.json({
        exercise,
        history: progressionHistory,
        overloadDelta,
      });
    }

    // 2. Resumo de Séries Semanais por Grupo Muscular (Hipertrofia)
    if (summaryType === "volume") {
      const volumeQuery = db
        .select({
          muscleGroup: schema.exercises.targetMuscleGroup,
          workingSetsCount: sql<number>`count(${schema.exerciseSets.id})`,
          totalVolume: sql<number>`sum(${schema.exerciseSets.volumeLoad})`,
        })
        .from(schema.exerciseSets)
        .innerJoin(
          schema.workoutExercises,
          eq(schema.exerciseSets.workoutExerciseId, schema.workoutExercises.id)
        )
        .innerJoin(
          schema.exercises,
          eq(schema.workoutExercises.exerciseId, schema.exercises.id)
        )
        .where(sql`${schema.exerciseSets.setType} != 'WARMUP'`)
        .groupBy(schema.exercises.targetMuscleGroup)
        .all();

      return NextResponse.json(
        volumeQuery.map((v) => ({
          muscle: v.muscleGroup,
          sets: Number(v.workingSetsCount) || 0,
          volume: Math.round(Number(v.totalVolume) || 0),
        }))
      );
    }

    // 3. Estatísticas Globais do Dashboard
    const totalWorkouts = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.workouts)
      .get()?.count || 0;

    const totalVolumeResult = db
      .select({ sumVolume: sql<number>`sum(${schema.exerciseSets.volumeLoad})` })
      .from(schema.exerciseSets)
      .get()?.sumVolume || 0;

    const totalSetsResult = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.exerciseSets)
      .where(sql`${schema.exerciseSets.setType} != 'WARMUP'`)
      .get()?.count || 0;

    return NextResponse.json({
      total_workouts: totalWorkouts,
      total_volume_kg: Math.round(totalVolumeResult),
      total_working_sets: totalSetsResult,
    });
  } catch (error: any) {
    console.error("Erro nas métricas:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
