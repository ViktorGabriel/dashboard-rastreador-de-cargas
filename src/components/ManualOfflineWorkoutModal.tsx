"use client";

import React, { useState } from "react";
import { Plus, Trash2, X, Check, Dumbbell, Calendar, Edit3, WifiOff } from "lucide-react";
import { ParsedExercise, calculate1RM, calculateVolumeLoad } from "@/lib/formulas";
import { enqueueOfflineWorkout } from "@/lib/offline-sync";

interface ManualOfflineWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const COMMON_EXERCISES = [
  { name: "Supino Reto com Barra", muscle: "Peito", category: "COMPOUND" as const },
  { name: "Agachamento Livre com Barra", muscle: "Quadríceps", category: "COMPOUND" as const },
  { name: "Levantamento Terra", muscle: "Costas", category: "COMPOUND" as const },
  { name: "Desenvolvimento Militar com Barra", muscle: "Ombros", category: "COMPOUND" as const },
  { name: "Remada Curvada com Barra", muscle: "Costas", category: "COMPOUND" as const },
  { name: "RDL / Stiff com Barra", muscle: "Posterior de Coxa", category: "COMPOUND" as const },
  { name: "Puxada Alta na Polia", muscle: "Costas", category: "ISOLATION" as const },
  { name: "Elevação Lateral com Halteres", muscle: "Ombros", category: "ISOLATION" as const },
  { name: "Rosca Direta com Barra W", muscle: "Bíceps", category: "ISOLATION" as const },
  { name: "Tríceps Testa", muscle: "Tríceps", category: "ISOLATION" as const },
];

