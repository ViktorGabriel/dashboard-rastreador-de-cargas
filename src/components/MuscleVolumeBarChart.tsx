"use client";

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { Target, Info, Activity } from "lucide-react";

interface MuscleVolumeItem {
  muscle: string;
  sets: number;
  volume: number;
}

interface MuscleVolumeBarChartProps {
  refreshTrigger: number;
}

const MUSCLE_COLORS: Record<string, string> = {
  Peito: "#34d399",
  Costas: "#38bdf8",
  Quadríceps: "#a855f7",
  Posterior: "#f43f5e",
  Ombros: "#f59e0b",
  Bíceps: "#ec4899",
  Tríceps: "#818cf8",
  Geral: "#94a3b8",
};

interface TooltipPayloadItem {
  payload: MuscleVolumeItem;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

// Custom Tooltip modularizado para o compilador do React 19
function CustomMuscleTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const item = payload[0].payload;
    const isOptimal = item.sets >= 10 && item.sets <= 20;

    return (
      <div className="p-3.5 rounded-2xl bg-slate-950/95 border border-white/10 shadow-2xl backdrop-blur-2xl text-xs space-y-2 min-w-[190px] animate-modal-in">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <span className="font-bold text-white text-sm">{item.muscle}</span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
              isOptimal
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : item.sets > 20
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-slate-800 text-slate-400 border-white/5"
            }`}
          >
            {isOptimal ? "Faixa Ideal" : item.sets > 20 ? "Volume Alto" : "Manutenção"}
          </span>
        </div>

        <div className="space-y-1 font-mono text-[11px] text-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Séries de Trabalho:</span>
            <strong className="text-emerald-400 font-bold text-xs">{item.sets} sets</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Volume Bruto:</span>
            <strong className="text-sky-400">{item.volume.toLocaleString("pt-BR")} kg</strong>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 pt-1 border-t border-white/5">
          Referência ótima: 10 a 20 séries/semana
        </div>
      </div>
    );
  }
  return null;
}

export function MuscleVolumeBarChart({ refreshTrigger }: MuscleVolumeBarChartProps) {
  const [data, setData] = useState<MuscleVolumeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadVolumeSummary() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/metrics?summary=volume");
        const list = await res.json();
        if (Array.isArray(list)) {
          setData(list);
        }
      } catch (err) {
        console.error("Erro ao carregar resumo de volume:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadVolumeSummary();
  }, [refreshTrigger]);

  return (
    <div className="bezel-shell h-full">
      <div className="bezel-core p-5 sm:p-6 space-y-4 h-full flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Volume de Hipertrofia
                </h3>
                <p className="text-xs text-slate-400">
                  Séries de trabalho por grupo muscular
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
              <Info className="h-3 w-3 text-slate-500" />
              <span>Sem aquecimentos</span>
            </div>
          </div>

          {/* Guidelines micro badge */}
          <div className="mt-3 flex items-center justify-between text-[11px] p-2 rounded-xl bg-slate-950/40 border border-white/5 text-slate-400">
            <span>Meta recomendada (Schoenfeld):</span>
            <span className="font-bold text-emerald-400 font-mono">10 - 20 séries</span>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-60 w-full pt-2">
          {isLoading ? (
            /* Skeleton loader with bars */
            <div className="h-full w-full rounded-2xl skeleton-shimmer border border-white/5 flex flex-col items-center justify-center gap-3">
              <Activity className="h-6 w-6 text-purple-400 animate-pulse" />
              <p className="text-xs font-medium text-slate-400">Calculando distribuição de volume...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-2xl bg-slate-950/30">
              <Target className="h-6 w-6 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400">
                Nenhum dado de volume ainda. Registre sessões para mapear sua curva de hipertrofia.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="muscle" stroke="#64748b" fontSize={11} tickLine={false} dy={4} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} dx={-4} />
                <Tooltip content={<CustomMuscleTooltip />} />
                <ReferenceLine y={10} stroke="rgba(52, 211, 153, 0.25)" strokeDasharray="3 3" />
                <Bar
                  dataKey="sets"
                  radius={[8, 8, 2, 2]}
                  isAnimationActive={true}
                  animationDuration={850}
                  animationEasing="ease-out"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={MUSCLE_COLORS[entry.muscle] || "#10b981"}
                      className="hover:opacity-85 transition-opacity cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
