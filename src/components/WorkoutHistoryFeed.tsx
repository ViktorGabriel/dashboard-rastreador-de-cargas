"use client";

import React, { useEffect, useState } from "react";
import { History, ChevronDown, ChevronUp, Trash2, Calendar, Dumbbell, Copy, Check, AlertTriangle } from "lucide-react";

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const executeDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/workouts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setWorkouts((prev) => prev.filter((w) => w.id !== id));
        setConfirmDeleteId(null);
        onWorkoutDeleted();
      }
    } catch (err) {
      console.error("Erro ao deletar treino:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyText = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bezel-shell">
      <div className="bezel-core p-5 sm:p-6 space-y-4">
        {/* Feed Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/10 text-sky-400 border border-sky-500/20 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Histórico de Sessões
              </h3>
              <p className="text-xs text-slate-400">
                Linha do tempo com detalhamento série a série
              </p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-slate-300 font-mono font-medium">
            {workouts.length} {workouts.length === 1 ? "sessão" : "sessões"}
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 skeleton-shimmer rounded-2xl border border-white/5">
            Carregando histórico de treinos...
          </div>
        ) : workouts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-white/10 rounded-2xl bg-slate-950/30">
            Nenhuma sessão salva ainda. Use a caixa de texto acima para registrar o primeiro treino!
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.map((w) => {
              const isExpanded = expandedId === w.id;
              const isPendingDelete = confirmDeleteId === w.id;

              return (
                <div
                  key={w.id}
                  className="rounded-2xl bg-slate-950/60 border border-white/5 hover:border-white/15 transition-all duration-300 overflow-hidden shadow-sm"
                >
                  {/* Accordion Trigger Bar */}
                  <div
                    onClick={() => {
                      if (!isPendingDelete) {
                        setExpandedId(isExpanded ? null : w.id);
                      }
                    }}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02] transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-900 border border-white/10 text-emerald-400 font-mono text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-inner">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {w.date}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{w.title || "Treino"}</h4>
                        <p className="text-xs text-slate-400">
                          {w.exercises.length} {w.exercises.length === 1 ? "exercício" : "exercícios"} •{" "}
                          {w.total_sets} séries •{" "}
                          <span className="font-mono text-emerald-400 font-semibold">
                            {w.total_volume.toLocaleString("pt-BR")} kg
                          </span>{" "}
                          volume
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPendingDelete ? (
                        /* Inline Delete Confirmation */
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 bg-rose-950/80 border border-rose-500/40 p-1.5 rounded-xl animate-modal-in"
                        >
                          <span className="text-[11px] text-rose-300 font-medium flex items-center gap-1 pl-1">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" /> Confirmar exclusão?
                          </span>
                          <button
                            type="button"
                            onClick={() => executeDelete(w.id)}
                            disabled={isDeleting}
                            className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition shadow"
                          >
                            {isDeleting ? "Excluindo..." : "Sim"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(w.id);
                          }}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Excluir treino"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}

                      <div className="text-slate-500 p-1">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 border-t border-white/5 bg-slate-950/80 space-y-3 animate-modal-in">
                      {/* Original Input Text */}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 text-xs text-slate-300 flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                            Prompt Digitado Originalmente:
                          </span>
                          <p className="italic text-slate-300 font-mono text-[11px] leading-relaxed">
                            &quot;{w.raw_input_text}&quot;
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText(w.raw_input_text, w.id)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0"
                          title="Copiar texto"
                        >
                          {copiedId === w.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Exercises and Sets */}
                      <div className="space-y-2.5 pt-1">
                        {w.exercises.map((ex, eIdx) => (
                          <div key={eIdx} className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                            <div className="flex items-center gap-2">
                              <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="font-bold text-xs text-white">{ex.name}</span>
                              <span className="badge badge-muscle text-[10px]">{ex.target_muscle_group}</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {ex.sets.map((s, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/5 text-[11px] font-mono flex items-center gap-2"
                                >
                                  <span className="text-slate-500">#{s.set_number}</span>
                                  <span className="font-bold text-white">{s.weight_kg}kg × {s.reps}</span>
                                  {s.rpe && <span className="text-purple-400 font-semibold">@{s.rpe}</span>}
                                  <span className="text-emerald-400 font-medium">({s.estimated_1rm}kg 1RM)</span>
                                  {s.set_type === "TOP_SET" && (
                                    <span className="badge badge-top-set text-[9px] py-0 px-1">TOP</span>
                                  )}
                                  {s.set_type === "BACKOFF" && (
                                    <span className="badge badge-backoff text-[9px] py-0 px-1">BACK-OFF</span>
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
    </div>
  );
}
