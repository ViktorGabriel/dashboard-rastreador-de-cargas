"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type TimerStatus = "idle" | "running" | "paused" | "finished";
export type AlertSound = "beep" | "chime" | "bell" | "buzz" | "silent";

export interface TimerSettings {
  presetSeconds: number;
  alertSound: AlertSound;
  volume: number; // 0..1
  alertAtSeconds: number; // warning N seconds before finish
  vibrate: boolean;
}

const SETTINGS_KEY = "irontracker_timer_settings";

const DEFAULT_SETTINGS: TimerSettings = {
  presetSeconds: 120,
  alertSound: "chime",
  volume: 0.7,
  alertAtSeconds: 5,
  vibrate: true,
};

function loadSettings(): TimerSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: TimerSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch { /* noop */ }
}

// ── Web Audio helpers ─────────────────────────────────────────────────────────
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    return new Ctx();
  } catch {
    return null;
  }
}

function playBeep(
  ctx: AudioContext,
  volume: number,
  freq = 880,
  duration = 0.12,
  type: OscillatorType = "square"
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playChime(ctx: AudioContext, volume: number) {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
    gain.gain.linearRampToValueAtTime(
      volume * 0.5,
      ctx.currentTime + i * 0.12 + 0.02
    );
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + i * 0.12 + 0.45
    );
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.45);
  });
}

function playBell(ctx: AudioContext, volume: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(1320, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.6);
  gain.gain.setValueAtTime(volume * 0.6, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 1.2);
}

function playBuzz(ctx: AudioContext, volume: number) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * volume;
  }
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buf;
  src.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(volume * 0.6, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
  src.start(ctx.currentTime);
}

export function playAlertSound(sound: AlertSound, volume: number) {
  const ctx = getAudioContext();
  if (!ctx || sound === "silent") return;
  ctx.resume().then(() => {
    switch (sound) {
      case "beep":
        playBeep(ctx, volume);
        break;
      case "chime":
        playChime(ctx, volume);
        break;
      case "bell":
        playBell(ctx, volume);
        break;
      case "buzz":
        playBuzz(ctx, volume);
        break;
    }
  });
}

export function playWarnSound(sound: AlertSound, volume: number) {
  const ctx = getAudioContext();
  if (!ctx || sound === "silent") return;
  ctx.resume().then(() => {
    playBeep(ctx, volume * 0.5, 660, 0.1, "sine");
  });
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useRestTimer() {
  const [settings, setSettings] = useState<TimerSettings>(loadSettings);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [remaining, setRemaining] = useState(() => loadSettings().presetSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warnedRef = useRef(false);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const s = settingsRef.current;
    setRemaining((prev) => {
      const next = prev - 1;
      if (!warnedRef.current && next === s.alertAtSeconds && next > 0) {
        warnedRef.current = true;
        playWarnSound(s.alertSound, s.volume);
        if (s.vibrate && typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([30]);
        }
      }
      if (next <= 0) {
        setStatus("finished");
        playAlertSound(s.alertSound, s.volume);
        if (s.vibrate && typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([80, 40, 80, 40, 120]);
        }
        return 0;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (status === "running") {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearTick();
    }
    return clearTick;
  }, [status, tick, clearTick]);

  const start = useCallback(
    (seconds?: number) => {
      const target = seconds ?? settingsRef.current.presetSeconds;
      setRemaining(target);
      warnedRef.current = false;
      setStatus("running");
    },
    []
  );

  const pause = useCallback(() => {
    setStatus((s) => (s === "running" ? "paused" : s));
  }, []);

  const resume = useCallback(() => {
    setStatus((s) => (s === "paused" ? "running" : s));
  }, []);

  const reset = useCallback(() => {
    clearTick();
    setStatus("idle");
    setRemaining(settingsRef.current.presetSeconds);
    warnedRef.current = false;
  }, [clearTick]);

  const updateSettings = useCallback((patch: Partial<TimerSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      settingsRef.current = next;
      if ("presetSeconds" in patch) {
        setStatus((st) => {
          if (st === "idle") setRemaining(patch.presetSeconds!);
          return st;
        });
      }
      return next;
    });
  }, []);

  const addTime = useCallback((seconds: number) => {
    setRemaining((prev) => Math.max(0, prev + seconds));
    // if finished, restart
    setStatus((s) => (s === "finished" ? "running" : s));
    warnedRef.current = false;
  }, []);

  const progress =
    settings.presetSeconds > 0 ? remaining / settings.presetSeconds : 0;

  return {
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
  };
}
