"use client";

import React, { useState } from "react";
import { Check, X, Calendar, Edit3, Trash2, Plus, AlertCircle, Dumbbell, Zap } from "lucide-react";
import { ParsedWorkoutResult, ParsedExercise, calculate1RM, calculateVolumeLoad } from "@/lib/formulas";

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
  const [notes, setNotes] = useState(data.notes || "");
  const [exercises, setExercises] = useState<ParsedExercise[]>(data.exercises || []);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manipular alteração de carga ou reps de uma série
  const handleUpdateSet = (
    exIdx: number,
    setIdx: number,
    field: "weight_kg" | "reps" | "set_type" | "rpe",
    value: any
  ) => {
    const updated = [...exercises];
    const targetSet = { ...updated[exIdx].sets[setIdx] };

    if (field === "weight_kg") {
      targetSet.weight_kg = Number(value) || 0;
    } else if (field === "reps") {
      targetSet.reps = Number(value) || 0;
    } else if (field === "rpe") {
      targetSet.rpe = value ? Number(value) : null;
    } else if (field === "set_type") {
      targetSet.set_type = value;
    }

    targetSet.estimated_1rm = calculate1RM(targetSet.weight_kg, targetSet.reps);
    targetSet.volume_load = calculateVolumeLoad(targetSet.weight_kg, targetSet.reps);

    updated[exIdx].sets[setIdx] = targetSet;
    setExercises(updated);
  };

  // Remover uma série
  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    const updated = [...exercises];
    updated[exIdx].sets = updated[exIdx].sets.filter((_, idx) => idx !== setIdx);
    if (updated[exIdx].sets.length === 0) {
      // Remove o exercício se não tiver mais séries
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

  // Salvar no SQLite
  const handleSave = async () => {
    if (exercises.length === 0) {
      setErrorMsg("Adicione ao menos um exercício com séries para salvar.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

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

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Falha ao salvar no banco.");
      }

      onSaved();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao persistir treino.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-card w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border-emerald-500/30 shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Conferência do Treino (Preview & Confirm)
              </h3>
              <p className="text-xs text-slate-400">
                Revise os dados estruturados pelo Gemini antes de salvar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Workout Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-white/5">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Edit3 className="h-3 w-3 text-slate-500" /> Título da Sessão
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-500" /> Data do Treino
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Exercises List */}
          <div className="space-y-4">
            {exercises.map((ex, exIdx) => (
              <div
                key={exIdx}
                className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-emerald-400" />
                    <span className="font-bold text-sm text-white">{ex.name}</span>
                    <span className="badge badge-muscle">{ex.target_muscle_group}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/5">
                      {ex.category === "COMPOUND" ? "Básico / Composto" : "Isolador"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddSet(exIdx)}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition"
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
                        <tr key={setIdx} className="hover:bg-white/[0.02]">
                          <td className="py-1.5 px-1.5 font-mono text-slate-400">
                            {set.set_number}
                          </td>
                          <td className="py-1.5 px-1.5">
                            <select
                              value={set.set_type}
                              onChange={(e) =>
                                handleUpdateSet(exIdx, setIdx, "set_type", e.target.value)
                              }
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 outline-none ${getSetTypeBadgeClass(
                                set.set_type
                              )}`}
                            >
                              <option value="TOP_SET">TOP SET</option>
                              <option value="BACKOFF">BACK-OFF</option>
                              <option value="WORKING">WORKING</option>
                              <option value="WARMUP">WARMUP</option>
                            </select>
                          </td>
                          <td className="py-1.5 px-1.5">
                            <input
                              type="number"
                              step="0.5"
                              value={set.weight_kg}
                              onChange={(e) =>
                                handleUpdateSet(exIdx, setIdx, "weight_kg", e.target.value)
                              }
                              className="w-16 bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white font-mono focus:border-emerald-500 outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-1.5">
                            <input
                              type="number"
                              value={set.reps}
                              onChange={(e) =>
                                handleUpdateSet(exIdx, setIdx, "reps", e.target.value)
                              }
                              className="w-14 bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white font-mono focus:border-emerald-500 outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-1.5">
                            <input
                              type="number"
                              step="0.5"
                              placeholder="-"
                              value={set.rpe ?? ""}
                              onChange={(e) =>
                                handleUpdateSet(exIdx, setIdx, "rpe", e.target.value)
                              }
                              className="w-12 bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-xs text-amber-300 font-mono focus:border-emerald-500 outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-1.5 font-mono text-emerald-400 font-semibold">
                            {set.estimated_1rm} kg
                          </td>
                          <td className="py-1.5 px-1.5 font-mono text-slate-400">
                            {set.volume_load} kg
                          </td>
                          <td className="py-1.5 px-1.5 text-right">
                            <button
                              onClick={() => handleRemoveSet(exIdx, setIdx)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition"
                              title="Excluir série"
                            >
                              <Trash2 className="h-3 w-3" />
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
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
          >
            Cancelar
          </button>

          <button
            id="confirm-save-workout-btn"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition transform active:scale-95"
          >
            <Check className="h-4 w-4 stroke-[3]" />
            <span>{isSaving ? "Salvando no SQLite..." : "Confirmar & Salvar Treino"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
