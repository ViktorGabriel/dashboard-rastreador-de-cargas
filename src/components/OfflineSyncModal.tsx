"use client";

import React, { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Plus,
  Dumbbell,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import {
  getOfflineQueue,
  removeQueueItem,
  clearCompletedItems,
  processOfflineQueue,
  QueuedWorkoutItem,
} from "@/lib/offline-sync";

interface OfflineSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  onOpenManualModal?: () => void;
  onSyncCompleted?: () => void;
}

export function OfflineSyncModal({
  isOpen,
  onClose,
  isOnline,
  onOpenManualModal,
  onSyncCompleted,
}: OfflineSyncModalProps) {
  const [queue, setQueue] = useState<QueuedWorkoutItem[]>(getOfflineQueue);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadQueue = () => {
    setQueue(getOfflineQueue());
  };

  useEffect(() => {
    const handleUpdate = () => {
      setQueue(getOfflineQueue());
    };
    window.addEventListener("irontracker-queue-updated", handleUpdate);
    return () => {
      window.removeEventListener("irontracker-queue-updated", handleUpdate);
    };
  }, []);

  if (!isOpen) return null;

  const handleSyncAll = async () => {
    if (!isOnline) {
      setStatusMessage("Você está offline. Conecte-se à internet para sincronizar.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("Sincronizando treinos com o servidor...");

    try {
      const result = await processOfflineQueue(() => {
        loadQueue();
      });

      setStatusMessage(
        `Sincronização concluída: ${result.succeeded} processados com sucesso${
          result.failed > 0 ? `, ${result.failed} falharam.` : "."
        }`
      );
      loadQueue();
      onSyncCompleted?.();
    } catch (err: unknown) {
      const error = err as Error;
      setStatusMessage(`Erro durante sincronização: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = (id: string) => {
    removeQueueItem(id);
    loadQueue();
  };

  const handleClearCompleted = () => {
    clearCompletedItems();
    loadQueue();
  };

  const pendingCount = queue.filter((i) => i.status === "PENDING" || i.status === "FAILED").length;
  const completedCount = queue.filter((i) => i.status === "COMPLETED").length;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bezel-shell w-full max-w-2xl max-h-[90vh] flex flex-col animate-modal-in shadow-2xl"
      >
        <div className="bezel-core flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center border shadow-sm ${
                  isOnline
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                }`}
              >
                {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  Sincronização & Modo Offline
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      isOnline
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {isOnline ? "Conectado à Nuvem" : "Modo Local Ativo"}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Treine na academia sem internet: registre suas cargas que sincronizaremos em segundo plano
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Fechar (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Status Card */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-white/5 text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Status da Fila Local</p>
                  <p className="text-[11px] text-slate-400">
                    {pendingCount === 0
                      ? "Nenhum treino pendente. Todos os dados estão seguros e gravados."
                      : `${pendingCount} treino(s) aguardando sincronização.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onOpenManualModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenManualModal();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Criar Manual Offline</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSyncAll}
                  disabled={isProcessing || !isOnline || pendingCount === 0}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? "animate-spin" : ""}`} />
                  <span>{isProcessing ? "Sincronizando..." : "Sincronizar Agora"}</span>
                </button>
              </div>
            </div>

            {statusMessage && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                {statusMessage}
              </div>
            )}

            {/* Queue List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                <span>ITENS NA FILA ({queue.length})</span>
                {completedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCompleted}
                    className="text-slate-500 hover:text-slate-300 text-[11px] underline"
                  >
                    Limpar {completedCount} concluído(s)
                  </button>
                )}
              </div>

              {queue.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-white/10 bg-slate-950/40">
                  <Clock className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-300">Fila de sincronização vazia</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Se você estiver sem sinal na academia, qualquer treino digitado ou confirmado será guardado aqui.
                  </p>
                </div>
              ) : (
                queue.map((item) => {
                  const dateStr = new Date(item.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/10 transition"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-slate-900 text-slate-400 shrink-0 mt-0.5">
                          <Dumbbell className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-xs text-white truncate">{item.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-white/5">
                              {item.type === "STRUCTURED_WORKOUT" ? "Estruturado" : "Texto Livre"}
                            </span>
                            {item.status === "PENDING" && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-bold">
                                <Clock className="h-2.5 w-2.5" /> Pendente
                              </span>
                            )}
                            {item.status === "SYNCING" && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-1 font-bold">
                                <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Enviando...
                              </span>
                            )}
                            {item.status === "COMPLETED" && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Sincronizado
                              </span>
                            )}
                            {item.status === "FAILED" && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1 font-bold">
                                <AlertCircle className="h-2.5 w-2.5" /> Falhou
                              </span>
                            )}
                          </div>

                          {item.payload.text && (
                            <p className="text-[11px] text-slate-400 truncate mt-1 italic">
                              &ldquo;{item.payload.text}&rdquo;
                            </p>
                          )}

                          {item.errorMessage && (
                            <p className="text-[10px] text-rose-400 mt-1">{item.errorMessage}</p>
                          )}

                          <span className="text-[10px] text-slate-500 mt-1 block">
                            Adicionado às {dateStr}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Remover item da fila"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Information Tips */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5 text-[11px] text-slate-400">
              <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" /> Como funciona o Background Sync?
              </p>
              <p>
                Quando você salva um treino offline, ele permanece criptografado no seu aparelho. Assim que seu smartphone reconectar ao Wi-Fi ou rede 4G/5G, o navegador aciona a sincronização em segundo plano automaticamente, sem você precisar reabrir o app.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/70 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {isOnline ? "Conexão ativa" : "Trabalhando em modo autônomo offline"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs border border-white/5 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
