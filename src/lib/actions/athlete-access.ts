"use server";

import { db } from "@/db";
import { athletes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { establishAthleteAccess } from "@/lib/server-authorization";
import { legacyPinAccessEnabled } from "@/lib/athlete-activation";

export async function verificarPinAtleta(pin: string): Promise<
  | { ok: true; nombre: string }
  | { ok: false; error: string }
> {
  const limpio = pin.trim();
  if (!legacyPinAccessEnabled()) {
    return { ok: false, error: "El acceso por PIN está deshabilitado." };
  }
  if (!/^\d{4,6}$/.test(limpio)) {
    return { ok: false, error: "PIN inválido." };
  }

  const atleta = await db.query.athletes.findFirst({
    where: eq(athletes.accessPin, limpio),
  });

  if (!atleta) {
    return { ok: false, error: "PIN incorrecto, probá de nuevo." };
  }

  await establishAthleteAccess(atleta.id);
  return { ok: true, nombre: atleta.nombre };
}
