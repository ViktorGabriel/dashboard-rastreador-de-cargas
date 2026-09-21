"use client";

import React, { useEffect, useState } from "react";
import { History, ChevronDown, ChevronUp, Trash2, Calendar, Dumbbell, Copy, Check } from "lucide-react";

interface WorkoutItem {
  id: number;
  date: string;
  title: string;
  notes?: string | null;
  raw_input_text: string;
  total_volume: number;
  total_sets: number;
  exercises: Array<{
    id: number;
    name: string;
    target_muscle_group: string;
    category: string;
    notes?: string | null;
    sets: Array<{
      id: number;
      set_number: number;
      set_type: string;
      weight_kg: number;
      reps: number;
      rpe: number | null;
      estimated_1rm: number;
      volume_load: number;
    }>;
  }>;
}

interface WorkoutHistoryFeedProps {
  refreshTrigger: number;
  onWorkoutDeleted: () => void;
}

export function WorkoutHistoryFeed({ refreshTrigger, onWorkoutDeleted }: WorkoutHistoryFeedProps) {
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    async function loadWorkouts() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/workouts");
        const list = await res.json();
        if (Array.isArray(list)) {
          setWorkouts(list);
        }
      } catch (err) {
        console.error("Erro ao carregar histórico de treinos:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkouts();
  }, [refreshTrigger]);

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este treino do histórico?")) return;

    try {
      const res = await fetch(`/api/workouts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setWorkouts(workouts.filter((w) => w.id !== id));
        onWorkoutDeleted();
      }
    } catch (err) {
      console.error("Erro ao deletar treino:", err);
    }
  };

  const handleCopyText = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="glass-card p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Histórico Cronológico de Sessões
            </h3>
            <p className="text-xs text-slate-400">
              Todas as sessões registradas com detalhamento completo de cargas
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-mono">
          {workouts.length} {workouts.length === 1 ? "registro" : "registros"}
        </span>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400">Carregando histórico...</div>
      ) : workouts.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          Nenhum treino registrado ainda. Use a caixa de texto acima para registrar o primeiro!
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((w) => {
            const isExpanded = expandedId === w.id;
            return (
              <div
                key={w.id}
                className="rounded-xl bg-slate-950/40 border border-white/5 overflow-hidden transition"
              >
                {/* Accordion Bar */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : w.id)}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-900 text-emerald-400 font-mono text-xs font-bold shrink-0">
                      <Calendar className="h-3.5 w-3.5 inline mr-1 text-slate-400" />
                      {w.date}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{w.title || "Treino"}</h4>
                      <p className="text-xs text-slate-400">
                        {w.exercises.length} {w.exercises.length === 1 ? "exercício" : "exercícios"} •{" "}
                        {w.total_sets} séries •{" "}
                        <span className="font-mono text-emerald-400 font-medium">
                          {w.total_volume.toLocaleString("pt-BR")} kg
                        </span>{" "}
                        volume
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(w.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition"
                      title="Excluir treino"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="text-slate-500">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 border-t border-white/5 bg-slate-950/70 space-y-3">
                    {/* Raw Text Box */}
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-white/5 text-xs text-slate-300 flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                          Texto Original Digitado:
                        </span>
                        <p className="italic text-slate-300 font-mono text-[11px]">&quot;{w.raw_input_text}&quot;</p>
                      </div>
                      <button
                        onClick={() => handleCopyText(w.raw_input_text, w.id)}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        title="Copiar texto"
                      >
                        {copiedId === w.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Exercises breakdown */}
                    <div className="space-y-2 pt-1">
                      {w.exercises.map((ex, eIdx) => (
                        <div key={eIdx} className="p-3 rounded-lg bg-slate-900/50 border border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="font-bold text-xs text-white">{ex.name}</span>
                            <span className="badge badge-muscle text-[10px]">{ex.target_muscle_group}</span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {ex.sets.map((s, sIdx) => (
                              <div
                                key={sIdx}
                                className="px-2 py-1 rounded bg-slate-950 border border-white/5 text-[11px] font-mono flex items-center gap-1.5"
                              >
                                <span className="text-slate-500">#{s.set_number}</span>
                                <span className="font-bold text-white">{s.weight_kg}kg × {s.reps}</span>
                                {s.rpe && <span className="text-purple-400">@{s.rpe}</span>}
                                <span className="text-emerald-400 font-medium">({s.estimated_1rm}kg 1RM)</span>
                                {s.set_type === "TOP_SET" && (
                                  <span className="badge badge-top-set text-[9px] py-0 px-1">TOP</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
