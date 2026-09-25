import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";

// In-memory mock for localStorage and window in Node environment
const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => storageMap.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storageMap.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    storageMap.delete(key);
  }),
  clear: vi.fn(() => {
    storageMap.clear();
  }),
};

beforeAll(() => {
  vi.stubGlobal("localStorage", localStorageMock);
  vi.stubGlobal("window", {
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal("CustomEvent", class CustomEvent {
    type: string;
    detail?: unknown;
    constructor(type: string, eventInitDict?: { detail?: unknown }) {
      this.type = type;
      this.detail = eventInitDict?.detail;
    }
  });
});

import {
  getOfflineQueue,
  saveOfflineQueue,
  enqueueOfflineWorkout,
  removeQueueItem,
  clearCompletedItems,
  getPendingQueueCount,
  processOfflineQueue,
  QueuedWorkoutItem,
} from "../src/lib/offline-sync";

describe("Offline Queue & Synchronization Engine", () => {
  beforeEach(() => {
    storageMap.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    vi.restoreAllMocks();
    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("window", {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it("deve inicializar a fila vazia no primeiro carregamento", () => {
    const queue = getOfflineQueue();
    expect(queue).toEqual([]);
    expect(getPendingQueueCount()).toBe(0);
  });

  it("deve enfileirar um treino de texto livre com status PENDING", () => {
    const item = enqueueOfflineWorkout({
      type: "RAW_TEXT",
      text: "Hoje fiz 1x3 com 140kg supino reto e 3x6 com 115kg",
    });

    expect(item.id).toBeDefined();
    expect(item.type).toBe("RAW_TEXT");
    expect(item.status).toBe("PENDING");
    expect(item.payload.text).toBe("Hoje fiz 1x3 com 140kg supino reto e 3x6 com 115kg");
    expect(item.retryCount).toBe(0);

    const queue = getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].id).toBe(item.id);
    expect(getPendingQueueCount()).toBe(1);
  });

  it("deve enfileirar um treino estruturado completo", () => {
    const item = enqueueOfflineWorkout({
      type: "STRUCTURED_WORKOUT",
      title: "Treino Upper A",
      workoutData: {
        date: "2026-09-25",
        title: "Treino Upper A",
        notes: "Treino offline",
        raw_input_text: "Manual",
        exercises: [
          {
            name: "Supino Reto com Barra",
            target_muscle_group: "Peito",
            category: "COMPOUND",
            sets: [
              {
                set_number: 1,
                set_type: "TOP_SET",
                weight_kg: 140,
                reps: 3,
                rpe: 9,
                rir: null,
                rest_seconds: 180,
                notes: null,
                estimated_1rm: 154,
                volume_load: 420,
              },
            ],
          },
        ],
      },
    });

    expect(item.type).toBe("STRUCTURED_WORKOUT");
    expect(item.title).toBe("Treino Upper A");
    expect(item.payload.workoutData?.exercises.length).toBe(1);
    expect(getOfflineQueue().length).toBe(1);
  });

  it("deve remover um item específico da fila pelo ID", () => {
    const item1 = enqueueOfflineWorkout({ type: "RAW_TEXT", text: "Treino 1" });
    const item2 = enqueueOfflineWorkout({ type: "RAW_TEXT", text: "Treino 2" });

    expect(getOfflineQueue().length).toBe(2);

    removeQueueItem(item1.id);

    const remaining = getOfflineQueue();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(item2.id);
  });

  it("deve limpar apenas itens com status COMPLETED", () => {
    const mockQueue: QueuedWorkoutItem[] = [
      {
        id: "1",
        createdAt: new Date().toISOString(),
        type: "RAW_TEXT",
        title: "Treino 1",
        payload: { text: "t1" },
        status: "COMPLETED",
        retryCount: 0,
      },
      {
        id: "2",
        createdAt: new Date().toISOString(),
        type: "RAW_TEXT",
        title: "Treino 2",
        payload: { text: "t2" },
        status: "PENDING",
        retryCount: 0,
      },
      {
        id: "3",
        createdAt: new Date().toISOString(),
        type: "RAW_TEXT",
        title: "Treino 3",
        payload: { text: "t3" },
        status: "FAILED",
        retryCount: 1,
      },
    ];

    saveOfflineQueue(mockQueue);
    expect(getOfflineQueue().length).toBe(3);

    clearCompletedItems();

    const afterClear = getOfflineQueue();
    expect(afterClear.length).toBe(2);
    expect(afterClear.some((i) => i.id === "1")).toBe(false);
    expect(afterClear.some((i) => i.id === "2")).toBe(true);
    expect(afterClear.some((i) => i.id === "3")).toBe(true);
  });

  it("deve processar a fila e sincronizar treino estruturado com sucesso via mock de API", async () => {
    enqueueOfflineWorkout({
      type: "STRUCTURED_WORKOUT",
      title: "Leg Day",
      workoutData: {
        date: "2026-09-25",
        title: "Leg Day",
        exercises: [],
      },
    });

    // Mock fetch para /api/workouts retornar 200 OK
    const globalFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 10, success: true }),
    });
    vi.stubGlobal("fetch", globalFetch);

    const result = await processOfflineQueue();

    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);

    const queue = getOfflineQueue();
    expect(queue[0].status).toBe("COMPLETED");
  });

  it("deve incrementar retryCount e marcar FAILED quando o envio à API falhar", async () => {
    enqueueOfflineWorkout({
      type: "STRUCTURED_WORKOUT",
      title: "Treino Costas",
      workoutData: {
        date: "2026-09-25",
        title: "Treino Costas",
        exercises: [],
      },
    });

    // Mock fetch com erro 500
    const globalFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Erro interno no servidor de banco de dados" }),
    });
    vi.stubGlobal("fetch", globalFetch);

    const result = await processOfflineQueue();

    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);

    const queue = getOfflineQueue();
    expect(queue[0].status).toBe("FAILED");
    expect(queue[0].retryCount).toBe(1);
    expect(queue[0].errorMessage).toContain("Erro interno");
  });
});
