import { GoogleGenAI, Type } from "@google/genai";
import { db, schema } from "@/db";
import {
  ParsedSet,
  ParsedExercise,
  ParsedWorkoutResult,
  calculate1RM,
  calculateVolumeLoad,
  sanitizeCanonical,
} from "./formulas";

export {
  type ParsedSet,
  type ParsedExercise,
  type ParsedWorkoutResult,
  calculate1RM,
  calculateVolumeLoad,
  sanitizeCanonical,
};

export async function parseWorkoutText(text: string): Promise<ParsedWorkoutResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const today = new Date().toISOString().split("T")[0];

  if (!apiKey || apiKey.trim() === "" || apiKey === "sua_chave_do_google_gemini_aqui") {
    return parseWorkoutWithFallbackRules(text, today);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
Você é um especialista e treinador de Powerbuilding e Hipertrofia.
Analise o texto a seguir digitado por um atleta e extraia todas as informações estruturadas do treino.
Data de hoje para referência de datas relativas (ex: hoje, ontem, anteontem): ${today}

Texto digitado pelo atleta:
"""
${text}
"""

Regras de Extração e Powerbuilding:
1. Identifique se o texto descreve um treino físico ou exercícios. Se NÃO descrever, retorne is_workout: false com uma mensagem amigável explicando.
2. Identifique a data do treino no formato YYYY-MM-DD. Se disser "ontem", calcule a data de ontem com base na data de hoje (${today}). Se não especificar, use a data de hoje.
3. Para cada exercício:
   - Identifique o nome em português (ex: "Supino Reto com Barra", "Remada Curvada com Barra", "Agachamento Livre com Barra", "Elevação Lateral").
   - Identifique o grupo muscular principal (ex: Peito, Costas, Quadríceps, Posterior, Ombros, Bíceps, Tríceps, Abdômen, Trapézio, Panturrilha).
   - Classifique se é COMPOUND (básico multiarticular como supino, agacho, terra, desenvolvimento, remada) ou ISOLATION (isolador como elevação lateral, extensora, rosca).
4. Para as séries:
   - Se o usuário disser "4x8 com 90kg", gere 4 objetos de série individuais com set_number 1, 2, 3, 4, com 90kg e 8 reps.
   - Identifique TOP_SET: menção de carga mais pesada, série de pico de força (ex: "top set de 140kg 1x3" ou "1x3 140kg e depois 3x6 110kg").
   - Identifique BACKOFF: séries com menos peso após o top set de pico (ex: "3x6 com 115kg backoff").
   - Identifique WARMUP: menções de aquecimento (ex: "aqueci com 40kg e 60kg").
   - Identifique WORKING: séries de trabalho convencionais.
   - Se mencionar "cada lado" (ex: "40kg cada lado no supino"), considere a barra padrão de 20kg (ex: 40*2 + 20 = 100kg total) e anote isso nas notas.
   - Extraia RPE/RIR se informado (ex: "@8", "@8.5", "rpe 9", "rir 2").
   - Extraia descanso em segundos se informado (ex: "3min de descanso" -> 180).
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            is_workout: { type: Type.BOOLEAN },
            feedback_message: { type: Type.STRING },
            date: { type: Type.STRING },
            title: { type: Type.STRING },
            notes: { type: Type.STRING },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  target_muscle_group: { type: Type.STRING },
                  category: { type: Type.STRING, enum: ["COMPOUND", "ISOLATION"] },
                  notes: { type: Type.STRING },
                  sets: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        set_number: { type: Type.INTEGER },
                        set_type: { type: Type.STRING, enum: ["WARMUP", "TOP_SET", "WORKING", "BACKOFF"] },
                        weight_kg: { type: Type.NUMBER },
                        reps: { type: Type.INTEGER },
                        rpe: { type: Type.NUMBER },
                        rir: { type: Type.INTEGER },
                        rest_seconds: { type: Type.INTEGER },
                        notes: { type: Type.STRING },
                      },
                      required: ["set_number", "set_type", "weight_kg", "reps"],
                    },
                  },
                },
                required: ["name", "target_muscle_group", "category", "sets"],
              },
            },
          },
          required: ["is_workout", "exercises"],
        },
      },
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Resposta vazia da API do Gemini.");
    }

    const parsed = JSON.parse(rawJson);
    return await enrichAndNormalizeParsedWorkout(parsed, today);
  } catch (error) {
    console.error("Erro ao chamar Gemini Flash, aplicando fallback inteligente:", error);
    return parseWorkoutWithFallbackRules(text, today);
  }
}

