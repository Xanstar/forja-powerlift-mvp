"use client";

const QUEUE_KEY = "forja-offline-queue-v2";
const CONFLICT_KEY = "forja-offline-conflicts-v1";
export const QUEUE_EVENT = "forja-offline-queue-change";

export type PendingLog = {
  plannedSetId: string;
  data: {
    pesoKgReal?: number;
    repeticionesReales?: number;
    rpeReal?: number;
    comentario?: string;
    status?: "completed" | "skipped";
    skipReason?: string;
    clientMutationId: string;
    expectedMutationId?: string;
  };
  athleteRevalidateId?: string;
  timestamp: number;
};

function notifyQueue() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(QUEUE_EVENT));
}

export function encolarSetOffline(item: Omit<PendingLog, "timestamp">) {
  const cola = leerCola().filter(
    (pending) => pending.data.clientMutationId !== item.data.clientMutationId
  );
  cola.push({ ...item, timestamp: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(cola));
  notifyQueue();
}

export function leerCola(): PendingLog[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function leerConflictos(): PendingLog[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(CONFLICT_KEY) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function guardarCola(cola: PendingLog[]) {
  if (cola.length) localStorage.setItem(QUEUE_KEY, JSON.stringify(cola));
  else localStorage.removeItem(QUEUE_KEY);
  notifyQueue();
}

export async function syncPendingQueue(
  queue: PendingLog[],
  registrarSet: (
    plannedSetId: string,
    data: PendingLog["data"],
    athleteId?: string
  ) => Promise<unknown>
) {
  const remaining = [...queue];
  const conflicts: PendingLog[] = [];
  let synced = 0;
  while (remaining.length) {
    const item = remaining[0];
    try {
      const result = await registrarSet(item.plannedSetId, item.data, item.athleteRevalidateId);
      remaining.shift();
      if (
        result &&
        typeof result === "object" &&
        "outcome" in result &&
        result.outcome === "conflict"
      ) {
        conflicts.push(item);
      } else {
        synced += 1;
      }
    } catch {
      break;
    }
  }
  return { remaining, synced, conflicts };
}

export async function sincronizarCola(
  registrarSet: (
    plannedSetId: string,
    data: PendingLog["data"],
    athleteId?: string
  ) => Promise<unknown>
) {
  const result = await syncPendingQueue(leerCola(), registrarSet);
  guardarCola(result.remaining);
  if (result.conflicts.length) {
    localStorage.setItem(
      CONFLICT_KEY,
      JSON.stringify([...leerConflictos(), ...result.conflicts])
    );
    notifyQueue();
  }
  return result;
}
