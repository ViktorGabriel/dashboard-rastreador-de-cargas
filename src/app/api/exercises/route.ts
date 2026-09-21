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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar exercícios." },
      { status: 500 }
    );
  }
}
