import { applyPresetSplit, getActiveRoutines } from "../lib/preset-routines";

async function main() {
  console.log("🏋️ Inicializando rotinas padrão de treino...");
  const existing = await getActiveRoutines();
  if (existing.length === 0) {
    console.log("Aplicando preset padrão UPPER_LOWER...");
    const routines = await applyPresetSplit("UPPER_LOWER");
    console.log(`✅ ${routines.length} fichas criadas com sucesso!`);
  } else {
    console.log(`Rotinas já existentes: ${existing.length} fichas encontradas.`);
  }
}

main().catch(console.error);
