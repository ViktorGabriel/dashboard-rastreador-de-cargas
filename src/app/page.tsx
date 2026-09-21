import React from "react";
import { DashboardClient } from "./DashboardClient";
import { db, schema } from "@/db";
import { sql } from "drizzle-orm";

async function getGlobalStats() {
  const totalWorkouts = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.workouts)
    .get()?.count || 0;

  const totalVolumeResult = db
    .select({ sumVolume: sql<number>`sum(${schema.exerciseSets.volumeLoad})` })
    .from(schema.exerciseSets)
    .get()?.sumVolume || 0;

  const totalSetsResult = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.exerciseSets)
    .where(sql`${schema.exerciseSets.setType} != 'WARMUP'`)
    .get()?.count || 0;

  return {
    total_workouts: totalWorkouts,
    total_volume_kg: Math.round(totalVolumeResult),
    total_working_sets: totalSetsResult,
  };
}

export default async function DashboardPage() {
  const initialStats = await getGlobalStats();

  return <DashboardClient initialStats={initialStats} />;
}
