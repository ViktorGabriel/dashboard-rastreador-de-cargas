"use client";

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Target, Info } from "lucide-react";

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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: MuscleVolumeItem = payload[0].payload;
      return (
        <div className="p-2.5 rounded-xl bg-slate-900 border border-white/10 shadow-xl text-xs space-y-1">
          <p className="font-bold text-white">{item.muscle}</p>
          <p className="text-slate-300">
            Séries Válidas: <strong className="text-emerald-400">{item.sets}</strong>
          </p>
          <p className="text-slate-400 font-mono">
            Volume: {item.volume.toLocaleString("pt-BR")} kg
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Volume de Hipertrofia (Séries por Músculo)
            </h3>
            <p className="text-xs text-slate-400">
              Controle de séries de trabalho para hipertrofia (Meta: 10-20 séries/semana)
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500">
          <Info className="h-3 w-3" />
          <span>Exclui aquecimentos</span>
        </div>
      </div>

      <div className="h-56 w-full pt-2">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
            Carregando volume...
          </div>
        ) : data.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-xs text-slate-500">
            Nenhum dado de volume ainda. Registre treinos para ver a distribuição muscular.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="muscle" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sets" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={MUSCLE_COLORS[entry.muscle] || "#10b981"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
