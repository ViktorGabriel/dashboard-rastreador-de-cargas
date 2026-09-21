"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Activity, Zap, ChevronDown, Layers } from "lucide-react";
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

interface TooltipPayloadItem {
  payload: ProgressionPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

// Custom Tooltip declarado fora do render para conformidade com o compilador do React 19
function CustomChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const point = payload[0].payload;
    return (
      <div className="p-3.5 rounded-2xl bg-slate-950/95 border border-white/10 shadow-2xl backdrop-blur-2xl text-xs space-y-2 min-w-[210px] animate-modal-in">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse"></span>
            <span className="font-bold text-white tracking-tight">{point.title}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-white/5">{label}</span>
        </div>

        <div className="text-slate-300 space-y-1.5 font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">1RM Estimado:</span>
            <span className="text-emerald-400 font-bold text-xs">{point.best_1rm} kg</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Top Set (Carga):</span>
            <span className="text-amber-400 font-bold">{point.top_set_weight} kg</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Volume Total:</span>
            <span className="text-sky-400 font-bold">{point.total_volume.toLocaleString("pt-BR")} kg</span>
          </div>
          {point.best_rpe !== null && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Intensidade (RPE):</span>
              <span className="text-purple-400 font-bold">@{point.best_rpe}</span>
            </div>
          )}
        </div>

        <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
          <span>Séries computadas</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 font-bold">{point.sets_count}</span>
        </div>
      </div>
    );
  }
  return null;
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
            const defaultEx = list.find((e: ExerciseOption) => e.name.includes("Supino Reto")) || list[0];
            setSelectedExerciseId(defaultEx.id);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar exercícios:", err);
      }
    }
    loadExercises();
  }, [refreshTrigger, selectedExerciseId]);

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

  return (
    <div className="bezel-shell">
      <div className="bezel-core p-5 sm:p-6 space-y-6">
        {/* Chart Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Curva de Sobrecarga Progressiva
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-400 border border-white/10 uppercase tracking-widest">
                    Linear Telemetry
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Progressão de 1RM estimada, cargas máximas e volume acumulado
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Seletor de Exercício Estilizado */}
            <div className="relative">
              <select
                id="exercise-selector"
                value={selectedExerciseId || ""}
                onChange={(e) => setSelectedExerciseId(Number(e.target.value))}
                className="appearance-none bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-white/20 rounded-xl pl-3.5 pr-8 py-1.5 text-xs text-slate-200 font-medium focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/40 outline-none transition cursor-pointer max-w-xs shadow-sm"
              >
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id} className="bg-slate-900 text-white">
                    {ex.name} • {ex.targetMuscleGroup}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Metric Segmented Switch (Pill Toggle) */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-white/10 text-xs shadow-inner">
              <button
                type="button"
                onClick={() => setActiveMetric("strength")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all duration-300 ease-out flex items-center gap-1.5 ${
                  activeMetric === "strength"
                    ? "bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Zap className="h-3 w-3" />
                <span>1RM & Força</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric("volume")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all duration-300 ease-out flex items-center gap-1.5 ${
                  activeMetric === "volume"
                    ? "bg-gradient-to-r from-sky-500/25 to-blue-500/25 text-sky-300 border border-sky-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="h-3 w-3" />
                <span>Volume Load</span>
              </button>
            </div>
          </div>
        </div>

        {/* Delta Badges Cards */}
        {delta && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-white/5 hover:border-white/10 transition flex items-center justify-between group">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-400 transition">
                  Δ Carga Top Set
                </span>
                <p className="text-xs text-slate-400">Última vs Penúltima sessão</p>
              </div>
              <div
                className={`flex items-center gap-1 font-mono font-bold text-xs px-2 py-1 rounded-lg border ${
                  delta.diff_weight_kg >= 0
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {delta.diff_weight_kg >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                <span>{delta.diff_weight_kg >= 0 ? `+${delta.diff_weight_kg}` : delta.diff_weight_kg} kg</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-white/5 hover:border-white/10 transition flex items-center justify-between group">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-400 transition">
                  Δ 1RM Estimado
                </span>
                <p className="text-xs text-slate-400">Índice Epley de força máx</p>
              </div>
              <div
                className={`flex items-center gap-1 font-mono font-bold text-xs px-2 py-1 rounded-lg border ${
                  delta.diff_1rm_kg >= 0
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {delta.diff_1rm_kg >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                <span>{delta.diff_1rm_kg >= 0 ? `+${delta.diff_1rm_kg}` : delta.diff_1rm_kg} kg</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-white/5 hover:border-white/10 transition flex items-center justify-between group">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-400 transition">
                  Δ Volume Load
                </span>
                <p className="text-xs text-slate-400">Tonelagem total da sessão</p>
              </div>
              <div
                className={`flex items-center gap-1 font-mono font-bold text-xs px-2 py-1 rounded-lg border ${
                  delta.diff_volume_kg >= 0
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {delta.diff_volume_kg >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                <span>{delta.diff_volume_kg >= 0 ? `+${delta.diff_volume_kg}` : delta.diff_volume_kg} kg</span>
              </div>
            </div>
          </div>
        )}

        {/* Chart Canvas Area */}
        <div className="h-72 w-full pt-1">
          {isLoading ? (
            /* Skeleton Shimmer */
            <div className="h-full w-full rounded-2xl skeleton-shimmer border border-white/5 flex flex-col items-center justify-center gap-3">
              <Activity className="h-6 w-6 text-emerald-400 animate-pulse" />
              <p className="text-xs font-medium text-slate-400">Processando telemetria de cargas...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-2xl bg-slate-950/30">
              <div className="p-3 rounded-2xl bg-white/5 mb-3">
                <Activity className="h-8 w-8 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-200">
                Nenhum treino registrado ainda para {selectedExercise?.name || "este exercício"}.
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Digite uma sessão no campo acima (ex: <em>&quot;Hoje fiz 4x8 no supino com 90kg&quot;</em>) para iniciar sua curva de progressão.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {activeMetric === "strength" ? (
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorTopSet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} dy={6} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="kg" dx={-4} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                  <Area
                    type="monotone"
                    dataKey="best_1rm"
                    name="1RM Estimado (Epley)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#color1RM)"
                    isAnimationActive={true}
                    animationDuration={850}
                    animationEasing="ease-out"
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
                    isAnimationActive={true}
                    animationDuration={850}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              ) : (
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} dy={6} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="kg" dx={-4} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                  <Area
                    type="monotone"
                    dataKey="total_volume"
                    name="Volume Load Total (kg)"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorVolume)"
                    isAnimationActive={true}
                    animationDuration={850}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