interface RawParsedSet {
  set_number?: number;
  set_type?: string;
  weight_kg?: number | string;
  reps?: number | string;
  rpe?: number | string | null;
  rir?: number | string | null;
  rest_seconds?: number | string | null;
  notes?: string | null;
}

interface RawParsedExercise {
  name: string;
  target_muscle_group?: string;
  category?: "COMPOUND" | "ISOLATION";
  notes?: string | null;
  sets?: RawParsedSet[];
}

interface RawParsedWorkout {
  is_workout?: boolean;
  feedback_message?: string;
  title?: string;
  notes?: string | null;
  date?: string;
  exercises?: RawParsedExercise[];
}

// Normalização de exercícios contra o banco SQLite e cálculo de métricas
async function enrichAndNormalizeParsedWorkout(
  raw: RawParsedWorkout,
  defaultDate: string
): Promise<ParsedWorkoutResult> {
  if (!raw.is_workout) {
    return {
      is_workout: false,
      feedback_message: raw.feedback_message || "Nenhum treino reconhecido no texto digitado.",
      date: raw.date || defaultDate,
      exercises: [],
    };
  }

  // Buscar todos os exercícios cadastrados no banco
  const existingExercises = db.select().from(schema.exercises).all();

  const enrichedExercises: ParsedExercise[] = (raw.exercises || []).map((ex: RawParsedExercise) => {
    const rawCanonical = sanitizeCanonical(ex.name);
    
    // Tenta encontrar um exercício já existente por similaridade ou exatidão
    const matched = existingExercises.find(
      (e) =>
        e.canonicalName === rawCanonical ||
        rawCanonical.includes(e.canonicalName) ||
        e.canonicalName.includes(rawCanonical)
    );

    const exerciseName = matched ? matched.name : ex.name;
    const muscleGroup = matched ? matched.targetMuscleGroup : (ex.target_muscle_group || "Geral");
    const category = matched ? (matched.category as "COMPOUND" | "ISOLATION") : (ex.category || "COMPOUND");

    const sets: ParsedSet[] = (ex.sets || []).map((s: RawParsedSet, idx: number) => {
      const weight = Number(s.weight_kg) || 0;
      const reps = Number(s.reps) || 0;
      const setType = (s.set_type as "TOP_SET" | "BACKOFF" | "WORKING" | "WARMUP") || "WORKING";
      return {
        set_number: s.set_number || idx + 1,
        set_type: setType,
        weight_kg: weight,
        reps: reps,
        rpe: s.rpe ? Number(s.rpe) : null,
        rir: s.rir ? Number(s.rir) : null,
        rest_seconds: s.rest_seconds ? Number(s.rest_seconds) : null,
        notes: s.notes || null,
        estimated_1rm: calculate1RM(weight, reps),
        volume_load: calculateVolumeLoad(weight, reps),
      };
    });

    return {
      name: exerciseName,
      matched_exercise_id: matched ? matched.id : null,
      target_muscle_group: muscleGroup,
      category: category,
      notes: ex.notes || null,
      sets,
    };
  });

  return {
    is_workout: true,
    feedback_message: raw.feedback_message,
    date: raw.date || defaultDate,
    title: raw.title || "Sessão de Treino",
    notes: raw.notes || undefined,
    exercises: enrichedExercises,
  };
}

