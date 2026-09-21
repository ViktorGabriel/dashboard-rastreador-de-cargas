"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, Loader2, RotateCcw, HelpCircle } from "lucide-react";
import { ParsedWorkoutResult } from "@/lib/formulas";

interface QuickWorkoutLoggerProps {
  onParsed: (result: ParsedWorkoutResult, originalText: string) => void;
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

export function QuickWorkoutLogger({ onParsed }: QuickWorkoutLoggerProps) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    } catch (err: any) {
      setErrorMsg(err.message || "Erro de conexão ao analisar treino.");
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
    <section className="glass-card p-5 sm:p-6 relative overflow-hidden border-emerald-500/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Registrar Treino em Texto Puro
          </h2>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1">
          <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
          <span>Atalho: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-white/10">Ctrl + Enter</kbd></span>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-3">
        Digite livremente seu treino com séries, repetições, cargas e anotações. A IA estrutura tudo automaticamente.
      </p>

      {/* Text Area */}
      <div className="relative">
        <textarea
          id="workout-text-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Exemplo: Hoje fiz 4x8 no supino com 90kg e 3x10 na remada com 70kg..."
          rows={3}
          className="w-full bg-slate-950/60 border border-white/10 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 rounded-xl p-3.5 text-sm text-slate-100 placeholder:text-slate-500 transition resize-none outline-none"
        />
        {inputText && (
          <button
            onClick={() => setInputText("")}
            title="Limpar texto"
            className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Templates / Quick Chips */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-slate-500">Exemplos rápidos:</span>
        {TEMPLATES.map((tmpl, idx) => (
          <button
            key={idx}
            onClick={() => setInputText(tmpl.text)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/5 transition"
          >
            {tmpl.label}
          </button>
        ))}
      </div>

      {/* Error / Feedback */}
      {errorMsg && (
        <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200 font-bold ml-2">×</button>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-4 flex items-center justify-end">
        <button
          id="analyze-workout-button"
          onClick={handleAnalyze}
          disabled={isLoading || !inputText.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
              <span>Analisando com Gemini...</span>
            </>
          ) : (
            <>
              <span>Analisar Treino com IA</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </section>
  );
}
