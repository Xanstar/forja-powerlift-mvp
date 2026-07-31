import { db } from "@/db";
import { athletes, records } from "@/db/schema";
import { eq } from "drizzle-orm";

export const LIFTS = ["sentadilla", "banca", "peso_muerto"] as const;
export type Lift = (typeof LIFTS)[number];

export type MarcaResumen = {
  valorKg: number;
  tipo: "real" | "estimado";
  fecha: Date;
};

/** Última marca (1RM) por levantamiento, para cada atleta del entrenador. */
export async function marcasDeCoach(
  coachId: string
): Promise<Map<string, Partial<Record<Lift, MarcaResumen>>>> {
  const filas = await db
    .select({
      athleteId: records.athleteId,
      lift: records.lift,
      valorKg: records.valorKg,
      tipo: records.tipo,
      fecha: records.fecha,
    })
    .from(records)
    .innerJoin(athletes, eq(records.athleteId, athletes.id))
    .where(eq(athletes.coachId, coachId))
    .orderBy(records.fecha);

  const porAtleta = new Map<string, Partial<Record<Lift, MarcaResumen>>>();
  for (const f of filas) {
    const actuales = porAtleta.get(f.athleteId) ?? {};
    actuales[f.lift] = { valorKg: f.valorKg, tipo: f.tipo, fecha: f.fecha };
    porAtleta.set(f.athleteId, actuales);
  }
  return porAtleta;
}
