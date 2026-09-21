import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { createWorkoutFromParsedData, getWorkouts } from "@/lib/workout-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const workoutId = await createWorkoutFromParsedData(body);

    return NextResponse.json({
      success: true,
      workoutId: workoutId,
      message: "Treino salvo com sucesso!",
    });
  } catch (error: unknown) {
    console.error("Erro ao salvar treino:", error);
    const message = error instanceof Error ? error.message : "Erro interno ao salvar treino.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const fullWorkouts = await getWorkouts();
    return NextResponse.json(fullWorkouts);
  } catch (error: unknown) {
    console.error("Erro ao buscar treinos:", error);
    const message = error instanceof Error ? error.message : "Erro ao listar treinos.";
    return NextResponse.json(
      { error: message },
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno ao deletar treino.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
