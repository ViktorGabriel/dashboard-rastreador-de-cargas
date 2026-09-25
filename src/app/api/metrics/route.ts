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

    // 3. Fadiga Acumulada e Correlação RPE vs RIR por bloco de periodização
    if (summaryType === "fatigue") {
      // Pull all working/top-set sets with their workout date, rpe, rir, volume
      const fatigueRows = db
        .select({
          workoutDate: schema.workouts.date,
          setType: schema.exerciseSets.setType,
          weightKg: schema.exerciseSets.weightKg,
          reps: schema.exerciseSets.reps,
          rpe: schema.exerciseSets.rpe,
          rir: schema.exerciseSets.rir,
          volumeLoad: schema.exerciseSets.volumeLoad,
          estimated1rm: schema.exerciseSets.estimated1rm,
          muscleGroup: schema.exercises.targetMuscleGroup,
        })
        .from(schema.exerciseSets)
        .innerJoin(
          schema.workoutExercises,
          eq(schema.exerciseSets.workoutExerciseId, schema.workoutExercises.id)
        )
        .innerJoin(schema.workouts, eq(schema.workoutExercises.workoutId, schema.workouts.id))
        .innerJoin(schema.exercises, eq(schema.workoutExercises.exerciseId, schema.exercises.id))
        .where(sql`${schema.exerciseSets.setType} != 'WARMUP'`)
        .orderBy(asc(schema.workouts.date))
        .all();

      if (fatigueRows.length === 0) {
        return NextResponse.json({ blocks: [], scatter: [] });
      }

      // ── Determine ISO week key (YYYY-Www) ────────────────────────────────
      function isoWeekKey(dateStr: string): string {
        const d = new Date(dateStr + "T12:00:00Z");
        const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
        const weekNum = Math.ceil(
          ((d.getTime() - jan4.getTime()) / 86400000 + jan4.getUTCDay() + 1) / 7
        );
        return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
      }

      // ── Group by week block ───────────────────────────────────────────────
      type BlockAcc = {
        weekKey: string;
        label: string;
        totalVolume: number;
        rpeSum: number;
        rpeCount: number;
        rirSum: number;
        rirCount: number;
        setsCount: number;
        heavySets: number; // RPE >= 8
        sessions: Set<string>;
      };

      const blockMap = new Map<string, BlockAcc>();

      for (const row of fatigueRows) {
        const key = isoWeekKey(row.workoutDate);
        if (!blockMap.has(key)) {
          // Build short label like "Sem 36" from week number
          const weekNum = key.split("-W")[1];
          blockMap.set(key, {
            weekKey: key,
            label: `Sem ${weekNum}`,
            totalVolume: 0,
            rpeSum: 0,
            rpeCount: 0,
            rirSum: 0,
            rirCount: 0,
            setsCount: 0,
            heavySets: 0,
            sessions: new Set(),
          });
        }
        const b = blockMap.get(key)!;
        b.totalVolume += row.volumeLoad;
        b.setsCount += 1;
        b.sessions.add(row.workoutDate);

        if (row.rpe !== null && row.rpe !== undefined) {
          b.rpeSum += row.rpe;
          b.rpeCount += 1;
          if (row.rpe >= 8) b.heavySets += 1;
        }
        if (row.rir !== null && row.rir !== undefined) {
          b.rirSum += row.rir;
          b.rirCount += 1;
        }
      }

      // ── Build block array ─────────────────────────────────────────────────
      const sortedBlocks = Array.from(blockMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, b]) => {
          const avgRpe = b.rpeCount > 0 ? Number((b.rpeSum / b.rpeCount).toFixed(1)) : null;
          const avgRir = b.rirCount > 0 ? Number((b.rirSum / b.rirCount).toFixed(1)) : null;
          const vol = Math.round(b.totalVolume);

          // Fatigue score: normalised volume contribution + heavy-set penalty
          // Will be normalised across blocks below
          return {
            weekKey: b.weekKey,
            label: b.label,
            volume_kg: vol,
            sets: b.setsCount,
            sessions: b.sessions.size,
            avg_rpe: avgRpe,
            avg_rir: avgRir,
            heavy_sets: b.heavySets,
            // Raw fatigue components (normalised below)
            _rawVol: vol,
            _rawHeavy: b.heavySets,
          };
        });

      // Normalise fatigue components 0..100
      const maxVol = Math.max(...sortedBlocks.map((b) => b._rawVol), 1);
      const maxHeavy = Math.max(...sortedBlocks.map((b) => b._rawHeavy), 1);

      const blocks = sortedBlocks.map((b) => {
        const volScore = Math.round((b._rawVol / maxVol) * 70);   // 70% weight to volume
        const heavyScore = Math.round((b._rawHeavy / maxHeavy) * 30); // 30% weight to intensity
        return {
          label: b.label,
          weekKey: b.weekKey,
          volume_kg: b.volume_kg,
          sets: b.sets,
          sessions: b.sessions,
          avg_rpe: b.avg_rpe,
          avg_rir: b.avg_rir,
          fatigue_volume: volScore,
          fatigue_intensity: heavyScore,
          fatigue_total: volScore + heavyScore,
        };
      });

      // ── Scatter data: individual sets with both rpe AND rir ────────────────
      const scatter = fatigueRows
        .filter((r) => r.rpe !== null && r.rpe !== undefined && r.rir !== null && r.rir !== undefined)
        .map((r) => ({
          rpe: r.rpe as number,
          rir: r.rir as number,
          volume: Math.round(r.volumeLoad),
          week: isoWeekKey(r.workoutDate),
          muscle: r.muscleGroup,
        }));

      return NextResponse.json({ blocks, scatter });
    }


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
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Erro nas métricas:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
