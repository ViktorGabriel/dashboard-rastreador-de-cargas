"use client";

import React from "react";
import { WifiOff, RefreshCw } from "lucide-react";

interface NetworkStatusBadgeProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  onClick: () => void;
}

export function NetworkStatusBadge({
  isOnline,
  pendingCount,
  isSyncing,
  onClick,
}: NetworkStatusBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-300 cursor-pointer active:scale-95 shadow-sm ${
        !isOnline
          ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 hover:border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
          : pendingCount > 0
          ? "bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border-sky-500/30 hover:border-sky-500/50 shadow-[0_0_15px_rgba(56,189,248,0.15)]"
          : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-white/10 hover:border-white/20"
      }`}
      title={
        !isOnline
          ? "Você está offline. Clique para ver a fila de sincronização."
          : pendingCount > 0
          ? `${pendingCount} treino(s) na fila para sincronização. Clique para sincronizar.`
          : "Conectado. Clique para gerenciar o modo offline."
      }
    >
      <div className="relative flex items-center justify-center">
        {isSyncing ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-400" />
        ) : !isOnline ? (
          <WifiOff className="h-3.5 w-3.5 text-amber-400" />
        ) : (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
        )}
      </div>

      <span className="hidden sm:inline">
        {!isOnline ? "Offline" : isSyncing ? "Sincronizando..." : "Online"}
      </span>

      {pendingCount > 0 && (
        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
          {pendingCount}
        </span>
      )}
    </button>
  );
}
