"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Activity, Zap } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface ExerciseOption {
  id: number;
  name: string;
  targetMuscleGroup: string;
  category: string;
}

interface OverloadDelta {
  diff_weight_kg: number;
  diff_1rm_kg: number;
  diff_volume_kg: number;
  is_progress: boolean;
}

interface ProgressionPoint {
  date: string;
  title: string;
  max_weight: number;
  top_set_weight: number;
  best_1rm: number;
  total_volume: number;
  sets_count: number;
  best_rpe: number | null;
}

interface ProgressiveOverloadChartsProps {
  refreshTrigger: number;
}

export function ProgressiveOverloadCharts({ refreshTrigger }: ProgressiveOverloadChartsProps) {
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [history, setHistory] = useState<ProgressionPoint[]>([]);
  const [delta, setDelta] = useState<OverloadDelta | null>(null);
  const [activeMetric, setActiveMetric] = useState<"strength" | "volume">("strength");
  const [isLoading, setIsLoading] = useState(false);

  // Carregar lista de exercícios
  useEffect(() => {
    async function loadExercises() {
      try {
        const res = await fetch("/api/exercises");
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          setExercises(list);
          if (!selectedExerciseId) {
            // Seleciona Supino Reto como default ou o primeiro da lista
            const defaultEx = list.find((e: ExerciseOption) => e.name.includes("Supino Reto")) || list[0];
            setSelectedExerciseId(defaultEx.id);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar exercícios:", err);
      }
    }
    loadExercises();
  }, [refreshTrigger]);

  // Carregar histórico do exercício selecionado
  useEffect(() => {
    if (!selectedExerciseId) return;

    async function loadHistory() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/metrics?exerciseId=${selectedExerciseId}`);
        const data = await res.json();
        if (data.history) {
          setHistory(data.history);
          setDelta(data.overloadDelta);
        }
      } catch (err) {
        console.error("Erro ao buscar histórico:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, [selectedExerciseId, refreshTrigger]);

  const selectedExercise = exercises.find((e) => e.id === selectedExerciseId);

  // Tooltip customizado do Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point: ProgressionPoint = payload[0].payload;
      return (
        <div className="p-3 rounded-xl bg-slate-900/95 border border-white/10 shadow-xl backdrop-blur-md text-xs space-y-1">
          <p className="font-bold text-white flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            {point.title} ({label})
          </p>
          <div className="text-slate-300 space-y-0.5 pt-1 border-t border-white/5 font-mono">
            <p>1RM Estimado: <strong className="text-emerald-400">{point.best_1rm} kg</strong></p>
            <p>Top Set: <strong className="text-amber-400">{point.top_set_weight} kg</strong></p>
            <p>Volume Load: <strong className="text-sky-400">{point.total_volume} kg</strong></p>
            {point.best_rpe && <p>RPE Máximo: <strong className="text-purple-400">@{point.best_rpe}</strong></p>}
            <p className="text-[10px] text-slate-500">Séries válidas: {point.sets_count}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-5 sm:p-6 space-y-5">
      {/* Chart Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Curva de Sobrecarga Progressiva
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Acompanhe a progressão de 1RM, Top Sets e Volume ao longo das sessões
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Seletor de Exercício */}
          <select
            id="exercise-selector"
            value={selectedExerciseId || ""}
            onChange={(e) => setSelectedExerciseId(Number(e.target.value))}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:border-emerald-500 outline-none max-w-xs"
          >
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.targetMuscleGroup})
              </option>
            ))}
          </select>

          {/* Metric Toggle Tabs */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-900 border border-white/10 text-xs">
            <button
              onClick={() => setActiveMetric("strength")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                activeMetric === "strength"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              1RM & Força (kg)
            </button>
            <button
              onClick={() => setActiveMetric("volume")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                activeMetric === "volume"
                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Volume Total (kg)
            </button>
          </div>
        </div>
      </div>

      {/* Delta Badges */}
      {delta && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-400">Δ Carga Top Set</span>
            <div className={`flex items-center gap-1 font-mono font-bold text-xs ${
              delta.diff_weight_kg >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}>
              {delta.diff_weight_kg >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              <span>{delta.diff_weight_kg >= 0 ? `+${delta.diff_weight_kg}` : delta.diff_weight_kg} kg</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-400">Δ 1RM Estimado</span>
            <div className={`flex items-center gap-1 font-mono font-bold text-xs ${
              delta.diff_1rm_kg >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}>
              {delta.diff_1rm_kg >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              <span>{delta.diff_1rm_kg >= 0 ? `+${delta.diff_1rm_kg}` : delta.diff_1rm_kg} kg</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-400">Δ Volume Load</span>
            <div className={`flex items-center gap-1 font-mono font-bold text-xs ${
              delta.diff_volume_kg >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}>
              {delta.diff_volume_kg >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              <span>{delta.diff_volume_kg >= 0 ? `+${delta.diff_volume_kg}` : delta.diff_volume_kg} kg</span>
            </div>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="h-72 w-full pt-2">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
            Carregando evolução...
          </div>
        ) : history.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-xl bg-slate-950/30">
            <Activity className="h-8 w-8 text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-300">
              Nenhum treino registrado ainda para {selectedExercise?.name || "este exercício"}.
            </p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
              Digite seu treino acima (ex: <em>&quot;Hoje fiz 4x8 no supino com 90kg&quot;</em>) para iniciar o histórico de sobrecarga progressiva.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {activeMetric === "strength" ? (
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorTopSet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="kg" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Area
                  type="monotone"
                  dataKey="best_1rm"
                  name="1RM Estimado (Epley)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#color1RM)"
                />
                <Area
                  type="monotone"
                  dataKey="top_set_weight"
                  name="Carga Máx / Top Set"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorTopSet)"
                />
              </AreaChart>
            ) : (
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="kg" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Area
                  type="monotone"
                  dataKey="total_volume"
                  name="Volume Load Total (kg)"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorVolume)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
