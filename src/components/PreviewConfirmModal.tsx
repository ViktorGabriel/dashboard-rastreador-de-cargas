"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Check, X, Calendar, Edit3, Trash2, Plus, AlertCircle, Dumbbell, Zap } from "lucide-react";
import { ParsedWorkoutResult, ParsedExercise, calculate1RM, calculateVolumeLoad } from "@/lib/formulas";
import { enqueueOfflineWorkout } from "@/lib/offline-sync";

interface PreviewConfirmModalProps {
  data: ParsedWorkoutResult;
  originalText: string;
  onClose: () => void;
  onSaved: () => void;
}

export function PreviewConfirmModal({
  data,
  originalText,
  onClose,
  onSaved,
}: PreviewConfirmModalProps) {
  const [title, setTitle] = useState(data.title || "Sessão de Treino");
  const [date, setDate] = useState(data.date || new Date().toISOString().split("T")[0]);
  const [notes] = useState(data.notes || "");
  const [exercises, setExercises] = useState<ParsedExercise[]>(data.exercises || []);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fechar com tecla Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Manipular alteração de carga ou reps de uma série
  const handleUpdateSet = (
    exIdx: number,
    setIdx: number,
    field: "weight_kg" | "reps" | "set_type" | "rpe",
    value: string | number | null
  ) => {
    const updated = [...exercises];
    const targetSet = { ...updated[exIdx].sets[setIdx] };

    if (field === "weight_kg") {
      targetSet.weight_kg = Math.max(0, Number(value) || 0);
    } else if (field === "reps") {
      targetSet.reps = Math.max(0, Number(value) || 0);
    } else if (field === "rpe") {
      targetSet.rpe = value !== null && value !== "" ? Number(value) : null;
    } else if (field === "set_type") {
      targetSet.set_type = value as "WARMUP" | "TOP_SET" | "WORKING" | "BACKOFF";
    }

    targetSet.estimated_1rm = calculate1RM(targetSet.weight_kg, targetSet.reps);
    targetSet.volume_load = calculateVolumeLoad(targetSet.weight_kg, targetSet.reps);

    updated[exIdx].sets[setIdx] = targetSet;
    setExercises(updated);
  };

  // Ajuste rápido com stepper
  const handleStepDelta = (
    exIdx: number,
    setIdx: number,
    field: "weight_kg" | "reps",
    delta: number
  ) => {
    const currentVal = exercises[exIdx].sets[setIdx][field];
    const newVal = Math.max(0, currentVal + delta);
    handleUpdateSet(exIdx, setIdx, field, newVal);
  };

  // Remover uma série
  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    const updated = [...exercises];
    updated[exIdx].sets = updated[exIdx].sets.filter((_, idx) => idx !== setIdx);
    if (updated[exIdx].sets.length === 0) {
      setExercises(updated.filter((_, idx) => idx !== exIdx));
    } else {
      setExercises(updated);
    }
  };

  // Adicionar uma nova série ao exercício
  const handleAddSet = (exIdx: number) => {
    const updated = [...exercises];
    const lastSet = updated[exIdx].sets[updated[exIdx].sets.length - 1];
    const weight = lastSet ? lastSet.weight_kg : 60;
    const reps = lastSet ? lastSet.reps : 8;

    updated[exIdx].sets.push({
      set_number: updated[exIdx].sets.length + 1,
      set_type: "WORKING",
      weight_kg: weight,
      reps: reps,
      rpe: null,
      rir: null,
      rest_seconds: null,
      notes: null,
      estimated_1rm: calculate1RM(weight, reps),
      volume_load: calculateVolumeLoad(weight, reps),
    });

    setExercises(updated);
  };

  // Salvar no SQLite com suporte a modo offline resiliente
  const handleSave = async () => {
    if (exercises.length === 0) {
      setErrorMsg("Adicione ao menos um exercício com séries para salvar.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    // Se estiver explicitamente offline, enfileira diretamente
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineWorkout({
        type: "STRUCTURED_WORKOUT",
        title,
        workoutData: {
          date,
          title,
          notes,
          raw_input_text: originalText,
          exercises,
        },
      });

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([15, 30, 15]);
      }

      setIsSaving(false);
      onSaved();
      return;
    }

    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          title,
          notes,
          raw_input_text: originalText,
          exercises,
        }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resData.error || `Erro HTTP ${res.status}`);
      }

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(15);
      }

      onSaved();
    } catch (err: unknown) {
      const error = err as Error;
      // Se for falha de conexão de rede, enfileira para não perder o treino do atleta
      if (
        typeof navigator !== "undefined" &&
        (!navigator.onLine ||
          error.message?.toLowerCase().includes("failed to fetch") ||
          error.message?.toLowerCase().includes("network"))
      ) {
        enqueueOfflineWorkout({
          type: "STRUCTURED_WORKOUT",
          title,
          workoutData: {
            date,
            title,
            notes,
            raw_input_text: originalText,
            exercises,
          },
        });

        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([15, 30, 15]);
        }

        onSaved();
      } else {
        setErrorMsg(error.message || "Erro ao persistir treino.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getSetTypeBadgeClass = (type: string) => {
    switch (type) {
      case "TOP_SET":
        return "badge-top-set";
      case "BACKOFF":
        return "badge-backoff";
      case "WARMUP":
        return "badge-warmup";
      default:
        return "badge-working";
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bezel-shell w-full max-w-3xl max-h-[92vh] flex flex-col animate-modal-in shadow-2xl"
      >
        <div className="bezel-core flex flex-col flex-1 overflow-hidden">
          {/* Header Modal */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500/30 to-teal-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  Conferência do Treino
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                    Preview & Confirm
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Revise e ajuste as cargas extraídas pela IA antes de salvar no banco
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Fechar (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Workout Metadata Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-white/5">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1.5">
                  <Edit3 className="h-3 w-3 text-slate-500" /> Título da Sessão
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-slate-500" /> Data do Treino
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none transition"
                />
              </div>
            </div>

            {/* Exercises List */}
            <div className="space-y-4">
              {exercises.map((ex, exIdx) => (
                <div
                  key={exIdx}
                  className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white/5 text-emerald-400">
                        <Dumbbell className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-sm text-white">{ex.name}</span>
                      <span className="badge badge-muscle">{ex.target_muscle_group}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/5">
                        {ex.category === "COMPOUND" ? "Composto" : "Isolador"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSet(exIdx)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1.5 transition"
                    >
                      <Plus className="h-3 w-3" /> Adicionar Série
                    </button>
                  </div>

                  {/* Sets Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-500 border-b border-white/5 pb-1 font-semibold text-[10px] uppercase">
                          <th className="py-1 px-1.5">#</th>
                          <th className="py-1 px-1.5">Tipo</th>
                          <th className="py-1 px-1.5">Carga (kg)</th>
                          <th className="py-1 px-1.5">Reps</th>
                          <th className="py-1 px-1.5">RPE</th>
                          <th className="py-1 px-1.5">1RM Estimado</th>
                          <th className="py-1 px-1.5">Volume</th>
                          <th className="py-1 px-1.5 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {ex.sets.map((set, setIdx) => (
                          <tr key={setIdx} className="hover:bg-white/[0.02] transition">
                            <td className="py-2 px-1.5 font-mono text-slate-400">
                              {set.set_number}
                            </td>
                            <td className="py-2 px-1.5">
                              <select
                                value={set.set_type}
                                onChange={(e) =>
                                  handleUpdateSet(exIdx, setIdx, "set_type", e.target.value)
                                }
                                className={`text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-900 border border-white/10 outline-none cursor-pointer ${getSetTypeBadgeClass(
                                  set.set_type
                                )}`}
                              >
                                <option value="TOP_SET">TOP SET</option>
                                <option value="BACKOFF">BACK-OFF</option>
                                <option value="WORKING">WORKING</option>
                                <option value="WARMUP">WARMUP</option>
                              </select>
                            </td>
                            <td className="py-2 px-1.5">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStepDelta(exIdx, setIdx, "weight_kg", -2.5)}
                                  className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-[10px] font-bold"
                                  title="-2.5 kg"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={set.weight_kg}
                                  onChange={(e) =>
                                    handleUpdateSet(exIdx, setIdx, "weight_kg", e.target.value)
                                  }
                                  className="w-14 bg-slate-900 border border-white/10 rounded-lg px-1.5 py-0.5 text-xs text-white font-mono text-center focus:border-emerald-500 outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleStepDelta(exIdx, setIdx, "weight_kg", 2.5)}
                                  className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-[10px] font-bold"
                                  title="+2.5 kg"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="py-2 px-1.5">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStepDelta(exIdx, setIdx, "reps", -1)}
                                  className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-[10px] font-bold"
                                  title="-1 rep"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={set.reps}
                                  onChange={(e) =>
                                    handleUpdateSet(exIdx, setIdx, "reps", e.target.value)
                                  }
                                  className="w-12 bg-slate-900 border border-white/10 rounded-lg px-1.5 py-0.5 text-xs text-white font-mono text-center focus:border-emerald-500 outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleStepDelta(exIdx, setIdx, "reps", 1)}
                                  className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-[10px] font-bold"
                                  title="+1 rep"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="py-2 px-1.5">
                              <input
                                type="number"
                                step="0.5"
                                placeholder="-"
                                value={set.rpe ?? ""}
                                onChange={(e) =>
                                  handleUpdateSet(exIdx, setIdx, "rpe", e.target.value)
                                }
                                className="w-12 bg-slate-900 border border-white/10 rounded-lg px-1.5 py-0.5 text-xs text-amber-300 font-mono text-center focus:border-emerald-500 outline-none"
                              />
                            </td>
                            <td className="py-2 px-1.5 font-mono text-emerald-400 font-semibold">
                              {set.estimated_1rm} kg
                            </td>
                            <td className="py-2 px-1.5 font-mono text-slate-400">
                              {set.volume_load} kg
                            </td>
                            <td className="py-2 px-1.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveSet(exIdx, setIdx)}
                                className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-white/5 transition"
                                title="Excluir série"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/70 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs border border-white/5 transition"
            >
              Cancelar (Esc)
            </button>

            {/* Button-in-Button Primary Save */}
            <button
              type="button"
              id="confirm-save-workout-btn"
              onClick={handleSave}
              disabled={isSaving}
              className="group relative inline-flex items-center gap-3 pl-5 pr-2 py-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98]"
            >
              <span>{isSaving ? "Salvando no SQLite..." : "Confirmar & Gravar Treino"}</span>
              <span className="w-8 h-8 rounded-full bg-black/15 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:translate-x-0.5">
                <Check className="h-4 w-4 stroke-[3] text-slate-950" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
