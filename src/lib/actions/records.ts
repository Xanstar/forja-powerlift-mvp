"use server";

import { db } from "@/db";
import { records, athletes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function crearRecord(athleteId: string, formData: FormData) {
  const lift = formData.get("lift") as "sentadilla" | "banca" | "peso_muerto";
  const valorKg = parseFloat(formData.get("valorKg") as string);
  const tipo = formData.get("tipo") as "real" | "estimado";

  await db.insert(records).values({ athleteId, lift, valorKg, tipo });

  // Actualiza el peso corporal si vino junto (opcional, no usado hoy)
  revalidatePath(`/atletas/${athleteId}`);
  revalidatePath(`/atletas/${athleteId}/historial`);
  revalidatePath("/marcas");
  revalidatePath("/dashboard");
}

export async function ultimosRecords(athleteId: string) {
  const todos = await db.query.records.findMany({
    where: eq(records.athleteId, athleteId),
    orderBy: (r, { desc }) => [desc(r.fecha)],
  });

  const porLift: Record<string, (typeof todos)[number]> = {};
  for (const r of todos) {
    if (!porLift[r.lift]) porLift[r.lift] = r;
  }
  return porLift;
}
