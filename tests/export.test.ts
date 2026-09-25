import { expect, test, describe } from "vitest";
import {
  escapeCSV,
  toCSVRow,
  generateExportJSON,
  generateDetailedSetsCSV,
  generateWorkoutsSummaryCSV,
  generateExercisesCSV,
  generateRoutinesCSV,
  ExportPayload,
} from "../src/lib/export-service";

describe("Export Service - CSV Escaping & Rows", () => {
  test("escapeCSV handles simple and special characters according to RFC 4180", () => {
    expect(escapeCSV("Supino")).toBe("Supino");
    expect(escapeCSV(100)).toBe("100");
    expect(escapeCSV(null)).toBe("");
    expect(escapeCSV(undefined)).toBe("");
    expect(escapeCSV("Supino, Reto")).toBe('"Supino, Reto"');
    expect(escapeCSV('Treino "Pesado"')).toBe('"Treino ""Pesado"""');
    expect(escapeCSV("Linha 1\nLinha 2")).toBe('"Linha 1\nLinha 2"');
    expect(escapeCSV("Elevação Lateral, Halteres 14kg")).toBe('"Elevação Lateral, Halteres 14kg"');
  });

  test("toCSVRow joins escaped elements with commas", () => {
    const row = toCSVRow([1, "Supino Reto", 80, "RPE 8, suave", 'Série "Top"']);
    expect(row).toBe('1,Supino Reto,80,"RPE 8, suave","Série ""Top"""');
  });
});

describe("Export Service - Payload Generation", () => {
  const mockPayload: ExportPayload = {
    metadata: {
      app: "IRONPARSE",
      version: "0.1.0",
      exportedAt: "2026-09-25T12:00:00.000Z",
      counts: {
        workouts: 1,
        workoutExercises: 1,
        exerciseSets: 2,
        exercisesCatalog: 1,
        routines: 1,
      },
    },
    workouts: [
      {
        id: 1,
        date: "2026-09-24",
        title: "Upper Power A",
        notes: "Excelente ativação no supino",
        rawInputText: "Supino 100kg 5 reps",
        createdAt: 1727180000,
        totalVolumeKg: 1500,
        totalSets: 2,
        workingSets: 2,
        exercises: [
          {
            id: 10,
            exerciseId: 5,
            name: "Supino Reto com Barra",
            canonicalName: "supino reto com barra",
            targetMuscleGroup: "Peito",
            category: "COMPOUND",
            orderIndex: 1,
            notes: "Pausa de 1s no peito",
            sets: [
              {
                id: 101,
                setNumber: 1,
                setType: "WORKING",
                weightKg: 100,
                reps: 5,
                rpe: 8.5,
                rir: 1,
                restSeconds: 180,
                estimated1rm: 116.7,
                volumeLoad: 500,
              },
              {
                id: 102,
                setNumber: 2,
                setType: "TOP_SET",
                weightKg: 110,
                reps: 3,
                rpe: 9.5,
                rir: 0,
                restSeconds: 240,
                estimated1rm: 121,
                volumeLoad: 330,
              },
            ],
          },
        ],
      },
    ],
    exercisesCatalog: [
      {
        id: 5,
        name: "Supino Reto com Barra",
        canonicalName: "supino reto com barra",
        targetMuscleGroup: "Peito",
        category: "COMPOUND",
        createdAt: 1727180000,
      },
    ],
    routines: [
      {
        id: 1,
        splitType: "UPPER_LOWER",
        name: "Upper Força",
        letter: "A",
        dayLabel: "Segunda-feira",
        orderIndex: 0,
        isActive: true,
        createdAt: 1727180000,
        exercises: [
          {
            id: 201,
            exerciseId: 5,
            exerciseName: "Supino Reto com Barra",
            canonicalName: "supino reto com barra",
            targetMuscleGroup: "Peito",
            category: "COMPOUND",
            targetSets: 4,
            targetRepsMin: 4,
            targetRepsMax: 6,
            targetRpe: 8.5,
            notes: "Manter arco estável",
            orderIndex: 0,
          },
        ],
      },
    ],
  };

  test("generateExportJSON produces valid, complete JSON string", () => {
    const jsonStr = generateExportJSON(mockPayload);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.metadata.app).toBe("IRONPARSE");
    expect(parsed.workouts).toHaveLength(1);
    expect(parsed.workouts[0].exercises[0].sets).toHaveLength(2);
    expect(parsed.exercisesCatalog).toHaveLength(1);
    expect(parsed.routines).toHaveLength(1);
  });

  test("generateDetailedSetsCSV includes UTF-8 BOM, headers and all set details", () => {
    const csv = generateDetailedSetsCSV(mockPayload);

    // Starts with UTF-8 BOM (\uFEFF)
    expect(csv.startsWith("\uFEFF")).toBe(true);

    const lines = csv.replace("\uFEFF", "").split("\r\n");
    expect(lines[0]).toBe(
      "workout_id,workout_date,workout_title,workout_notes,exercise_order,exercise_name,exercise_canonical_name,target_muscle_group,exercise_category,set_number,set_type,weight_kg,reps,rpe,rir,rest_seconds,estimated_1rm_kg,volume_load_kg,exercise_notes"
    );

    // 2 sets => 2 rows + 1 header = 3 lines
    expect(lines).toHaveLength(3);

    // Check first set
    expect(lines[1]).toContain("Supino Reto com Barra");
    expect(lines[1]).toContain("100,5,8.5,1,180,116.7,500");

    // Check second set
    expect(lines[2]).toContain("TOP_SET,110,3,9.5,0,240,121,330");
  });

  test("generateWorkoutsSummaryCSV outputs session-level metrics", () => {
    const csv = generateWorkoutsSummaryCSV(mockPayload);
    expect(csv.startsWith("\uFEFF")).toBe(true);

    const lines = csv.replace("\uFEFF", "").split("\r\n");
    expect(lines[0]).toContain("workout_id,date,title,total_volume_kg,total_sets");
    expect(lines[1]).toContain("1,2026-09-24,Upper Power A,1500,2,2,1");
  });

  test("generateExercisesCSV outputs catalog", () => {
    const csv = generateExercisesCSV(mockPayload);
    expect(csv.startsWith("\uFEFF")).toBe(true);

    const lines = csv.replace("\uFEFF", "").split("\r\n");
    expect(lines[0]).toBe("id,name,canonical_name,target_muscle_group,category");
    expect(lines[1]).toBe("5,Supino Reto com Barra,supino reto com barra,Peito,COMPOUND");
  });

  test("generateRoutinesCSV outputs split routines and target exercises", () => {
    const csv = generateRoutinesCSV(mockPayload);
    expect(csv.startsWith("\uFEFF")).toBe(true);

    const lines = csv.replace("\uFEFF", "").split("\r\n");
    expect(lines[0]).toContain("routine_id,split_type,routine_name,letter,day_label");
    expect(lines[1]).toContain("1,UPPER_LOWER,Upper Força,A,Segunda-feira,true,0,Supino Reto com Barra");
  });
});
