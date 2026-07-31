"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { athletes, records } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { LIFTS, type Lift } from "@/lib/queries";

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
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado.");
  const coachId = (session.user as { id: string }).id;

  const fechaDate = fecha ? new Date(`${fecha}T12:00:00`) : new Date();

  let guardadas = 0;
  let atletasActualizados = 0;

  for (const f of filas) {
    const peso = parseKg(f.peso);
    const valores: { lift: Lift; valorKg: number }[] = [];
    for (const lift of LIFTS) {
      const kg = parseKg(f[lift]);
      if (kg != null) valores.push({ lift, valorKg: kg });
    }

    if (peso == null && valores.length === 0) continue;

    const atleta = await db.query.athletes.findFirst({
      where: and(eq(athletes.id, f.athleteId), eq(athletes.coachId, coachId)),
    });
    if (!atleta) continue;

    if (peso != null) {
      await db
        .update(athletes)
        .set({ pesoCorporal: peso })
        .where(eq(athletes.id, atleta.id));
    }

    if (valores.length > 0) {
      await db.insert(records).values(
        valores.map((v) => ({
          athleteId: atleta.id,
          lift: v.lift,
          valorKg: v.valorKg,
          tipo: f.tipo,
          fecha: fechaDate,
        }))
      );
      guardadas += valores.length;
    }

    atletasActualizados += 1;
    revalidatePath(`/atletas/${atleta.id}`);
    revalidatePath(`/atletas/${atleta.id}/historial`);
  }

  revalidatePath("/marcas");
  revalidatePath("/dashboard");
  revalidatePath("/atletas");
  revalidatePath("/hoy");

  return { guardadas, atletas: atletasActualizados };
}
