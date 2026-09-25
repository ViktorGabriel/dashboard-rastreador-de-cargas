"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  FileCode2,
  FileSpreadsheet,
  Layers,
  Database,
  CheckCircle2,
  AlertCircle,
  Dumbbell,
  Calendar,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: {
    total_workouts: number;
    total_volume_kg: number;
    total_working_sets: number;
  };
}

export function ExportDataModal({ isOpen, onClose, stats }: ExportDataModalProps) {
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerDownload = async (format: "json" | "csv", type?: string) => {
    const key = `${format}-${type || "all"}`;
    setDownloadingType(key);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const url = `/api/export?format=${format}${type ? `&type=${type}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Falha ao gerar o arquivo de exportação.");
      }

      // Extract filename from header or build fallback
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `ironparse-export-${new Date().toISOString().split("T")[0]}.${format}`;
      if (contentDisposition && contentDisposition.includes("filename=")) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSuccessMessage(`Arquivo ${filename} baixado com sucesso!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido ao exportar.";
      setErrorMessage(msg);
    } finally {
      setDownloadingType(null);
    }
  };

  const volumeInTons = stats ? (stats.total_volume_kg / 1000).toFixed(1) : "0.0";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900/95 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-white p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
              <Download className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Exportação de Dados
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Total Portability
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Faça o download dos seus treinos, séries e rotinas nos formatos abertos CSV e JSON.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Global Summary Strip */}
        {stats && (
          <div className="my-6 grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-white/5">
            <div className="flex items-center gap-2.5 px-3 py-1">
              <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Total de Sessões</p>
                <p className="text-sm font-extrabold font-mono text-white">{stats.total_workouts}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-1 border-x border-white/5">
              <Layers className="h-4 w-4 text-sky-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Séries Válidas</p>
                <p className="text-sm font-extrabold font-mono text-white">{stats.total_working_sets}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-1">
              <Dumbbell className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Volume Total</p>
                <p className="text-sm font-extrabold font-mono text-white">
                  {volumeInTons} <span className="text-[10px] font-sans text-slate-400">ton</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Alerts */}
        {successMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-xs sm:text-sm animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-xs sm:text-sm animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Option 1: Complete JSON */}
          <div className="group relative rounded-2xl p-5 bg-gradient-to-b from-slate-800/50 to-slate-950/60 border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex flex-col justify-between shadow-[0_0_20px_rgba(16,185,129,0.06)]">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                BACKUP COMPLETO
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FileCode2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white group-hover:text-emerald-300 transition-colors">
                    Exportação Completa (JSON)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">.json • UTF-8</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Estrutura relacional profunda com todos os treinos, séries, histórico de cargas, rotinas e biblioteca de exercícios. Ideal para backup seguro ou migração de banco de dados.
              </p>
            </div>

            <button
              onClick={() => triggerDownload("json")}
              disabled={downloadingType === "json-all"}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] disabled:opacity-60 cursor-pointer"
            >
              {downloadingType === "json-all" ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>Gerando JSON...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Baixar Backup Completo (JSON)</span>
                </>
              )}
            </button>
          </div>

          {/* Option 2: Detailed Sets CSV */}
          <div className="group relative rounded-2xl p-5 bg-gradient-to-b from-slate-800/50 to-slate-950/60 border border-sky-500/30 hover:border-sky-500/60 transition-all flex flex-col justify-between shadow-[0_0_20px_rgba(14,165,233,0.06)]">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40">
                EXCEL & POWER BI
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white group-hover:text-sky-300 transition-colors">
                    Séries Detalhadas (CSV)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">.csv • UTF-8 BOM</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Formato tabular analítico linha a linha. Cada série contém peso, reps, RPE, 1RM estimado (Epley), Volume Load, data e notas. Perfeito para análise de sobrecarga no Excel ou Sheets.
              </p>
            </div>

            <button
              onClick={() => triggerDownload("csv", "sets")}
              disabled={downloadingType === "csv-sets"}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-slate-950 transition-all shadow-[0_0_15px_rgba(14,165,233,0.25)] disabled:opacity-60 cursor-pointer"
            >
              {downloadingType === "csv-sets" ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>Gerando CSV...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Baixar Planilha de Séries (CSV)</span>
                </>
              )}
            </button>
          </div>

          {/* Option 3: Workouts Summary CSV */}
          <div className="group relative rounded-2xl p-5 bg-gradient-to-b from-slate-800/40 to-slate-950/60 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Resumo das Sessões (CSV)
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">.csv • Macro visão</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Uma linha consolidada por sessão de treino com data, título, volume acumulado em kg, contagem de exercícios e séries válidas.
            </p>

            <button
              onClick={() => triggerDownload("csv", "workouts")}
              disabled={downloadingType === "csv-workouts"}
              className="w-full flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white border border-white/10 hover:border-white/20 transition-all disabled:opacity-60 cursor-pointer"
            >
              {downloadingType === "csv-workouts" ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Baixar Resumo de Sessões</span>
                </>
              )}
            </button>
          </div>

          {/* Option 4: Catalog & Routines CSV */}
          <div className="group relative rounded-2xl p-5 bg-gradient-to-b from-slate-800/40 to-slate-950/60 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    Exercícios & Rotinas (CSV)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">.csv • Fichas & Catálogo</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Exporte o catálogo canônico de exercícios cadastrados ou o template das fichas e divisões planejadas (Upper/Lower, PPL).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => triggerDownload("csv", "exercises")}
                disabled={downloadingType === "csv-exercises"}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white border border-white/10 hover:border-white/20 transition-all disabled:opacity-60 cursor-pointer"
              >
                <Download className="h-3 w-3" />
                <span>Exercícios</span>
              </button>
              <button
                onClick={() => triggerDownload("csv", "routines")}
                disabled={downloadingType === "csv-routines"}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white border border-white/10 hover:border-white/20 transition-all disabled:opacity-60 cursor-pointer"
              >
                <Download className="h-3 w-3" />
                <span>Rotinas</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info tip */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            <span>
              Arquivos CSV incluem marcador <strong>UTF-8 BOM</strong> para abertura direta e compatibilidade com acentuação no Microsoft Excel.
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
          >
            <span>Fechar</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
