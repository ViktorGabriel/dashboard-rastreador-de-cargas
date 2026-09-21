import { eq } from "drizzle-orm";
import { db, schema } from "./index";

const initialExercises: Array<{
  name: string;
  canonicalName: string;
  targetMuscleGroup: string;
  category: "COMPOUND" | "ISOLATION";
}> = [
  // Peito
  { name: "Supino Reto com Barra", canonicalName: "supino reto com barra", targetMuscleGroup: "Peito", category: "COMPOUND" },
  { name: "Supino Inclinado com Halteres", canonicalName: "supino inclinado com halteres", targetMuscleGroup: "Peito", category: "COMPOUND" },
  { name: "Supino Inclinado com Barra", canonicalName: "supino inclinado com barra", targetMuscleGroup: "Peito", category: "COMPOUND" },
  { name: "Crucifixo na Polia (Crossover)", canonicalName: "crucifixo na polia", targetMuscleGroup: "Peito", category: "ISOLATION" },
  { name: "Mergulho nas Paralelas", canonicalName: "mergulho nas paralelas", targetMuscleGroup: "Peito", category: "COMPOUND" },

  // Costas
  { name: "Levantamento Terra Convencional", canonicalName: "levantamento terra convencional", targetMuscleGroup: "Costas", category: "COMPOUND" },
  { name: "Remada Curvada com Barra", canonicalName: "remada curvada com barra", targetMuscleGroup: "Costas", category: "COMPOUND" },
  { name: "Puxada Alta na Polia", canonicalName: "puxada alta na polia", targetMuscleGroup: "Costas", category: "COMPOUND" },
  { name: "Remada Baixa Triângulo", canonicalName: "remada baixa triangulo", targetMuscleGroup: "Costas", category: "COMPOUND" },
  { name: "Barra Fixa (Pull-up)", canonicalName: "barra fixa", targetMuscleGroup: "Costas", category: "COMPOUND" },

  // Pernas / Quadríceps / Posterior
  { name: "Agachamento Livre com Barra", canonicalName: "agachamento livre com barra", targetMuscleGroup: "Quadríceps", category: "COMPOUND" },
  { name: "Leg Press 45°", canonicalName: "leg press 45", targetMuscleGroup: "Quadríceps", category: "COMPOUND" },
  { name: "Cadeira Extensora", canonicalName: "cadeira extensora", targetMuscleGroup: "Quadríceps", category: "ISOLATION" },
  { name: "Mesa Flexora", canonicalName: "mesa flexora", targetMuscleGroup: "Posterior", category: "ISOLATION" },
  { name: "Stiff com Barra", canonicalName: "stiff com barra", targetMuscleGroup: "Posterior", category: "COMPOUND" },
  { name: "Elevação Pélvica (Hip Thrust)", canonicalName: "elevacao pelvica", targetMuscleGroup: "Glúteos", category: "COMPOUND" },
  { name: "Panturrilha em Pé", canonicalName: "panturrilha em pe", targetMuscleGroup: "Panturrilha", category: "ISOLATION" },

  // Ombros & Trapézio
  { name: "Desenvolvimento Militar com Barra", canonicalName: "desenvolvimento militar com barra", targetMuscleGroup: "Ombros", category: "COMPOUND" },
  { name: "Desenvolvimento com Halteres", canonicalName: "desenvolvimento com halteres", targetMuscleGroup: "Ombros", category: "COMPOUND" },
  { name: "Elevação Lateral com Halteres", canonicalName: "elevacao lateral com halteres", targetMuscleGroup: "Ombros", category: "ISOLATION" },
  { name: "Elevação Lateral na Polia", canonicalName: "elevacao lateral na polia", targetMuscleGroup: "Ombros", category: "ISOLATION" },
  { name: "Crucifixo Invertido", canonicalName: "crucifixo invertido", targetMuscleGroup: "Ombros", category: "ISOLATION" },
  { name: "Encolhimento de Ombros com Barra", canonicalName: "encolhimento de ombros com barra", targetMuscleGroup: "Trapézio", category: "ISOLATION" },

  // Braços (Bíceps & Tríceps)
  { name: "Rosca Direta com Barra W", canonicalName: "rosca direta com barra w", targetMuscleGroup: "Bíceps", category: "ISOLATION" },
  { name: "Rosca Martelo com Halteres", canonicalName: "rosca martelo com halteres", targetMuscleGroup: "Bíceps", category: "ISOLATION" },
  { name: "Rosca Scott", canonicalName: "rosca scott", targetMuscleGroup: "Bíceps", category: "ISOLATION" },
  { name: "Tríceps Testa com Barra", canonicalName: "triceps testa com barra", targetMuscleGroup: "Tríceps", category: "ISOLATION" },
  { name: "Tríceps Corda na Polia", canonicalName: "triceps corda na polia", targetMuscleGroup: "Tríceps", category: "ISOLATION" },
  { name: "Supino Fechado", canonicalName: "supino fechado", targetMuscleGroup: "Tríceps", category: "COMPOUND" },
];

export async function seed() {
  console.log("🌱 Iniciando seed de exercícios...");
  
  for (const item of initialExercises) {
    const existing = db
      .select()
      .from(schema.exercises)
      .where(eq(schema.exercises.canonicalName, item.canonicalName))
      .get();

    if (!existing) {
      db.insert(schema.exercises).values(item).run();
      console.log(`+ Exercício adicionado: ${item.name}`);
    }
  }

  console.log("✅ Seed finalizado com sucesso!");
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Erro no seed:", err);
      process.exit(1);
    });
}
