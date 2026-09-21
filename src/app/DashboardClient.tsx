"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { RoutineSplitManager } from "@/components/RoutineSplitManager";
import { QuickWorkoutLogger } from "@/components/QuickWorkoutLogger";
import { PreviewConfirmModal } from "@/components/PreviewConfirmModal";
import { ProgressiveOverloadCharts } from "@/components/ProgressiveOverloadCharts";
import { MuscleVolumeBarChart } from "@/components/MuscleVolumeBarChart";
import { WorkoutHistoryFeed } from "@/components/WorkoutHistoryFeed";
import { ParsedWorkoutResult } from "@/lib/formulas";

export function DashboardClient({ initialStats }: { initialStats: { total_workouts: number; total_volume_kg: number; total_working_sets: number } }) {
  const [stats, setStats] = useState(initialStats);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [previewData, setPreviewData] = useState<ParsedWorkoutResult | null>(null);
  const [originalInputText, setOriginalInputText] = useState("");
  const [routinePrompt, setRoutinePrompt] = useState("");

  // Update stats when refreshTrigger changes
  useEffect(() => {
    let active = true;
    if (refreshTrigger > 0) {
      (async () => {
        try {
          const res = await fetch("/api/metrics");
          const data = await res.json();
          if (active && data && typeof data.total_workouts === "number") {
            setStats(data);
          }
        } catch (err) {
          console.error("Erro ao carregar métricas globais:", err);
        }
      })();
    }
    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  const handleParsed = (result: ParsedWorkoutResult, originalText: string) => {
    setPreviewData(result);
    setOriginalInputText(originalText);
  };

  const handleWorkoutSaved = () => {
    setPreviewData(null);
    setOriginalInputText("");
    setRoutinePrompt("");
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleStartRoutine = (promptText: string) => {
    setRoutinePrompt(promptText);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-bg-primary text-text-primary">
      <Header stats={stats} />

      <main className="flex-1 w-full max-w-[1780px] 2xl:max-w-[2040px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
        {/* Gestão de Fichas e Divisões Clássicas */}
        <RoutineSplitManager onStartWorkout={handleStartRoutine} />

        {/* Logger Rápido de Treino */}
        <QuickWorkoutLogger
          onParsed={handleParsed}
          externalText={routinePrompt}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <ProgressiveOverloadCharts refreshTrigger={refreshTrigger} />
          </div>
          <div className="lg:col-span-4">
            <MuscleVolumeBarChart refreshTrigger={refreshTrigger} />
          </div>
        </div>

        <WorkoutHistoryFeed
          refreshTrigger={refreshTrigger}
          onWorkoutDeleted={() => setRefreshTrigger((prev) => prev + 1)}
        />
      </main>

      {previewData && (
        <PreviewConfirmModal
          data={previewData}
          originalText={originalInputText}
          onClose={() => setPreviewData(null)}
          onSaved={handleWorkoutSaved}
        />
      )}

      <footer className="w-full border-t border-white/5 py-4 text-xs text-slate-500">
        <div className="w-full max-w-[1780px] 2xl:max-w-[2040px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>IRONPARSE // Sistema de Rastreamento de Força e Sobrecarga Progressiva com IA</span>
          <span className="text-[11px] text-slate-600">Ultra-Wide & High Density Ready</span>
        </div>
      </footer>
    </div>
  );
}
