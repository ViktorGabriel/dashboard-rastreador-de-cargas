"use client";

import React, { useState, useEffect } from "react";
import {
  Dumbbell,
  Calendar,
  Plus,
  Play,
  Trash2,
  ChevronDown,
  Check,
  X,
} from "lucide-react";

interface ExerciseOption {
  id: number;
  name: string;
  targetMuscleGroup: string;
  category: string;
}

interface RoutineExerciseItem {
  id: number;
  routineId: number;
  exerciseId: number;
  exerciseName: string;
  exerciseCanonical: string;
  targetMuscleGroup: string;
  category: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRpe?: number | null;
  notes?: string | null;
  orderIndex: number;
}

interface RoutineItem {
  id: number;
  splitType: string;
  name: string;
  letter: string;
  dayLabel: string | null;
  orderIndex: number;
  isActive: boolean;
  exercises: RoutineExerciseItem[];
}

interface SplitPreset {
  type: string;
  label: string;
  description: string;
  daysCount: number;
}

interface RoutineSplitManagerProps {
  onStartWorkout: (promptText: string) => void;
}

export function RoutineSplitManager({ onStartWorkout }: RoutineSplitManagerProps) {
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [presets, setPresets] = useState<SplitPreset[]>([]);
  const [currentSplit, setCurrentSplit] = useState<string>("UPPER_LOWER");
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPreset, setIsChangingPreset] = useState(false);

  // Modal para adicionar exercício
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<ExerciseOption[]>([]);
  const [selectedExId, setSelectedExId] = useState<number | null>(null);
  const [newSets, setNewSets] = useState(3);
  const [newRepsMin, setNewRepsMin] = useState(8);
  const [newRepsMax, setNewRepsMax] = useState(10);
  const [newRpe, setNewRpe] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Carregar rotinas ativas
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/routines");
        const data = await res.json();
        if (active && data.routines) {
          setRoutines(data.routines);
          setPresets(data.presets || []);
          setCurrentSplit(data.currentSplit || "UPPER_LOWER");
          if (data.routines.length > 0) {
            setActiveTabId((prev) => (prev ? prev : data.routines[0].id));
          }
        }
      } catch (err) {
        console.error("Erro ao buscar rotinas:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Carregar lista de exercícios do sistema para o modal
  useEffect(() => {
    async function loadAllExercises() {
      try {
        const res = await fetch("/api/exercises");
        const list = await res.json();
        if (Array.isArray(list)) {
          setAvailableExercises(list);
          if (list.length > 0 && !selectedExId) {
            setSelectedExId(list[0].id);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar exercícios:", err);
      }
    }
    if (isAddModalOpen) {
      loadAllExercises();
    }
  }, [isAddModalOpen, selectedExId]);

  // Trocar de Preset (Upper/Lower, PPL, etc.)
  const handleSelectPreset = async (splitType: string) => {
    if (splitType === currentSplit) return;
    if (
      !confirm(
        `Deseja carregar a divisão ${splitType}? As fichas atuais serão substituídas pelo preset selecionado.`
      )
    )
      return;

    setIsChangingPreset(true);
    try {
      const res = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply_preset", splitType }),
      });
      const data = await res.json();
      if (data.routines) {
        setRoutines(data.routines);
        setCurrentSplit(splitType);
        if (data.routines.length > 0) {
          setActiveTabId(data.routines[0].id);
        }
      }
    } catch (err) {
      console.error("Erro ao aplicar preset:", err);
    } finally {
      setIsChangingPreset(false);
    }
  };

  // Ajustar número de séries ou reps diretamente
  const handleUpdateExerciseParam = async (
    routineExerciseId: number,
    field: "targetSets" | "targetRepsMin" | "targetRepsMax",
    delta: number
  ) => {
    const activeRoutine = routines.find((r) => r.id === activeTabId);
    if (!activeRoutine) return;
    const targetEx = activeRoutine.exercises.find((e) => e.id === routineExerciseId);
    if (!targetEx) return;

    const newVal = Math.max(1, (targetEx[field] as number) + delta);

    try {
      await fetch("/api/routines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_exercise",
          id: routineExerciseId,
          [field]: newVal,
        }),
      });

      setRoutines((prev) =>
        prev.map((r) =>
          r.id === activeRoutine.id
            ? {
                ...r,
                exercises: r.exercises.map((e) =>
                  e.id === routineExerciseId ? { ...e, [field]: newVal } : e
                ),
              }
            : r
        )
      );
    } catch (err) {
      console.error("Erro ao atualizar exercício:", err);
    }
  };

  // Remover exercício da rotina
  const handleRemoveExercise = async (routineExerciseId: number) => {
    try {
      const res = await fetch(`/api/routines?routineExerciseId=${routineExerciseId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRoutines((prev) =>
          prev.map((r) => ({
            ...r,
            exercises: r.exercises.filter((e) => e.id !== routineExerciseId),
          }))
        );
      }
    } catch (err) {
      console.error("Erro ao remover exercício:", err);
    }
  };

  // Adicionar exercício selecionado à rotina ativa
  const handleAddExerciseSubmit = async () => {
    if (!activeTabId || !selectedExId) return;

    try {
      const res = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_exercise",
          routineId: activeTabId,
          exerciseId: selectedExId,
          targetSets: newSets,
          targetRepsMin: newRepsMin,
          targetRepsMax: newRepsMax,
          targetRpe: newRpe ? Number(newRpe) : null,
        }),
      });

      const data = await res.json();
      if (data.routines) {
        setRoutines(data.routines);
        setIsAddModalOpen(false);
      }
    } catch (err) {
      console.error("Erro ao adicionar exercício:", err);
    }
  };

  // Ação 1-Click: "Treinar Esta Ficha Hoje"
  const handleStartWorkoutToday = (routine: RoutineItem) => {
    if (!routine || routine.exercises.length === 0) return;

    // Gera um texto de treino estruturado pronto para o Logger
    const parts = routine.exercises.map((ex) => {
      const rpeStr = ex.targetRpe ? ` @${ex.targetRpe}` : "";
      return `${ex.exerciseName} ${ex.targetSets}x${ex.targetRepsMin}-${ex.targetRepsMax}${rpeStr}`;
    });

    const promptText = `Treino do dia (${routine.name}): ${parts.join(", ")}`;
    onStartWorkout(promptText);

    // Scroll suave até o logger
    const loggerEl = document.getElementById("workout-text-input");
    if (loggerEl) {
      loggerEl.scrollIntoView({ behavior: "smooth", block: "center" });
      loggerEl.focus();
    }
  };

  const activeRoutine = routines.find((r) => r.id === activeTabId) || routines[0];

  const filteredAvailableExercises = availableExercises.filter(
    (ex) =>
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.targetMuscleGroup.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bezel-shell">
      <div className="bezel-core p-5 sm:p-6 space-y-5">
        {/* Header & Preset Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Minha Ficha de Treino Atual
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                  Presets & Metas
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Alterne entre divisões clássicas (PPL, Upper/Lower, Bro Split) e defina suas metas de repetições
              </p>
            </div>
          </div>

          {/* Preset Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden md:inline">Divisão:</span>
            <div className="relative">
              <select
                id="split-preset-selector"
                value={currentSplit}
                disabled={isChangingPreset}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="appearance-none bg-slate-900 border border-white/15 hover:border-white/25 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-white focus:border-amber-500 outline-none transition cursor-pointer shadow-sm"
              >
                {presets.map((p) => (
                  <option key={p.type} value={p.type} className="bg-slate-900 text-white font-medium">
                    {p.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 skeleton-shimmer rounded-2xl border border-white/5 text-center text-xs text-slate-400">
            Carregando rotina de treinos...
          </div>
        ) : routines.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-white/10 rounded-2xl">
            Nenhuma rotina cadastrada. Selecione um preset acima para começar!
          </div>
        ) : (
          <div className="space-y-4">
            {/* Routine Tabs (Treino A, B, C, D...) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {routines.map((r) => {
                const isSelected = r.id === (activeTabId || routines[0]?.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveTabId(r.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 shrink-0 border ${
                      isSelected
                        ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40 shadow-sm"
                        : "bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border-white/5"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-lg bg-black/25 flex items-center justify-center font-mono font-extrabold text-[11px]">
                      {r.letter}
                    </span>
                    <span>{r.name}</span>
                    {r.dayLabel && (
                      <span className="text-[10px] text-slate-500 font-normal hidden sm:inline">
                        • {r.dayLabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Routine Details Card */}
            {activeRoutine && (
              <div className="rounded-2xl bg-slate-950/60 border border-white/5 p-4 sm:p-5 space-y-4">
                {/* Routine Banner & 1-Click Launch Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black font-mono text-base">
                      {activeRoutine.letter}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {activeRoutine.name}
                        {activeRoutine.dayLabel && (
                          <span className="text-[11px] text-slate-400 font-normal">
                            ({activeRoutine.dayLabel})
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {activeRoutine.exercises.length} exercícios programados • Metas de séries e repetições
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Botão de Adicionar Exercício */}
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-white/5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Adicionar</span>
                    </button>

                    {/* Botão Iniciar Treino Hoje (1-Click) */}
                    <button
                      type="button"
                      onClick={() => handleStartWorkoutToday(activeRoutine)}
                      className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all duration-300 active:scale-95"
                    >
                      <Play className="h-3.5 w-3.5 fill-slate-950" />
                      <span>Iniciar Treino Hoje</span>
                    </button>
                  </div>
                </div>

                {/* Exercises List in the Current Routine */}
                <div className="divide-y divide-white/5">
                  {activeRoutine.exercises.map((ex, idx) => (
                    <div
                      key={ex.id}
                      className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] rounded-xl transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-mono text-xs w-5 text-center">
                          {idx + 1}
                        </span>
                        <div className="p-1.5 rounded-lg bg-white/5 text-emerald-400">
                          <Dumbbell className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{ex.exerciseName}</h4>
                            <span className="badge badge-muscle text-[9px]">
                              {ex.targetMuscleGroup}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                              {ex.category === "COMPOUND" ? "Composto" : "Isolador"}
                            </span>
                          </div>
                          {ex.notes && (
                            <p className="text-[11px] text-slate-400 italic mt-0.5">{ex.notes}</p>
                          )}
                        </div>
                      </div>

                      {/* Controls: Sets & Rep Range */}
                      <div className="flex items-center gap-4 self-end sm:self-auto">
                        {/* Sets Stepper */}
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">
                            Séries:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateExerciseParam(ex.id, "targetSets", -1)}
                            className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-[11px]"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-white w-6 text-center">
                            {ex.targetSets}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateExerciseParam(ex.id, "targetSets", 1)}
                            className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-[11px]"
                          >
                            +
                          </button>
                        </div>

                        {/* Reps Range */}
                        <div className="flex items-center gap-1 text-xs bg-slate-900/90 px-2 py-1 rounded-lg border border-white/5 font-mono">
                          <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 font-sans">
                            Reps:
                          </span>
                          <span className="font-bold text-amber-300">
                            {ex.targetRepsMin}-{ex.targetRepsMax}
                          </span>
                          {ex.targetRpe && (
                            <span className="text-purple-400 text-[11px]">@{ex.targetRpe}</span>
                          )}
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveExercise(ex.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Remover exercício da ficha"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Adicionar Exercício à Rotina */}
        {isAddModalOpen && (
          <div
            onClick={() => setIsAddModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bezel-shell w-full max-w-lg animate-modal-in shadow-2xl"
            >
              <div className="bezel-core p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Adicionar Exercício à Ficha</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Search & Selector */}
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Buscar exercício (ex: Supino, Agachamento, Tríceps...)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {filteredAvailableExercises.map((ex) => (
                      <div
                        key={ex.id}
                        onClick={() => setSelectedExId(ex.id)}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition ${
                          selectedExId === ex.id
                            ? "bg-amber-500/15 border-amber-500/40 text-white"
                            : "bg-slate-900/60 border-white/5 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{ex.name}</span>
                          <span className="badge badge-muscle text-[9px]">
                            {ex.targetMuscleGroup}
                          </span>
                        </div>
                        {selectedExId === ex.id && <Check className="h-4 w-4 text-amber-400" />}
                      </div>
                    ))}
                  </div>

                  {/* Target Sets & Reps Inputs */}
                  <div className="grid grid-cols-4 gap-2.5 pt-2 border-t border-white/5">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Séries
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={newSets}
                        onChange={(e) => setNewSets(Number(e.target.value) || 1)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Reps Min
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={newRepsMin}
                        onChange={(e) => setNewRepsMin(Number(e.target.value) || 1)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Reps Max
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={newRepsMax}
                        onChange={(e) => setNewRepsMax(Number(e.target.value) || 1)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        RPE Alvo
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="5"
                        max="10"
                        placeholder="8.5"
                        value={newRpe}
                        onChange={(e) => setNewRpe(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono text-center focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddExerciseSubmit}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold shadow-md"
                  >
                    Confirmar Adição
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
