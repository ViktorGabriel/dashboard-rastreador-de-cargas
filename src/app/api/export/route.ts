import { NextResponse } from "next/server";
import {
  getFullExportData,
  generateExportJSON,
  generateDetailedSetsCSV,
  generateWorkoutsSummaryCSV,
  generateExercisesCSV,
  generateRoutinesCSV,
} from "@/lib/export-service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "json").toLowerCase();
    const type = (searchParams.get("type") || (format === "csv" ? "sets" : "all")).toLowerCase();
    const download = searchParams.get("download") !== "false";

    const exportData = await getFullExportData();
    const dateStr = new Date().toISOString().split("T")[0];

    if (format === "csv") {
      let csvContent = "";
      let filenamePrefix = "ironparse-sets";

      switch (type) {
        case "workouts":
          csvContent = generateWorkoutsSummaryCSV(exportData);
          filenamePrefix = "ironparse-workouts";
          break;
        case "exercises":
          csvContent = generateExercisesCSV(exportData);
          filenamePrefix = "ironparse-exercises";
          break;
        case "routines":
          csvContent = generateRoutinesCSV(exportData);
          filenamePrefix = "ironparse-routines";
          break;
        case "sets":
        default:
          csvContent = generateDetailedSetsCSV(exportData);
          filenamePrefix = "ironparse-detailed-sets";
          break;
      }

      const headers: Record<string, string> = {
        "Content-Type": "text/csv; charset=utf-8",
      };

      if (download) {
        headers["Content-Disposition"] = `attachment; filename="${filenamePrefix}-${dateStr}.csv"`;
      }

      return new NextResponse(csvContent, {
        status: 200,
        headers,
      });
    }

    // Default: JSON export
    const jsonContent = generateExportJSON(exportData);

    const headers: Record<string, string> = {
      "Content-Type": "application/json; charset=utf-8",
    };

    if (download) {
      headers["Content-Disposition"] = `attachment; filename="ironparse-export-${dateStr}.json"`;
    }

    return new NextResponse(jsonContent, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    console.error("Erro na exportação de dados:", error);
    const message = error instanceof Error ? error.message : "Erro interno ao processar exportação.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
