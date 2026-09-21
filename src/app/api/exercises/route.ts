import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const list = db
      .select()
      .from(schema.exercises)
      .orderBy(asc(schema.exercises.targetMuscleGroup), asc(schema.exercises.name))
      .all();

    return NextResponse.json(list);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Erro ao buscar exercícios." },
      { status: 500 }
    );
  }
}
