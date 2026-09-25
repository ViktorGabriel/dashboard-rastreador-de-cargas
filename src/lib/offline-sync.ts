import { ParsedExercise } from "./formulas";

export type QueuedWorkoutType = "RAW_TEXT" | "STRUCTURED_WORKOUT";
export type QueueStatus = "PENDING" | "SYNCING" | "FAILED" | "COMPLETED";

export interface QueuedWorkoutItem {
  id: string;
  createdAt: string;
  type: QueuedWorkoutType;
  title: string;
  payload: {
    text?: string;
    workoutData?: {
      date: string;
      title: string;
      notes?: string;
      raw_input_text?: string;
      exercises: ParsedExercise[];
    };
  };
  status: QueueStatus;
  errorMessage?: string;
  retryCount: number;
}

const STORAGE_KEY = "irontracker_offline_sync_queue";
const QUEUE_UPDATED_EVENT = "irontracker-queue-updated";

// Helper to check if running in browser with storage available
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Recupera todos os itens da fila de sincronização offline
 */
export function getOfflineQueue(): QueuedWorkoutItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedWorkoutItem[];
  } catch (err) {
    console.error("Erro ao ler fila offline do localStorage:", err);
    return [];
  }
}

/**
 * Salva a fila atualizada no localStorage e notifica ouvintes
 */
export function saveOfflineQueue(queue: QueuedWorkoutItem[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent(QUEUE_UPDATED_EVENT, { detail: queue }));
  } catch (err) {
    console.error("Erro ao salvar fila offline no localStorage:", err);
  }
}

/**
 * Adiciona um novo treino (em texto ou estruturado) na fila offline
 */
export function enqueueOfflineWorkout(params: {
  type: QueuedWorkoutType;
  title?: string;
  text?: string;
  workoutData?: {
    date: string;
    title: string;
    notes?: string;
    raw_input_text?: string;
    exercises: ParsedExercise[];
  };
}): QueuedWorkoutItem {
  const queue = getOfflineQueue();
  const id = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const title =
    params.title ||
    (params.type === "STRUCTURED_WORKOUT"
      ? params.workoutData?.title || "Treino Estruturado"
      : params.text?.slice(0, 32) + "..." || "Treino em Texto");

  const newItem: QueuedWorkoutItem = {
    id,
    createdAt: new Date().toISOString(),
    type: params.type,
    title,
    payload: {
      text: params.text,
      workoutData: params.workoutData,
    },
    status: "PENDING",
    retryCount: 0,
  };

  queue.unshift(newItem);
  saveOfflineQueue(queue);

  // Solicita ao service worker registro de Background Sync se disponível
  requestBackgroundSync();

  return newItem;
}

/**
 * Remove um item específico da fila
 */
export function removeQueueItem(id: string): void {
  const queue = getOfflineQueue().filter((item) => item.id !== id);
  saveOfflineQueue(queue);
}

/**
 * Limpa todos os itens já completados com sucesso
 */
export function clearCompletedItems(): void {
  const queue = getOfflineQueue().filter((item) => item.status !== "COMPLETED");
  saveOfflineQueue(queue);
}

/**
 * Retorna a contagem de treinos aguardando sincronização
 */
export function getPendingQueueCount(): number {
  return getOfflineQueue().filter((item) => item.status === "PENDING" || item.status === "FAILED").length;
}

/**
 * Solicita ao Service Worker o registro de sincronização em segundo plano (Background Sync API)
 */
export async function requestBackgroundSync(): Promise<boolean> {
  if (!isBrowser()) return false;
  try {
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      const reg = await navigator.serviceWorker.ready;
      // @ts-expect-error SyncManager interface is modern web standard
      if (reg.sync) {
        // @ts-expect-error SyncManager interface
        await reg.sync.register("sync-workouts");
        return true;
      }
    }
  } catch (err) {
    console.warn("Background Sync API não suportada ou permissão negada:", err);
  }
  return false;
}

/**
 * Processa todos os itens pendentes da fila enviando-os para a API
 */
export async function processOfflineQueue(
  onProgress?: (item: QueuedWorkoutItem) => void
): Promise<{ processed: number; succeeded: number; failed: number }> {
  if (!isBrowser()) return { processed: 0, succeeded: 0, failed: 0 };

  const queue = getOfflineQueue();
  const pendingItems = queue.filter((item) => item.status === "PENDING" || item.status === "FAILED");

  if (pendingItems.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const item of pendingItems) {
    item.status = "SYNCING";
    item.errorMessage = undefined;
    saveOfflineQueue(queue);
    onProgress?.(item);

    try {
      if (item.type === "STRUCTURED_WORKOUT" && item.payload.workoutData) {
        // Salva diretamente na API de workouts
        const res = await fetch("/api/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload.workoutData),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        item.status = "COMPLETED";
        succeeded++;
      } else if (item.type === "RAW_TEXT" && item.payload.text) {
        // Primeiro envia para o Gemini interpretar
        const parseRes = await fetch("/api/parse-workout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: item.payload.text }),
        });

        if (!parseRes.ok) {
          const errData = await parseRes.json().catch(() => ({}));
          throw new Error(errData.error || "Falha ao analisar texto com IA.");
        }

        const parsedData = await parseRes.json();
        if (!parsedData.is_workout || !parsedData.exercises?.length) {
          throw new Error(parsedData.feedback_message || "IA não identificou exercícios no texto.");
        }

        // Persiste automaticamente no banco
        const saveRes = await fetch("/api/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: parsedData.date || new Date().toISOString().split("T")[0],
            title: parsedData.title || item.title || "Treino Sincronizado",
            notes: parsedData.notes || "",
            raw_input_text: item.payload.text,
            exercises: parsedData.exercises,
          }),
        });

        if (!saveRes.ok) {
          const saveErr = await saveRes.json().catch(() => ({}));
          throw new Error(saveErr.error || "Erro ao salvar treino interpretado.");
        }

        item.status = "COMPLETED";
        succeeded++;
      }
    } catch (err: unknown) {
      const error = err as Error;
      item.status = "FAILED";
      item.errorMessage = error.message || "Erro desconhecido ao sincronizar.";
      item.retryCount += 1;
      failed++;
    }

    saveOfflineQueue(queue);
    onProgress?.(item);
  }

  return { processed: pendingItems.length, succeeded, failed };
}
