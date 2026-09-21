import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, asc } from "drizzle-orm";
import { SPLIT_PRESETS, applyPresetSplit, getActiveRoutines } from "@/lib/preset-routines";

export async function GET() {
  try {
    const routines = await getActiveRoutines();
    
    // Identificar divisão atual a partir da primeira rotina ativa
    const currentSplit = routines.length > 0 ? routines[0].splitType : "CUSTOM";

    const presetsList = Object.values(SPLIT_PRESETS).map((p) => ({
      type: p.type,
      label: p.label,
      description: p.description,
      daysCount: p.daysCount,
    }));

    return NextResponse.json({
      currentSplit,
      presets: presetsList,
      routines,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Erro ao carregar rotinas:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Trocar para uma das divisões consagradas
    if (action === "apply_preset") {
      const { splitType } = body;
      const updatedRoutines = await applyPresetSplit(splitType);
      return NextResponse.json({
        message: `Divisão ${splitType} aplicada com sucesso!`,
        routines: updatedRoutines,
      });
    }

    // 2. Adicionar exercício a uma ficha existente
    if (action === "add_exercise") {
      const {
        routineId,
        exerciseId,
        targetSets = 3,
        targetRepsMin = 8,
        targetRepsMax = 10,
        targetRpe = null,
        notes = null,
      } = body;

      if (!routineId || !exerciseId) {
        return NextResponse.json({ error: "routineId e exerciseId são obrigatórios." }, { status: 400 });
      }

      // Calcular o próximo orderIndex
      const lastEx = db
        .select({ orderIndex: schema.routineExercises.orderIndex })
        .from(schema.routineExercises)
        .where(eq(schema.routineExercises.routineId, routineId))
        .orderBy(asc(schema.routineExercises.orderIndex))
        .all();

      const nextOrder = lastEx.length > 0 ? lastEx[lastEx.length - 1].orderIndex + 1 : 0;

      const inserted = db
        .insert(schema.routineExercises)
        .values({
          routineId,
          exerciseId,
          targetSets: Number(targetSets),
          targetRepsMin: Number(targetRepsMin),
          targetRepsMax: Number(targetRepsMax),
          targetRpe: targetRpe ? Number(targetRpe) : null,
          notes,
          orderIndex: nextOrder,
        })
        .returning()
        .get();

      const updatedRoutines = await getActiveRoutines();
      return NextResponse.json({ success: true, item: inserted, routines: updatedRoutines });
    }

    // 3. Criar uma nova rotina/ficha do zero
    if (action === "create_routine") {
      const { name, letter = "A", dayLabel = "Livre", splitType = "CUSTOM" } = body;

      const lastRoutine = db
        .select({ orderIndex: schema.workoutRoutines.orderIndex })
        .from(schema.workoutRoutines)
        .orderBy(asc(schema.workoutRoutines.orderIndex))
        .all();

      const nextOrder = lastRoutine.length > 0 ? lastRoutine[lastRoutine.length - 1].orderIndex + 1 : 0;

      const created = db
        .insert(schema.workoutRoutines)
        .values({
          name,
          letter: letter.toUpperCase(),
          dayLabel,
          splitType,
          orderIndex: nextOrder,
          isActive: true,
        })
        .returning()
        .get();

      const updatedRoutines = await getActiveRoutines();
      return NextResponse.json({ success: true, routine: created, routines: updatedRoutines });
    }

    return NextResponse.json({ error: "Ação não suportada." }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Erro na ação de rotinas:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { action, id } = body;

    // Atualizar séries/reps de um exercício
    if (action === "update_exercise" && id) {
      const { targetSets, targetRepsMin, targetRepsMax, targetRpe, notes } = body;

      db.update(schema.routineExercises)
        .set({
          targetSets: targetSets !== undefined ? Number(targetSets) : undefined,
          targetRepsMin: targetRepsMin !== undefined ? Number(targetRepsMin) : undefined,
          targetRepsMax: targetRepsMax !== undefined ? Number(targetRepsMax) : undefined,
          targetRpe: targetRpe !== undefined ? (targetRpe ? Number(targetRpe) : null) : undefined,
          notes: notes !== undefined ? notes : undefined,
        })
        .where(eq(schema.routineExercises.id, id))
        .run();

      const updatedRoutines = await getActiveRoutines();
      return NextResponse.json({ success: true, routines: updatedRoutines });
    }

    // Atualizar nome/letra da ficha
    if (action === "update_routine" && id) {
      const { name, letter, dayLabel } = body;

      db.update(schema.workoutRoutines)
        .set({
          name: name !== undefined ? name : undefined,
          letter: letter !== undefined ? letter : undefined,
          dayLabel: dayLabel !== undefined ? dayLabel : undefined,
        })
        .where(eq(schema.workoutRoutines.id, id))
        .run();

      const updatedRoutines = await getActiveRoutines();
      return NextResponse.json({ success: true, routines: updatedRoutines });
    }

    return NextResponse.json({ error: "Parâmetros inválidos para atualização." }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const exerciseId = searchParams.get("routineExerciseId");
    const routineId = searchParams.get("routineId");

    if (exerciseId) {
      db.delete(schema.routineExercises)
        .where(eq(schema.routineExercises.id, Number(exerciseId)))
        .run();
      const updatedRoutines = await getActiveRoutines();
      return NextResponse.json({ success: true, routines: updatedRoutines });
    }

    if (routineId) {
      db.delete(schema.workoutRoutines)
        .where(eq(schema.workoutRoutines.id, Number(routineId)))
        .run();
      const updatedRoutines = await getActiveRoutines();
      return NextResponse.json({ success: true, routines: updatedRoutines });
    }

    return NextResponse.json({ error: "ID não fornecido." }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
