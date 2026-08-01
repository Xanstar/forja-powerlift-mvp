"use server";

import { db } from "@/db";
import { athletes, records } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { LIFTS, type Lift } from "@/lib/queries";
import {
  requireCoachId,
  requireCoachResourceAs,
} from "@/lib/server-authorization";

export type FilaMarca = {
  athleteId: string;
  peso: string;
  sentadilla: string;
  banca: string;
  peso_muerto: string;
  tipo: "real" | "estimado";
};

export type ResultadoMarcas = {
  guardadas: number;
  atletas: number;
};

function parseKg(v: string): number | null {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function guardarMarcas(
  fecha: string,
  filas: FilaMarca[]
): Promise<ResultadoMarcas> {
  const coachId = await requireCoachId();

  const fechaDate = fecha ? new Date(`${fecha}T12:00:00`) : new Date();

  const procesables = filas.filter((f) => {
    const tienePeso = parseKg(f.peso) != null;
    return tienePeso || LIFTS.some((lift) => parseKg(f[lift]) != null);
  });
  await Promise.all(
    procesables.map((f) =>
      requireCoachResourceAs(coachId, "athlete", f.athleteId)
    )
  );

  let guardadas = 0;
  let atletasActualizados = 0;

  for (const f of procesables) {
    const peso = parseKg(f.peso);
    const valores: { lift: Lift; valorKg: number }[] = [];
    for (const lift of LIFTS) {
      const kg = parseKg(f[lift]);
      if (kg != null) valores.push({ lift, valorKg: kg });
    }

    if (peso == null && valores.length === 0) continue;

    if (peso != null) {
      await db
        .update(athletes)
        .set({ pesoCorporal: peso })
        .where(eq(athletes.id, f.athleteId));
    }

    if (valores.length > 0) {
      await db.insert(records).values(
        valores.map((v) => ({
          athleteId: f.athleteId,
          lift: v.lift,
          valorKg: v.valorKg,
          tipo: f.tipo,
          fecha: fechaDate,
        }))
      );
      guardadas += valores.length;
    }

    atletasActualizados += 1;
    revalidatePath(`/atletas/${f.athleteId}`);
    revalidatePath(`/atletas/${f.athleteId}/historial`);
  }

  revalidatePath("/marcas");
  revalidatePath("/dashboard");
  revalidatePath("/atletas");
  revalidatePath("/hoy");

  return { guardadas, atletas: atletasActualizados };
}
