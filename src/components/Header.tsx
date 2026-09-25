"use client";

import React, { useState } from "react";
import { Dumbbell, Zap, Trophy, Flame, Layers, Download, Smartphone } from "lucide-react";
import { ExportDataModal } from "@/components/ExportDataModal";
import { NetworkStatusBadge } from "@/components/NetworkStatusBadge";

interface HeaderProps {
  stats: {
    total_workouts: number;
    total_volume_kg: number;
    total_working_sets: number;
  };
  isOnline?: boolean;
  pendingCount?: number;
  isSyncing?: boolean;
  isInstallable?: boolean;
  isInstalled?: boolean;
  onOpenSyncModal?: () => void;
  onOpenInstallModal?: () => void;
}

export function Header({
  stats,
  isOnline = true,
  pendingCount = 0,
  isSyncing = false,
  isInstalled = false,
  onOpenSyncModal,
  onOpenInstallModal,
}: HeaderProps) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const volumeInTons = (stats.total_volume_kg / 1000).toFixed(1);

  return (
    <header className="w-full border-b border-white/[0.08] bg-slate-950/60 backdrop-blur-2xl sticky top-0 z-30 transition-all duration-300">
      <div className="w-full max-w-[1780px] 2xl:max-w-[2040px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <div className="h-full w-full bg-slate-950 rounded-[15px] flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
                IRON<span className="text-emerald-400">PARSE</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                PRO OVERLOAD
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Rastreador Inteligente de Sobrecarga Progressiva
            </p>
          </div>
        </div>

        {/* Global Stats Widgets */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 shadow-sm hover:border-white/20 transition">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Trophy className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400 leading-none tracking-wider">Treinos</p>
              <p className="text-sm font-extrabold text-white font-mono leading-tight">{stats.total_workouts}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 shadow-sm hover:border-white/20 transition">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Flame className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400 leading-none tracking-wider">Tonelagem</p>
              <p className="text-sm font-extrabold text-white font-mono leading-tight">
                {volumeInTons} <span className="text-[10px] text-slate-400 font-normal font-sans">ton</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 shadow-sm hover:border-white/20 transition">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Layers className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400 leading-none tracking-wider">Séries Válidas</p>
              <p className="text-sm font-extrabold text-white font-mono leading-tight">{stats.total_working_sets}</p>
            </div>
          </div>

          {/* AI Active Indicator */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <Zap className="h-3 w-3 fill-emerald-400" />
            <span>Gemini Flash</span>
          </div>

          {/* Offline Sync Status Badge */}
          {onOpenSyncModal && (
            <NetworkStatusBadge
              isOnline={isOnline}
              pendingCount={pendingCount}
              isSyncing={isSyncing}
              onClick={onOpenSyncModal}
            />
          )}

          {/* Install PWA Button */}
          {!isInstalled && onOpenInstallModal && (
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition shadow-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer active:scale-95"
              title="Instalar App no Celular ou Desktop"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Instalar App</span>
            </button>
          )}

          {/* Export Data Button */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/10 text-emerald-400 text-xs font-bold transition shadow-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer active:scale-95"
            title="Exportar dados em CSV e JSON"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      <ExportDataModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        stats={stats}
      />
    </header>
  );
}

