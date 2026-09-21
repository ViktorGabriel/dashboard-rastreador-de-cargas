import { db, schema } from "@/db";
import { eq, asc } from "drizzle-orm";

export interface PresetExerciseConfig {
  exerciseCanonical: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRpe?: number;
  notes?: string;
}

export interface PresetRoutineConfig {
  letter: string;
  name: string;
  dayLabel: string;
  exercises: PresetExerciseConfig[];
}

export interface SplitPresetDefinition {
  type: string;
  label: string;
  description: string;
  daysCount: number;
  routines: PresetRoutineConfig[];
}

export const SPLIT_PRESETS: Record<string, SplitPresetDefinition> = {
  UPPER_LOWER: {
    type: "UPPER_LOWER",
    label: "Upper / Lower (4 Dias)",
    description: "Padrão-ouro para força e hipertrofia dividindo membros superiores e inferiores 2x na semana.",
    daysCount: 4,
    routines: [
      {
        letter: "A",
        name: "Upper Força (Superior A)",
        dayLabel: "Segunda-feira",
        exercises: [
          { exerciseCanonical: "supino reto com barra", targetSets: 4, targetRepsMin: 5, targetRepsMax: 8, targetRpe: 8.5, notes: "Top set + back-offs" },
          { exerciseCanonical: "remada curvada com barra", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, targetRpe: 8.5 },
          { exerciseCanonical: "desenvolvimento militar com barra", targetSets: 3, targetRepsMin: 6, targetRepsMax: 8, targetRpe: 8 },
          { exerciseCanonical: "puxada alta na polia", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },
          { exerciseCanonical: "triceps testa com barra", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
          { exerciseCanonical: "rosca direta com barra w", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },
        ],
      },
      {
        letter: "B",
        name: "Lower Força (Inferior A)",
        dayLabel: "Terça-feira",
        exercises: [
          { exerciseCanonical: "agachamento livre com barra", targetSets: 4, targetRepsMin: 5, targetRepsMax: 8, targetRpe: 8.5, notes: "Carga pesada progressiva" },
          { exerciseCanonical: "stiff com barra", targetSets: 3, targetRepsMin: 6, targetRepsMax: 8, targetRpe: 8 },
          { exerciseCanonical: "leg press 45", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
          { exerciseCanonical: "mesa flexora", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
          { exerciseCanonical: "panturrilha em pe", targetSets: 4, targetRepsMin: 12, targetRepsMax: 15 },
        ],
      },
      {
        letter: "C",
        name: "Upper Hipertrofia (Superior B)",
        dayLabel: "Quinta-feira",
        exercises: [
          { exerciseCanonical: "supino inclinado com halteres", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10, targetRpe: 8.5 },
          { exerciseCanonical: "barra fixa", targetSets: 4, targetRepsMin: 6, targetRepsMax: 10 },
          { exerciseCanonical: "crucifixo na polia", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
          { exerciseCanonical: "remada baixa triangulo", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
          { exerciseCanonical: "elevacao lateral com halteres", targetSets: 4, targetRepsMin: 12, targetRepsMax: 15 },
          { exerciseCanonical: "triceps corda na polia", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
        ],
      },
      {
        letter: "D",
        name: "Lower Hipertrofia (Inferior B)",
        dayLabel: "Sexta-feira",
        exercises: [
          { exerciseCanonical: "levantamento terra convencional", targetSets: 3, targetRepsMin: 3, targetRepsMax: 5, targetRpe: 9, notes: "Foco em sobrecarga pura" },
          { exerciseCanonical: "cadeira extensora", targetSets: 4, targetRepsMin: 10, targetRepsMax: 12 },
          { exerciseCanonical: "mesa flexora", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
          { exerciseCanonical: "elevacao pelvica", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },
          { exerciseCanonical: "panturrilha em pe", targetSets: 4, targetRepsMin: 12, targetRepsMax: 15 },
        ],
      },
    ],
  },
  PPL: {
    type: "PPL",
    label: "PPL - Push / Pull / Legs (3 ou 6 Dias)",
    description: "A rotina mais aclamada de hipertrofia: Empurrar (Peito/Ombro/Tríceps), Puxar (Costas/Bíceps) e Pernas.",
    daysCount: 3,
    routines: [
      {
        letter: "A",
        name: "Treino Push (Peito, Ombros & Tríceps)",
        dayLabel: "Segunda-feira",
        exercises: [
          { exerciseCanonical: "supino reto com barra", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, targetRpe: 8.5 },
          { exerciseCanonical: "supino inclinado com halteres", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },
          { exerciseCanonical: "desenvolvimento militar com barra", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },
          { exerciseCanonical: "elevacao lateral com halteres", targetSets: 4, targetRepsMin: 12, targetRepsMax: 15 },
          { exerciseCanonical: "triceps testa com barra", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
          { exerciseCanonical: "triceps corda na polia", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
        ],
      },
      {
        letter: "B",
        name: "Treino Pull (Costas, Trapézio & Bíceps)",
        dayLabel: "Terça-feira",
        exercises: [
          { exerciseCanonical: "remada curvada com barra", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, targetRpe: 8.5 },
          { exerciseCanonical: "puxada alta na polia", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10 },
          { exerciseCanonical: "remada baixa triangulo", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
          { exerciseCanonical: "crucifixo invertido", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
          { exerciseCanonical: "rosca direta com barra w", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },
          { exerciseCanonical: "rosca martelo com halteres", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        ],
      },
      {
        letter: "C",
        name: "Treino Legs (Quadríceps, Posterior & Panturrilha)",
        dayLabel: "Quarta-feira",
        exercises: [
          { exerciseCanonical: "agachamento livre com barra", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, targetRpe: 8.5 },
          { exerciseCanonical: "stiff com barra", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10 },
          { exerciseCanonical: "leg press 45", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
          { exerciseCanonical: "cadeira extensora", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
          { exerciseCanonical: "mesa flexora", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
          { exerciseCanonical: "panturrilha em pe", targetSets: 4, targetRepsMin: 15, targetRepsMax: 20 },
        ],
      },
    ],
  },
  PPL_UPPER_LOWER: {
    type: "PPL_UPPER_LOWER",
    label: "PPL + Upper/Lower (5 Dias Híbrido)",
    description: "Combinação de alta frequência: Push, Pull e Legs nos primeiros 3 dias, seguidos de Upper e Lower para consolidação.",
    daysCount: 5,
    routines: [
      {
        letter: "A",
        name: "Push Power",
        dayLabel: "Segunda-feira",
        exercises: [
          { exerciseCanonical: "supino reto com barra", targetSets: 4, targetRepsMin: 5, targetRepsMax: 8, targetRpe: 8.5 },
          { exerciseCanonical: "desenvolvimento com halteres", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },
          { exerciseCanonical: "mergulho nas paralelas", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },
          { exerciseCanonical: "elevacao lateral com halteres", targetSets: 4, targetRepsMin: 12, targetRepsMax: 15 },
        ],
      },
      {
        letter: "B",
        name: "Pull Power",
        dayLabel: "Terça-feira",
        exercises: [
          { exerciseCanonical: "remada curvada com barra", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, targetRpe: 8.5 },
          { exerciseCanonical: "puxada alta na polia", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },
          { exerciseCanonical: "rosca direta com barra w", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },
          { exerciseCanonical: "crucifixo invertido", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
        ],
      },
      {
        letter: "C",
        name: "Legs Power",
        dayLabel: "Quarta-feira",
        exercises: [
          { exerciseCanonical: "agachamento livre com barra", targetSets: 4, targetRepsMin: 5, targetRepsMax: 8, targetRpe: 8.5 },
          { exerciseCanonical: "stiff com barra", targetSets: 3, targetRepsMin: 6, targetRepsMax: 8 },
          { exerciseCanonical: "cadeira extensora", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
          { exerciseCanonical: "panturrilha em pe", targetSets: 4, targetRepsMin: 12, targetRepsMax: 15 },
        ],
      },
      {
        letter: "D",
        name: "Upper Hipertrofia",
        dayLabel: "Sexta-feira",
        exercises: [
          { exerciseCanonical: "supino inclinado com halteres", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10 },
          { exerciseCanonical: "barra fixa", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10 },
          { exerciseCanonical: "desenvolvimento militar com barra", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },
          { exerciseCanonical: "rosca martelo com halteres", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
          { exerciseCanonical: "triceps corda na polia", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        ],
      },
      {
        letter: "E",
        name: "Lower Hipertrofia",
        dayLabel: "Sábado",
        exercises: [
          { exerciseCanonical: "levantamento terra convencional", targetSets: 3, targetRepsMin: 4, targetRepsMax: 6, targetRpe: 8.5 },
          { exerciseCanonical: "leg press 45", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
          { exerciseCanonical: "mesa flexora", targetSets: 4, targetRepsMin: 10, targetRepsMax: 12 },
          { exerciseCanonical: "panturrilha em pe", targetSets: 4, targetRepsMin: 15, targetRepsMax: 20 },
        ],
      },
    ],
  },
  BRO_SPLIT: {
    type: "BRO_SPLIT",
    label: "Bro Split (5 Dias - 1 Músculo/Dia)",
    description: "O clássico do fisiculturismo: um grupo muscular principal por dia com volume concentrado.",
    daysCount: 5,
    routines: [
      {
        letter: "A",
        name: "Treino de Peito",
        dayLabel: "Segunda-feira",
        exercises: [
          { exerciseCanonical: "supino reto com barra", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, targetRpe: 8.5 },
          { exerciseCanonical: "supino inclinado com halteres", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10 },
          { exerciseCanonical: "crucifixo na polia", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
          { exerciseCanonical: "mergulho nas paralelas", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },
        ],
      },
      {
        letter: "B",
        name: "Treino de Costas",
        dayLabel: "Terça-feira",
        exercises: [
          { exerciseCanonical: "levantamento terra convencional", targetSets: 3, targetRepsMin: 4, targetRepsMax: 6, targetRpe: 8.5 },
          { exerciseCanonical: "remada curvada com barra", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8 },
          { exerciseCanonical: "puxada alta na polia", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10 },
          { exerciseCanonical: "remada baixa triangulo", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        ],
      },
      {
        letter: "C",
        name: "Treino de Pernas",
        dayLabel: "Quarta-feira",
        exercises: [
          { exerciseCanonical: "agachamento livre com barra", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, targetRpe: 8.5 },
          { exerciseCanonical: "leg press 45", targetSets: 4, targetRepsMin: 10, targetRepsMax: 12 },
          { exerciseCanonical: "stiff com barra", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },
          { exerciseCanonical: "cadeira extensora", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
          { exerciseCanonical: "panturrilha em pe", targetSets: 4, targetRepsMin: 15, targetRepsMax: 20 },
        ],
      },
      {
        letter: "D",
        name: "Treino de Ombros & Trapézio",
        dayLabel: "Quinta-feira",
        exercises: [
          { exerciseCanonical: "desenvolvimento militar com barra", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8 },
          { exerciseCanonical: "elevacao lateral com halteres", targetSets: 4, targetRepsMin: 12, targetRepsMax: 15 },
          { exerciseCanonical: "crucifixo invertido", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
          { exerciseCanonical: "encolhimento de ombros com barra", targetSets: 4, targetRepsMin: 10, targetRepsMax: 12 },
        ],
      },
      {
        letter: "E",
        name: "Treino de Braços (Bíceps & Tríceps)",
        dayLabel: "Sexta-feira",
        exercises: [
          { exerciseCanonical: "rosca direta com barra w", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10 },
          { exerciseCanonical: "triceps testa com barra", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10 },
          { exerciseCanonical: "rosca martelo com halteres", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
          { exerciseCanonical: "triceps corda na polia", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
        ],
      },
    ],
  },
};

export async function applyPresetSplit(splitType: string) {
  const preset = SPLIT_PRESETS[splitType] || SPLIT_PRESETS.UPPER_LOWER;

  // Buscar todos os exercícios cadastrados para mapear IDs
  const allExercises = db.select().from(schema.exercises).all();
  const exerciseMap = new Map<string, number>();
  for (const ex of allExercises) {
    exerciseMap.set(ex.canonicalName, ex.id);
  }

  // Deletar rotinas antigas para aplicar a nova divisão
  db.delete(schema.routineExercises).run();
  db.delete(schema.workoutRoutines).run();

  // Inserir as novas rotinas e seus exercícios
  const createdRoutines = [];

  for (let rIdx = 0; rIdx < preset.routines.length; rIdx++) {
    const routineCfg = preset.routines[rIdx];

    const insertedRoutine = db
      .insert(schema.workoutRoutines)
      .values({
        splitType: preset.type,
        name: routineCfg.name,
        letter: routineCfg.letter,
        dayLabel: routineCfg.dayLabel,
        orderIndex: rIdx,
        isActive: true,
      })
      .returning()
      .get();

    createdRoutines.push(insertedRoutine);

    // Inserir os exercícios configurados para esta rotina
    for (let eIdx = 0; eIdx < routineCfg.exercises.length; eIdx++) {
      const exCfg = routineCfg.exercises[eIdx];
      const exId = exerciseMap.get(exCfg.exerciseCanonical);

      if (exId) {
        db.insert(schema.routineExercises)
          .values({
            routineId: insertedRoutine.id,
            exerciseId: exId,
            targetSets: exCfg.targetSets,
            targetRepsMin: exCfg.targetRepsMin,
            targetRepsMax: exCfg.targetRepsMax,
            targetRpe: exCfg.targetRpe || null,
            notes: exCfg.notes || null,
            orderIndex: eIdx,
          })
          .run();
      }
    }
  }

  return getActiveRoutines();
}

export async function getActiveRoutines() {
  const routines = db
    .select()
    .from(schema.workoutRoutines)
    .where(eq(schema.workoutRoutines.isActive, true))
    .orderBy(asc(schema.workoutRoutines.orderIndex))
    .all();

  const result = [];

  for (const r of routines) {
    const rExercises = db
      .select({
        id: schema.routineExercises.id,
        routineId: schema.routineExercises.routineId,
        exerciseId: schema.routineExercises.exerciseId,
        targetSets: schema.routineExercises.targetSets,
        targetRepsMin: schema.routineExercises.targetRepsMin,
        targetRepsMax: schema.routineExercises.targetRepsMax,
        targetRpe: schema.routineExercises.targetRpe,
        notes: schema.routineExercises.notes,
        orderIndex: schema.routineExercises.orderIndex,
        exerciseName: schema.exercises.name,
        exerciseCanonical: schema.exercises.canonicalName,
        targetMuscleGroup: schema.exercises.targetMuscleGroup,
        category: schema.exercises.category,
      })
      .from(schema.routineExercises)
      .innerJoin(schema.exercises, eq(schema.routineExercises.exerciseId, schema.exercises.id))
      .where(eq(schema.routineExercises.routineId, r.id))
      .orderBy(asc(schema.routineExercises.orderIndex))
      .all();

    result.push({
      ...r,
      exercises: rExercises,
    });
  }

  return result;
}
