"use client";

import { useState, useEffect, useCallback } from "react";
import { getPendingQueueCount, processOfflineQueue } from "./offline-sync";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWA() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  });

  const [isInstallable, setIsInstallable] = useState<boolean>(false);

  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari standalone mode
      window.navigator.standalone === true
    );
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(() => {
    return getPendingQueueCount();
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ succeeded: number; failed: number } | null>(null);

  // Update pending count
  const refreshQueueCount = useCallback(() => {
    setPendingCount(getPendingQueueCount());
  }, []);

  // Process offline queue
  const syncNow = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await processOfflineQueue();
      setLastSyncResult({ succeeded: result.succeeded, failed: result.failed });
      refreshQueueCount();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshQueueCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registrado com sucesso:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Falha ao registrar Service Worker:", err);
        });

      // Listen for messages from Service Worker (e.g. background sync triggers)
      const handleSWMessage = (event: MessageEvent) => {
        if (event.data?.type === "TRIGGER_BACKGROUND_SYNC") {
          console.log("[PWA] Mensagem do Service Worker recebida: TRIGGER_BACKGROUND_SYNC");
          syncNow();
        }
      };

      navigator.serviceWorker.addEventListener("message", handleSWMessage);

      // Online & Offline Event Listeners
      const handleOnline = () => {
        setIsOnline(true);
        console.log("[PWA] Conexão restabelecida! Iniciando sincronização em background...");
        syncNow();
      };

      const handleOffline = () => {
        setIsOnline(false);
        console.log("[PWA] Dispositivo desconectado (modo offline).");
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Listen to queue updates dispatched within the app
      const handleQueueUpdate = () => {
        refreshQueueCount();
      };
      window.addEventListener("irontracker-queue-updated", handleQueueUpdate);

      // Capture beforeinstallprompt for install button
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setIsInstallable(true);
      };
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      // App installed listener
      const handleAppInstalled = () => {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
      };
      window.addEventListener("appinstalled", handleAppInstalled);

      return () => {
        navigator.serviceWorker.removeEventListener("message", handleSWMessage);
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("irontracker-queue-updated", handleQueueUpdate);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }
  }, [refreshQueueCount, syncNow]);

  // Trigger native install prompt
  const installApp = async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn("Erro ao acionar prompt de instalação:", err);
    }
    return false;
  };

  return {
    isOnline,
    isInstallable,
    isInstalled,
    pendingCount,
    isSyncing,
    lastSyncResult,
    syncNow,
    installApp,
    refreshQueueCount,
  };
}