// Parser heurístico de fallback caso esteja sem chave de API ou offline
function parseWorkoutWithFallbackRules(text: string, today: string): ParsedWorkoutResult {
  const lines = text.split(/[\n,;e]+/).map((s) => s.trim()).filter(Boolean);
  const detectedExercises: ParsedExercise[] = [];

  // Padrões como: "supino 4x8 com 90kg", "4x8 no supino com 90kg", "supino 90kg 4x8", "terra 1x3 180kg top set"
  const setRepPattern = /(\d+)\s*[xX]\s*(\d+)/;
  const weightPattern = /(\d+(?:[.,]\d+)?)\s*(?:kg|kilos|quilos)?/i;

  for (const part of lines) {
    const setRepMatch = part.match(setRepPattern);
    if (setRepMatch) {
      const numSets = parseInt(setRepMatch[1], 10);
      const reps = parseInt(setRepMatch[2], 10);

      // Limpar o setRep do texto para buscar o peso
      const withoutSetRep = part.replace(setRepPattern, "");
      const weightMatch = withoutSetRep.match(weightPattern);
      const weight = weightMatch ? parseFloat(weightMatch[1].replace(",", ".")) : 60;

      // Classificar nome simplificado
      let name = "Exercício Geral";
      let muscle = "Geral";
      let category: "COMPOUND" | "ISOLATION" = "COMPOUND";

      const lower = part.toLowerCase();
      if (lower.includes("supino")) {
        name = lower.includes("inclinado") ? "Supino Inclinado com Barra" : "Supino Reto com Barra";
        muscle = "Peito";
      } else if (lower.includes("remada")) {
        name = "Remada Curvada com Barra";
        muscle = "Costas";
      } else if (lower.includes("agacha")) {
        name = "Agachamento Livre com Barra";
        muscle = "Quadríceps";
      } else if (lower.includes("terra")) {
        name = "Levantamento Terra Convencional";
        muscle = "Costas";
      } else if (lower.includes("desenvolvimento")) {
        name = "Desenvolvimento Militar com Barra";
        muscle = "Ombros";
      } else if (lower.includes("elevacao") || lower.includes("lateral")) {
        name = "Elevação Lateral com Halteres";
        muscle = "Ombros";
        category = "ISOLATION";
      } else if (lower.includes("rosca")) {
        name = "Rosca Direta com Barra W";
        muscle = "Bíceps";
        category = "ISOLATION";
      } else if (lower.includes("triceps") || lower.includes("corda")) {
        name = "Tríceps Corda na Polia";
        muscle = "Tríceps";
        category = "ISOLATION";
      }

      const isTopSet = lower.includes("top set") || lower.includes("top-set") || lower.includes("pesado");
      const isBackoff = lower.includes("backoff") || lower.includes("back-off");

      const sets: ParsedSet[] = [];
      for (let i = 1; i <= Math.min(numSets, 10); i++) {
        const setType = isTopSet && i === 1 ? "TOP_SET" : isBackoff ? "BACKOFF" : "WORKING";
        sets.push({
          set_number: i,
          set_type: setType,
          weight_kg: weight,
          reps: reps,
          rpe: lower.includes("@") ? parseFloat((lower.match(/@(\d+(?:\.\d+)?)/) || [])[1] || "8") : null,
          estimated_1rm: calculate1RM(weight, reps),
          volume_load: calculateVolumeLoad(weight, reps),
        });
      }

      detectedExercises.push({
        name,
        target_muscle_group: muscle,
        category,
        sets,
      });
    }
  }

  if (detectedExercises.length === 0) {
    return {
      is_workout: false,
      feedback_message: "Não foram detectados exercícios ou séries claras no texto. Exemplo: 'Hoje fiz 4x8 no supino com 90kg e 3x10 na remada com 70kg'.",
      date: today,
      exercises: [],
    };
  }

  return {
    is_workout: true,
    feedback_message: "Parse processado com sucesso!",
    date: today,
    title: `Treino de ${detectedExercises[0]?.target_muscle_group || "Força"}`,
    exercises: detectedExercises,
  };
}
