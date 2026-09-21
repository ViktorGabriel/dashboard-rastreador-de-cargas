"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
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

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/metrics");
      const data = await res.json();
      if (data && typeof data.total_workouts === "number") {
        setStats(data);
      }
    } catch (err) {
      console.error("Erro ao carregar métricas globais:", err);
    }
  }, []);

  // Update stats when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadStats();
    }
  }, [loadStats, refreshTrigger]);

  const handleParsed = (result: ParsedWorkoutResult, originalText: string) => {
    setPreviewData(result);
    setOriginalInputText(originalText);
  };

  const handleWorkoutSaved = () => {
    setPreviewData(null);
    setOriginalInputText("");
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
      <Header stats={stats} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <QuickWorkoutLogger onParsed={handleParsed} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProgressiveOverloadCharts refreshTrigger={refreshTrigger} />
          </div>
          <div className="lg:col-span-1">
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

      <footer className="w-full border-t border-white/5 py-4 text-center text-xs text-slate-500">
        IRONPARSE // Sistema de Rastreamento de Força e Sobrecarga Progressiva com IA
      </footer>
    </div>
  );
}
