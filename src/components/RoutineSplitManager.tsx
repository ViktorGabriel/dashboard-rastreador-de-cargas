"use client";

import React, { useState, useEffect } from "react";
import {
  Dumbbell,
  Calendar,
  Plus,
  Play,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Check,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
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

const DEFAULT_PRESETS: SplitPreset[] = [
  {
    type: "UPPER_LOWER",
    label: "Upper / Lower",
    description: "Superior e Inferior 2x na semana (4 dias)",
    daysCount: 4,
  },
  {
    type: "PPL",
    label: "PPL (Push / Pull / Legs)",
    description: "Empurrar, Puxar e Pernas (3 a 6 dias)",
    daysCount: 3,
  },
  {
    type: "PPL_UPPER_LOWER",
    label: "PPL + Upper/Lower",
    description: "Híbrido de alta frequência (5 dias)",
    daysCount: 5,
  },
  {
    type: "BRO_SPLIT",
    label: "Bro Split",
    description: "1 grupo muscular principal por dia (5 dias)",
    daysCount: 5,
  },
];

interface RoutineSplitManagerProps {
  onStartWorkout: (promptText: string) => void;
}

export function RoutineSplitManager({ onStartWorkout }: RoutineSplitManagerProps) {
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [presets, setPresets] = useState<SplitPreset[]>(DEFAULT_PRESETS);
  const [currentSplit, setCurrentSplit] = useState<string>("UPPER_LOWER");
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPreset, setIsChangingPreset] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

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
          if (Array.isArray(data.presets) && data.presets.length > 0) {
            setPresets(data.presets);
          }
          if (data.currentSplit) {
            setCurrentSplit(data.currentSplit);
          }
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

  // Trocar de Preset (Upper/Lower, PPL, etc.) sem bloqueio
  const handleSelectPreset = async (splitType: string) => {
    if (splitType === currentSplit && routines.length > 0) return;

    setIsChangingPreset(true);
    try {
      const res = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply_preset", splitType }),
      });
      const data = await res.json();
      if (data.routines && data.routines.length > 0) {
        setRoutines(data.routines);
        setCurrentSplit(splitType);
        setActiveTabId(data.routines[0].id);

        const matched = (presets.length > 0 ? presets : DEFAULT_PRESETS).find(
          (p) => p.type === splitType
        );
        setSuccessToast(`Divisão ${matched?.label || splitType} aplicada com sucesso!`);
        setTimeout(() => setSuccessToast(null), 3500);
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

  // Reordenar exercício (Subir / Descer para Mobile e PC)
  const handleMoveExercise = async (
    routineId: number,
    currentIndex: number,
    direction: "up" | "down"
  ) => {
    const targetRoutine = routines.find((r) => r.id === routineId);
    if (!targetRoutine) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= targetRoutine.exercises.length) return;

    // Reordenação otimista imediata
    const updatedExercises = [...targetRoutine.exercises];
    const [movedItem] = updatedExercises.splice(currentIndex, 1);
    updatedExercises.splice(targetIndex, 0, movedItem);

    const newExerciseIds = updatedExercises.map((ex) => ex.id);
    setRoutines((prev) =>
      prev.map((r) => (r.id === routineId ? { ...r, exercises: updatedExercises } : r))
    );

    try {
      await fetch("/api/routines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder_exercises",
          routineId,
          exerciseIds: newExerciseIds,
        }),
      });
    } catch (err) {
      console.error("Erro ao persistir nova ordem dos exercícios:", err);
    }
  };

  // Drag and Drop (Mouse / Desktop)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const activeRoutine = routines.find((r) => r.id === activeTabId);
    if (draggedIndex === null || draggedIndex === targetIndex || !activeRoutine) {
      setDraggedIndex(null);
      return;
    }

    const updatedExercises = [...activeRoutine.exercises];
    const [movedItem] = updatedExercises.splice(draggedIndex, 1);
    updatedExercises.splice(targetIndex, 0, movedItem);

    const newExerciseIds = updatedExercises.map((ex) => ex.id);
    setRoutines((prev) =>
      prev.map((r) => (r.id === activeRoutine.id ? { ...r, exercises: updatedExercises } : r))
    );
    setDraggedIndex(null);

    try {
      await fetch("/api/routines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder_exercises",
          routineId: activeRoutine.id,
          exerciseIds: newExerciseIds,
        }),
      });
    } catch (err) {
      console.error("Erro ao persistir ordem via arrasto:", err);
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
        {/* Header */}
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
                Alterne com 1 clique entre divisões clássicas ou personalize suas fichas e metas de repetições
              </p>
            </div>
          </div>

          {/* Quick Select Dropdown (Fallback/Compact) */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden lg:inline">Divisão rápida:</span>
            <div className="relative">
              <select
                id="split-preset-selector"
                value={currentSplit}
                disabled={isChangingPreset}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="appearance-none bg-slate-900 border border-white/15 hover:border-white/25 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-white focus:border-amber-500 outline-none transition cursor-pointer shadow-sm disabled:opacity-50"
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

        {/* Feedback Toast */}
        {successToast && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Preset Cards Selector Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Escolha sua Divisão Clássica:
            </span>
            {isChangingPreset && (
              <span className="text-xs text-amber-400 flex items-center gap-1.5 animate-pulse font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando divisão...
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {presets.map((p) => {
              const isActive = currentSplit === p.type;
              return (
                <button
                  key={p.type}
                  type="button"
                  id={`preset-btn-${p.type}`}
                  disabled={isChangingPreset}
                  onClick={() => handleSelectPreset(p.type)}
                  className={`group relative text-left p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)] text-white"
                      : "bg-slate-900/60 hover:bg-slate-800/80 border-white/10 hover:border-amber-500/30 text-slate-300 hover:text-white"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className={`text-xs font-bold leading-tight ${isActive ? "text-amber-300" : "text-white"}`}>
                        {p.label}
                      </span>
                      {isActive ? (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0 mt-0.5" />
                      ) : null}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-white/5">
                    <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 font-mono">
                      {p.daysCount} dias/sem
                    </span>
                    {isActive ? (
                      <span className="font-extrabold text-amber-400 text-[10px] tracking-wider flex items-center gap-1">
                        <Check className="h-3 w-3" /> ATIVA
                      </span>
                    ) : (
                      <span className="text-slate-500 group-hover:text-amber-300 transition-colors font-semibold">
                        Ativar ➔
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
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
                  {activeRoutine.exercises.map((ex, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === activeRoutine.exercises.length - 1;
                    const isDragging = draggedIndex === idx;

                    return (
                      <div
                        key={ex.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, idx)}
                        className={`py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.03] rounded-xl transition ${
                          isDragging
                            ? "opacity-40 border border-dashed border-amber-500/50 bg-amber-500/10"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* Controles de Ordem (Subir / Descer para Mobile e PC + Grip para Arrastar) */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Grip para Arrastar no Desktop */}
                            <div
                              className="hidden sm:flex text-slate-600 hover:text-slate-300 cursor-grab active:cursor-grabbing p-0.5"
                              title="Clique e arraste para reordenar"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>

                            {/* Botões Subir / Descer (ergonômicos no celular e rápidos no PC) */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={isFirst}
                                onClick={() => handleMoveExercise(activeRoutine.id, idx, "up")}
                                className="w-5 h-5 rounded flex items-center justify-center bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-amber-400 disabled:opacity-20 disabled:pointer-events-none transition border border-white/5 active:scale-90"
                                title="Mover exercício para cima"
                                aria-label={`Mover ${ex.exerciseName} para cima`}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={() => handleMoveExercise(activeRoutine.id, idx, "down")}
                                className="w-5 h-5 rounded flex items-center justify-center bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-amber-400 disabled:opacity-20 disabled:pointer-events-none transition border border-white/5 active:scale-90"
                                title="Mover exercício para baixo"
                                aria-label={`Mover ${ex.exerciseName} para baixo`}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Número da Ordem */}
                            <span className="text-slate-500 font-mono text-xs w-5 text-center font-bold">
                              {idx + 1}
                            </span>
                          </div>

                          <div className="p-1.5 rounded-lg bg-white/5 text-emerald-400 shrink-0">
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
                  );
                })}
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
