"use client";

import React from "react";
import { Dumbbell, Zap, Trophy, Flame, Layers } from "lucide-react";

interface HeaderProps {
  stats: {
    total_workouts: number;
    total_volume_kg: number;
    total_working_sets: number;
  };
}

export function Header({ stats }: HeaderProps) {
  const volumeInTons = (stats.total_volume_kg / 1000).toFixed(1);

  return (
    <header className="w-full border-b border-white/10 bg-slate-950/40 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Dumbbell className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                IRON<span className="text-emerald-400">PARSE</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                AI POWERBUILDING
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Registro em texto livre & rastreador de sobrecarga progressiva
            </p>
          </div>
        </div>

        {/* Global Stats Widgets */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/5">
            <Trophy className="h-4 w-4 text-amber-400" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400 leading-none">Treinos</p>
              <p className="text-sm font-bold text-white leading-tight">{stats.total_workouts}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/5">
            <Flame className="h-4 w-4 text-emerald-400" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400 leading-none">Volume Total</p>
              <p className="text-sm font-bold text-white leading-tight">{volumeInTons} <span className="text-[10px] text-slate-400 font-normal">ton</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/5">
            <Layers className="h-4 w-4 text-sky-400" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400 leading-none">Séries Válidas</p>
              <p className="text-sm font-bold text-white leading-tight">{stats.total_working_sets}</p>
            </div>
          </div>

          {/* AI Status Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <Zap className="h-3 w-3 fill-emerald-400" />
            <span>Gemini Flash Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