export function ManualOfflineWorkoutModal({
  isOpen,
  onClose,
  onSaved,
}: ManualOfflineWorkoutModalProps) {
  const [title, setTitle] = useState("Treino na Academia");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [exercises, setExercises] = useState<ParsedExercise[]>([
    {
      name: "Supino Reto com Barra",
      target_muscle_group: "Peito",
      category: "COMPOUND",
      sets: [
        {
          set_number: 1,
          set_type: "TOP_SET",
          weight_kg: 100,
          reps: 5,
          rpe: 8.5,
          rir: null,
          rest_seconds: 180,
          notes: null,
          estimated_1rm: calculate1RM(100, 5),
          volume_load: calculateVolumeLoad(100, 5),
        },
      ],
    },
  ]);

  if (!isOpen) return null;

  const handleAddExercise = (presetName?: string) => {
    const found = COMMON_EXERCISES.find((e) => e.name === presetName);
    const newEx: ParsedExercise = {
      name: found ? found.name : "Novo Exercício",
      target_muscle_group: found ? found.muscle : "Geral",
      category: found ? found.category : "COMPOUND",
      sets: [
        {
          set_number: 1,
          set_type: "WORKING",
          weight_kg: 60,
          reps: 8,
          rpe: null,
          rir: null,
          rest_seconds: 120,
          notes: null,
          estimated_1rm: calculate1RM(60, 8),
          volume_load: calculateVolumeLoad(60, 8),
        },
      ],
    };
    setExercises([...exercises, newEx]);
  };

  const handleRemoveExercise = (idx: number) => {
    setExercises(exercises.filter((_, i) => i !== idx));
  };

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

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    const updated = [...exercises];
    updated[exIdx].sets = updated[exIdx].sets.filter((_, i) => i !== setIdx);
    if (updated[exIdx].sets.length === 0) {
      setExercises(updated.filter((_, i) => i !== exIdx));
    } else {
      setExercises(updated);
    }
  };

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

  const handleSave = () => {
    if (exercises.length === 0) return;

    // Salva na fila offline com status PENDING
    enqueueOfflineWorkout({
      type: "STRUCTURED_WORKOUT",
      title,
      workoutData: {
        date,
        title,
        notes: "Registro manual offline",
        raw_input_text: "Registro manual direto em modo offline",
        exercises,
      },
    });

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([15, 30, 15]);
    }

    onSaved();
    onClose();
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
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <WifiOff className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  Registro Manual Offline
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30">
                    Sem IA / Autônomo
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Cadastre séries e repetições diretamente sem precisar de sinal de internet
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Title & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-white/5">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1.5">
                  <Edit3 className="h-3 w-3 text-slate-500" /> Título
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:border-amber-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-slate-500" /> Data
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:border-amber-500 outline-none transition"
                />
              </div>
            </div>

            {/* Quick Add Exercise selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-slate-400">Adicionar Rápido:</span>
              {COMMON_EXERCISES.slice(0, 5).map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddExercise(ex.name)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition active:scale-95"
                >
                  + {ex.name.split(" ")[0]}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleAddExercise()}
                className="text-[11px] px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold transition active:scale-95"
              >
                + Outro Exercício
              </button>
            </div>

            {/* Exercises list */}
            <div className="space-y-4">
              {exercises.map((ex, exIdx) => (
                <div
                  key={exIdx}
                  className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <div className="p-1.5 rounded-lg bg-white/5 text-amber-400">
                        <Dumbbell className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={ex.name}
                        onChange={(e) => {
                          const updated = [...exercises];
                          updated[exIdx].name = e.target.value;
                          setExercises(updated);
                        }}
                        className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-bold w-full max-w-[280px] focus:border-amber-500 outline-none"
                      />
                      <input
                        type="text"
                        value={ex.target_muscle_group}
                        onChange={(e) => {
                          const updated = [...exercises];
                          updated[exIdx].target_muscle_group = e.target.value;
                          setExercises(updated);
                        }}
                        placeholder="Músculo"
                        className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-300 w-24 focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddSet(exIdx)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold flex items-center gap-1.5 transition"
                      >
                        <Plus className="h-3 w-3" /> Série
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(exIdx)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition"
                        title="Excluir exercício"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Sets table */}
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
                          <th className="py-1 px-1.5 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {ex.sets.map((set, setIdx) => (
                          <tr key={setIdx} className="hover:bg-white/[0.02]">
                            <td className="py-2 px-1.5 font-mono text-slate-400">
                              {set.set_number}
                            </td>
                            <td className="py-2 px-1.5">
                              <select
                                value={set.set_type}
                                onChange={(e) =>
                                  handleUpdateSet(exIdx, setIdx, "set_type", e.target.value)
                                }
                                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-900 border border-white/10 outline-none text-slate-200"
                              >
                                <option value="TOP_SET">TOP SET</option>
                                <option value="BACKOFF">BACK-OFF</option>
                                <option value="WORKING">WORKING</option>
                                <option value="WARMUP">WARMUP</option>
                              </select>
                            </td>
                            <td className="py-2 px-1.5">
                              <input
                                type="number"
                                step="0.5"
                                value={set.weight_kg}
                                onChange={(e) =>
                                  handleUpdateSet(exIdx, setIdx, "weight_kg", e.target.value)
                                }
                                className="w-16 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:border-amber-500 outline-none"
                              />
                            </td>
                            <td className="py-2 px-1.5">
                              <input
                                type="number"
                                value={set.reps}
                                onChange={(e) =>
                                  handleUpdateSet(exIdx, setIdx, "reps", e.target.value)
                                }
                                className="w-14 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:border-amber-500 outline-none"
                              />
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
                                className="w-12 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono text-center focus:border-amber-500 outline-none"
                              />
                            </td>
                            <td className="py-2 px-1.5 font-mono text-emerald-400 font-semibold">
                              {set.estimated_1rm} kg
                            </td>
                            <td className="py-2 px-1.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveSet(exIdx, setIdx)}
                                className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
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
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/70 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs border border-white/5 transition"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 font-bold text-xs shadow-lg transition active:scale-95"
            >
              <Check className="h-4 w-4" />
              <span>Salvar na Fila Offline</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
