import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import { sanitizeCanonical, calculate1RM, calculateVolumeLoad } from "@/lib/gemini-parser";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, title, raw_input_text, notes, exercises } = body;

    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json(
        { error: "Nenhum exercício para salvar." },
        { status: 400 }
      );
    }

    const workoutDate = date || new Date().toISOString().split("T")[0];

    // Criar a sessão de treino
    const insertedWorkout = db
      .insert(schema.workouts)
      .values({
        date: workoutDate,
        title: title || "Sessão de Treino",
        rawInputText: raw_input_text || "Registro de treino",
        notes: notes || null,
      })
      .returning()
      .get();

    // Inserir exercícios e séries
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      let exerciseId = ex.matched_exercise_id;

      // Se o exercício ainda não tiver ID, verifica ou cria no catálogo
      if (!exerciseId) {
        const canonical = sanitizeCanonical(ex.name);
        const existing = db
          .select()
          .from(schema.exercises)
          .where(eq(schema.exercises.canonicalName, canonical))
          .get();

        if (existing) {
          exerciseId = existing.id;
        } else {
          const newEx = db
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

      // Vincular à sessão
      const workoutEx = db
        .insert(schema.workoutExercises)
        .values({
          workoutId: insertedWorkout.id,
          exerciseId: exerciseId,
          orderIndex: i + 1,
          notes: ex.notes || null,
        })
        .returning()
        .get();

      // Inserir séries
      for (const s of ex.sets || []) {
        const weight = Number(s.weight_kg) || 0;
        const reps = Number(s.reps) || 0;
        const est1RM = calculate1RM(weight, reps);
        const vol = calculateVolumeLoad(weight, reps);

        db.insert(schema.exerciseSets)
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

    return NextResponse.json({
      success: true,
      workoutId: insertedWorkout.id,
      message: "Treino salvo com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro ao salvar treino:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao salvar treino." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const rawWorkouts = db
      .select()
      .from(schema.workouts)
      .orderBy(desc(schema.workouts.date), desc(schema.workouts.id))
      .all();

    const fullWorkouts = rawWorkouts.map((w) => {
      const workoutExs = db
        .select({
          workoutExerciseId: schema.workoutExercises.id,
          exerciseId: schema.workoutExercises.exerciseId,
          orderIndex: schema.workoutExercises.orderIndex,
          notes: schema.workoutExercises.notes,
          exerciseName: schema.exercises.name,
          muscleGroup: schema.exercises.targetMuscleGroup,
          category: schema.exercises.category,
        })
        .from(schema.workoutExercises)
        .innerJoin(schema.exercises, eq(schema.workoutExercises.exerciseId, schema.exercises.id))
        .where(eq(schema.workoutExercises.workoutId, w.id))
        .all();

      const exercisesWithSets = workoutExs.map((we) => {
        const sets = db
          .select()
          .from(schema.exerciseSets)
          .where(eq(schema.exerciseSets.workoutExerciseId, we.workoutExerciseId))
          .all();

        return {
          id: we.exerciseId,
          name: we.exerciseName,
          target_muscle_group: we.muscleGroup,
          category: we.category,
          notes: we.notes,
          sets: sets.map((s) => ({
            id: s.id,
            set_number: s.setNumber,
            set_type: s.setType,
            weight_kg: s.weightKg,
            reps: s.reps,
            rpe: s.rpe,
            estimated_1rm: s.estimated1rm,
            volume_load: s.volumeLoad,
          })),
        };
      });

      // Cálculo de métricas agregadas da sessão
      let totalVolume = 0;
      let totalSets = 0;
      for (const e of exercisesWithSets) {
        for (const s of e.sets) {
          totalVolume += s.volume_load;
          totalSets++;
        }
      }

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

    return NextResponse.json(fullWorkouts);
  } catch (error: any) {
    console.error("Erro ao buscar treinos:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao listar treinos." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    db.delete(schema.workouts).where(eq(schema.workouts.id, parseInt(id, 10))).run();
    return NextResponse.json({ success: true, message: "Treino removido com sucesso." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
