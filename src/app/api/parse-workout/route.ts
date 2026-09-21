import { NextResponse } from "next/server";
import { parseWorkoutText } from "@/lib/gemini-parser";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim() === "") {
      return NextResponse.json(
        { error: "O texto do treino é obrigatório." },
        { status: 400 }
      );
    }

    const result = await parseWorkoutText(text.trim());
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erro na rota /api/parse-workout:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao processar o treino." },
      { status: 500 }
    );
  }
}
