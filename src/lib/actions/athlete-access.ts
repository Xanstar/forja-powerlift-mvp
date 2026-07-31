"use server";

import { db } from "@/db";
import { athletes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function verificarPinAtleta(pin: string): Promise<
  | { ok: true; nombre: string }
  | { ok: false; error: string }
> {
  const limpio = pin.trim();
  if (!/^\d{4,6}$/.test(limpio)) {
    return { ok: false, error: "PIN inválido." };
  }

  const atleta = await db.query.athletes.findFirst({
    where: eq(athletes.accessPin, limpio),
  });

  if (!atleta) {
    return { ok: false, error: "PIN incorrecto, probá de nuevo." };
  }

  return { ok: true, nombre: atleta.nombre };
}
