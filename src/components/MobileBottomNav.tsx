"use client";

import React from "react";
import { Dumbbell, Sparkles, TrendingUp, History, WifiOff, Wifi, Timer } from "lucide-react";

interface MobileBottomNavProps {
  onOpenSyncModal: () => void;
  onOpenTimer: () => void;
  pendingCount: number;
  isOnline: boolean;
}

export function MobileBottomNav({
  onOpenSyncModal,
  onOpenTimer,
  pendingCount,
  isOnline,
}: MobileBottomNavProps) {
  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const scrollToSection = (id: string, focusInput = false) => {
    triggerHaptic();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (focusInput) {
        const input = document.getElementById("workout-text-input");
        if (input) {
          setTimeout(() => input.focus(), 350);
        }
      }
    }
  };

  return (
    <nav
      aria-label="Navegação rápida mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 px-2 py-2 safe-bottom"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Logar Treino */}
        <button
          type="button"
          onClick={() => scrollToSection("workout-text-input", true)}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-slate-400 hover:text-emerald-400 active:text-emerald-400 transition"
        >
          <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold tracking-tight">Treinar</span>
        </button>

        {/* 2. Fichas de Treino */}
        <button
          type="button"
          onClick={() => scrollToSection("routine-split-manager")}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-slate-400 hover:text-white active:text-white transition"
        >
          <div className="p-1 rounded-lg bg-slate-900 text-slate-300">
            <Dumbbell className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-semibold">Fichas</span>
        </button>

        {/* 3. Sobrecarga e Gráficos */}
        <button
          type="button"
          onClick={() => scrollToSection("progressive-overload-charts")}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-slate-400 hover:text-white active:text-white transition"
        >
          <div className="p-1 rounded-lg bg-slate-900 text-slate-300">
            <TrendingUp className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-semibold">Cargas</span>
        </button>

        {/* 4. Histórico */}
        <button
          type="button"
          onClick={() => scrollToSection("workout-history-feed")}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-slate-400 hover:text-white active:text-white transition"
        >
          <div className="p-1 rounded-lg bg-slate-900 text-slate-300">
            <History className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-semibold">Histórico</span>
        </button>

        {/* 5. Rest Timer */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            onOpenTimer();
          }}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-slate-400 hover:text-sky-400 active:text-sky-400 transition"
        >
          <div className="p-1 rounded-lg bg-slate-900 text-slate-300">
            <Timer className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-semibold">Descanso</span>
        </button>

        {/* 6. Status Offline & Sync */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            onOpenSyncModal();
          }}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl relative transition"
        >
          <div
            className={`p-1 rounded-lg ${
              !isOnline
                ? "bg-amber-500/20 text-amber-400"
                : pendingCount > 0
                ? "bg-sky-500/20 text-sky-400"
                : "bg-slate-900 text-slate-400"
            }`}
          >
            {!isOnline ? (
              <WifiOff className="h-4 w-4" />
            ) : (
              <Wifi className="h-4 w-4 text-emerald-400" />
            )}
          </div>
          <span
            className={`text-[10px] font-semibold ${
              !isOnline ? "text-amber-400" : pendingCount > 0 ? "text-sky-400" : "text-slate-400"
            }`}
          >
            {!isOnline ? "Offline" : "Sync"}
          </span>

          {pendingCount > 0 && (
            <span className="absolute top-0 right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-500 text-slate-950 animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
