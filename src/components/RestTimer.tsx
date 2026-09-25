"use client";

import React, { useState, useEffect } from "react";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Settings2,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Bell,
  Zap,
  Music,
  Radio,
  BellOff,
  Vibrate,
} from "lucide-react";
import {
  useRestTimer,
  playAlertSound,
  AlertSound,
} from "@/lib/use-rest-timer";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const PRESETS = [
  { label: "45s", value: 45 },
  { label: "1m", value: 60 },
  { label: "90s", value: 90 },
  { label: "2m", value: 120 },
  { label: "3m", value: 180 },
  { label: "5m", value: 300 },
];

const SOUNDS: { id: AlertSound; label: string; Icon: React.ElementType }[] = [
  { id: "chime", label: "Chime", Icon: Music },
  { id: "bell", label: "Bell", Icon: Bell },
  { id: "beep", label: "Beep", Icon: Radio },
  { id: "buzz", label: "Buzz", Icon: Zap },
  { id: "silent", label: "Silent", Icon: BellOff },
];

// ── SVG ring ─────────────────────────────────────────────────────────────────
const R = 52;
const C = 2 * Math.PI * R;

interface RingProps {
  progress: number; // 0..1
  status: string;
}

function Ring({ progress, status }: RingProps) {
  const dash = C * progress;
  const isFinished = status === "finished";
  const isRunning = status === "running";

  const ringColor = isFinished
    ? "#10b981"
    : isRunning
    ? "#38bdf8"
    : "#475569";

  const glowColor = isFinished
    ? "rgba(16,185,129,0.5)"
    : isRunning
    ? "rgba(56,189,248,0.4)"
    : "transparent";

  return (
    <svg
      viewBox="0 0 120 120"
      className="w-full h-full"
      style={{ filter: isRunning || isFinished ? `drop-shadow(0 0 8px ${glowColor})` : "none" }}
    >
      {/* Track */}
      <circle
        cx="60"
        cy="60"
        r={R}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="7"
      />
      {/* Progress */}
      <circle
        cx="60"
        cy="60"
        r={R}
        fill="none"
        stroke={ringColor}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${C}`}
        strokeDashoffset="0"
        transform="rotate(-90 60 60)"
        style={{
          transition: "stroke-dasharray 0.9s linear, stroke 0.4s ease",
        }}
      />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function RestTimer() {
  const {
    settings,
    updateSettings,
    status,
    remaining,
    progress,
    start,
    pause,
    resume,
    reset,
    addTime,
  } = useRestTimer();

  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // Animation key: change value each time status becomes "finished" so the
  // CSS animation re-runs. We encode the preset duration + status to make it
  // unique per run without needing a counter ref.
  const pulseKey = status === "finished" ? `fin-${remaining}` : status;



  // Listen for custom events from mobile nav / workout save
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleAutoStart = () => {
      setIsOpen(true);
      start();
    };
    window.addEventListener("open-rest-timer", handleOpen);
    window.addEventListener("auto-start-rest-timer", handleAutoStart);
    return () => {
      window.removeEventListener("open-rest-timer", handleOpen);
      window.removeEventListener("auto-start-rest-timer", handleAutoStart);
    };
  }, [start]);

  const handleStartPause = () => {
    if (status === "idle" || status === "finished") start();
    else if (status === "running") pause();
    else if (status === "paused") resume();
  };

  const isFinished = status === "finished";
  const isActive = status === "running" || status === "paused";

  // ── collapsed pill ──────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <button
        id="rest-timer-fab"
        aria-label="Abrir cronômetro de descanso"
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-20 right-4 z-50
          md:bottom-6 md:right-6
          flex items-center gap-2 px-3 py-2.5
          rounded-2xl border backdrop-blur-2xl
          shadow-2xl transition-all duration-300
          ${
            isActive
              ? "bg-sky-950/80 border-sky-500/40 text-sky-300 shadow-sky-500/20"
              : isFinished
              ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300 animate-pulse shadow-emerald-500/25"
              : "bg-slate-900/80 border-white/10 text-slate-300 hover:border-white/20 hover:bg-slate-800/80"
          }
        `}
      >
        <Timer className="h-4 w-4 shrink-0" />
        {isActive && (
          <span className="text-sm font-mono font-bold tabular-nums">
            {fmt(remaining)}
          </span>
        )}
        {isFinished && (
          <span className="text-sm font-bold tracking-tight">Pronto!</span>
        )}
        {status === "idle" && (
          <span className="text-xs font-semibold text-slate-400">Descanso</span>
        )}
        <ChevronUp className="h-3 w-3 opacity-60" />
      </button>
    );
  }

  // ── expanded panel ──────────────────────────────────────────────────────
  return (
    <div
      id="rest-timer-panel"
      role="region"
      aria-label="Cronômetro de descanso"
      className={`
        fixed bottom-20 right-4 z-50
        md:bottom-6 md:right-6
        w-72 rounded-3xl border backdrop-blur-3xl
        shadow-2xl overflow-hidden
        transition-all duration-300
        ${
          isFinished
            ? "border-emerald-500/30 bg-slate-950/95 shadow-emerald-500/20"
            : isActive
            ? "border-sky-500/25 bg-slate-950/95 shadow-sky-500/15"
            : "border-white/10 bg-slate-950/95"
        }
      `}
    >
      {/* ─ Header ─ */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Timer
            className={`h-4 w-4 ${
              isFinished
                ? "text-emerald-400"
                : isActive
                ? "text-sky-400"
                : "text-slate-400"
            }`}
          />
          <span className="text-sm font-bold tracking-tight text-slate-100">
            Cronômetro de Descanso
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Configurações de som"
            onClick={() => setShowSettings((v) => !v)}
            className={`p-1.5 rounded-lg transition ${
              showSettings
                ? "bg-slate-700 text-white"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Settings2 className="h-3.5 w-3.5" />
          </button>
          <button
            aria-label="Minimizar cronômetro"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ─ Settings panel (collapsible) ─ */}
      {showSettings && (
        <div className="mx-3 mb-3 rounded-2xl bg-slate-900/80 border border-white/5 p-3 space-y-3">
          {/* Sound selector */}
          <div>
            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1.5">
              Alerta Sonoro
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SOUNDS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    updateSettings({ alertSound: id });
                    if (id !== "silent")
                      playAlertSound(id, settings.volume);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition ${
                    settings.alertSound === id
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent hover:border-white/10"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Volume */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                Volume
              </p>
              <div className="flex items-center gap-1">
                {settings.volume === 0 ? (
                  <VolumeX className="h-3 w-3 text-slate-500" />
                ) : (
                  <Volume2 className="h-3 w-3 text-slate-400" />
                )}
                <span className="text-[10px] text-slate-400 tabular-nums">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) =>
                updateSettings({ volume: parseFloat(e.target.value) })
              }
              aria-label="Volume do alerta"
              className="w-full h-1.5 accent-sky-500 cursor-pointer rounded-full"
            />
          </div>

          {/* Warning alert */}
          <div>
            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1.5">
              Aviso antecipado
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {[0, 3, 5, 10].map((v) => (
                <button
                  key={v}
                  onClick={() => updateSettings({ alertAtSeconds: v })}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                    settings.alertAtSeconds === v
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  {v === 0 ? "Off" : `${v}s`}
                </button>
              ))}
            </div>
          </div>

          {/* Vibrate */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Vibrate className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-400">Vibração</span>
            </div>
            <button
              role="switch"
              aria-checked={settings.vibrate}
              onClick={() => updateSettings({ vibrate: !settings.vibrate })}
              className={`relative w-9 h-5 rounded-full transition-colors ${
                settings.vibrate ? "bg-sky-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  settings.vibrate ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* ─ Ring + time ─ */}
      <div className="px-4 pb-2 flex flex-col items-center">
        <div
          className={`relative w-36 h-36 ${
            isFinished ? "animate-[rest-timer-pulse_0.6s_ease-in-out_3]" : ""
          }`}
          key={pulseKey}
        >
          <Ring progress={progress} status={status} />
          {/* Center display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
            <span
              className={`font-mono font-black tabular-nums leading-none tracking-tighter transition-colors ${
                isFinished
                  ? "text-emerald-400 text-3xl"
                  : isActive
                  ? "text-sky-200 text-3xl"
                  : "text-slate-300 text-3xl"
              }`}
            >
              {isFinished ? "✓" : fmt(remaining)}
            </span>
            {!isFinished && (
              <span className="text-[10px] text-slate-600 uppercase tracking-widest mt-0.5">
                {status === "idle"
                  ? "pronto"
                  : status === "paused"
                  ? "pausado"
                  : "restando"}
              </span>
            )}
            {isFinished && (
              <span className="text-[10px] text-emerald-500 uppercase tracking-widest mt-0.5 font-bold">
                Descansado!
              </span>
            )}
          </div>
        </div>

        {/* +/- time adjust */}
        {(isActive || isFinished) && (
          <div className="flex items-center gap-2 mt-1 mb-1">
            <button
              aria-label="Remover 15 segundos"
              onClick={() => addTime(-15)}
              className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition"
            >
              <Minus className="h-3 w-3" /> 15s
            </button>
            <button
              aria-label="Adicionar 15 segundos"
              onClick={() => addTime(15)}
              className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition"
            >
              <Plus className="h-3 w-3" /> 15s
            </button>
          </div>
        )}
      </div>

      {/* ─ Presets ─ */}
      {!isActive && (
        <div className="px-4 pb-2">
          <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase mb-1.5">
            Predefinições
          </p>
          <div className="grid grid-cols-6 gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  updateSettings({ presetSeconds: p.value });
                  start(p.value);
                }}
                className={`py-1.5 rounded-xl text-xs font-bold transition ${
                  settings.presetSeconds === p.value && status === "idle"
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    : "bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─ Controls ─ */}
      <div className="px-4 pb-4 flex items-center gap-2">
        {/* Play / Pause / Resume */}
        <button
          id="rest-timer-play-pause"
          aria-label={
            status === "running"
              ? "Pausar cronômetro"
              : status === "paused"
              ? "Retomar cronômetro"
              : "Iniciar cronômetro"
          }
          onClick={handleStartPause}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-bold text-sm transition-all ${
            isFinished
              ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30"
              : status === "running"
              ? "bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/25"
              : "bg-slate-700 text-white hover:bg-slate-600 border border-transparent"
          }`}
        >
          {status === "running" ? (
            <><Pause className="h-4 w-4" /> Pausar</>
          ) : status === "paused" ? (
            <><Play className="h-4 w-4" /> Retomar</>
          ) : isFinished ? (
            <><Play className="h-4 w-4" /> Repetir</>
          ) : (
            <><Play className="h-4 w-4" /> Iniciar</>
          )}
        </button>

        {/* Reset */}
        {(isActive || isFinished) && (
          <button
            aria-label="Reiniciar cronômetro"
            onClick={reset}
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-transparent transition"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
