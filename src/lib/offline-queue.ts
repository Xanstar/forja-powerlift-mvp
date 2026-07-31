"use client";

const QUEUE_KEY = "forja-offline-queue";

type PendingLog = {
  plannedSetId: string;
  data: {
    pesoKgReal?: number;
    repeticionesReales?: number;
    rpeReal?: number;
    comentario?: string;
  };
  athleteRevalidateId?: string;
  timestamp: number;
};

export function encolarSetOffline(item: Omit<PendingLog, "timestamp">) {
  const cola = leerCola();
  cola.push({ ...item, timestamp: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(cola));
}

export function leerCola(): PendingLog[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function limpiarCola() {
  localStorage.removeItem(QUEUE_KEY);
}

export async function sincronizarCola(
  registrarSet: (
    plannedSetId: string,
    data: PendingLog["data"],
    athleteId?: string
  ) => Promise<void>
) {
  const cola = leerCola();
  if (cola.length === 0) return;

  for (const item of cola) {
    try {
      await registrarSet(item.plannedSetId, item.data, item.athleteRevalidateId);
    } catch {
      return; // si falla de nuevo, dejamos el resto en cola para el próximo intento
    }
  }
  limpiarCola();
}
