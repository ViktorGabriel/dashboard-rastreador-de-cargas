"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, Loader2, RotateCcw, HelpCircle, Flame } from "lucide-react";
import { ParsedWorkoutResult } from "@/lib/formulas";

interface QuickWorkoutLoggerProps {
  onParsed: (result: ParsedWorkoutResult, originalText: string) => void;
  externalText?: string;
}

const TEMPLATES = [
  {
    label: "Supino Reto (Top Set + Back-off)",
    text: "Hoje fiz supino reto 1x3 com 140kg top set @9 e 3x6 com 115kg backoff, depois remada curvada 4x8 com 80kg e elevação lateral 4x12 com 14kg",
  },
  {
    label: "Leg Day (Agacho + Stiff)",
    text: "Treino de pernas pesado: agachamento livre 1x3 com 160kg top set, 3x6 com 135kg back-off @8.5. Stiff com barra 3x8 com 100kg e cadeira extensora 3x12 com 65kg",
  },
  {
    label: "Costas & Bíceps",
    text: "Ontem fiz levantamento terra 1x2 com 190kg top set @9, puxada alta 4x10 com 75kg e rosca direta com barra w 3x8 com 35kg",
  },
];

export function QuickWorkoutLogger({ onParsed, externalText }: QuickWorkoutLoggerProps) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [prevExternalText, setPrevExternalText] = useState(externalText);
  if (externalText !== prevExternalText) {
    setPrevExternalText(externalText);
    if (externalText) {
      setInputText(externalText);
    }
  }

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/parse-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao processar treino.");
      }

      if (!data.is_workout) {
        setErrorMsg(data.feedback_message || "Nenhum treino reconhecido. Tente incluir exercícios e cargas.");
        return;
      }

      onParsed(data, inputText);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Erro de conexão ao analisar treino.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleAnalyze();
    }
  };

  return (
    <div className={`bezel-shell relative transition-all duration-500 ${isLoading ? "p-[7px] ai-scan-border" : ""}`}>
      <div className="bezel-core p-5 sm:p-6 relative space-y-4">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Registro Livre de Treino (AI Parser)
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Flame className="h-3 w-3" /> Gemini 3.6 Flash
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Escreva séries, cargas e anotações como se falasse com seu treinador
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 self-start sm:self-auto px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
            <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
            <span>Atalho rápido:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono text-[10px] font-bold border border-white/10">
              Ctrl + Enter
            </kbd>
          </div>
        </div>

        {/* Text Area Container */}
        <div className="relative group">
          <textarea
            id="workout-text-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Exemplo: Hoje fiz 1x3 com 140kg no supino reto top set @9 e 3x6 com 115kg back-off, depois 4x8 remada curvada 80kg..."
            rows={3}
            className={`w-full bg-slate-950/70 border rounded-2xl p-4 text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-300 resize-none outline-none font-sans ${
              isLoading
                ? "border-emerald-500/60 ring-2 ring-emerald-500/20"
                : "border-white/10 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/30"
            }`}
          />
          {inputText && (
            <button
              type="button"
              onClick={() => setInputText("")}
              title="Limpar texto"
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/80 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Quick Chips & Footer Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          {/* Templates */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">Exemplos:</span>
            {TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputText(tmpl.text)}
                className="text-[11px] px-3 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-200 active:scale-95"
              >
                {tmpl.label}
              </button>
            ))}
          </div>

          {/* Action Button: Button-in-Button Architecture */}
          <button
            type="button"
            id="analyze-workout-button"
            onClick={handleAnalyze}
            disabled={isLoading || !inputText.trim()}
            className="group relative inline-flex items-center justify-center gap-3 pl-5 pr-2 py-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] self-end sm:self-auto shrink-0"
          >
            {isLoading ? (
              <>
                <span className="font-semibold text-xs tracking-wide">Interpretando sessão...</span>
                <span className="w-8 h-8 rounded-full bg-black/15 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                </span>
              </>
            ) : (
              <>
                <span className="tracking-tight">Analisar Treino com IA</span>
                <span className="w-8 h-8 rounded-full bg-black/15 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4 text-slate-950" />
                </span>
              </>
            )}
          </button>
        </div>

        {/* Feedback Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-modal-in">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-400 hover:text-rose-200 font-bold ml-2 p-1"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
