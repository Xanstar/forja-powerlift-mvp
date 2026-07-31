"use server";

import { db } from "@/db";
import {
  programs,
  weeks,
  days,
  exercises,
  plannedSets,
  dayCompletions,
  setLogs,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { capitalizarNombre } from "@/lib/nombres";

export async function crearPrograma(
  athleteId: string,
  nombre: string,
  semanas = 4,
  fechaInicio?: Date
) {
  // Desactiva programas anteriores: en el MVP solo hay un programa activo por vez
  await db
    .update(programs)
    .set({ activo: false })
    .where(eq(programs.athleteId, athleteId));

  const [p] = await db
    .insert(programs)
    .values({ athleteId, nombre, semanas, fechaInicio })
    .returning();

  // Las semanas se crean con el programa: la duración es finita (1..semanas),
  // el entrenador arma los días dentro de cada semana.
  await db.insert(weeks).values(
    Array.from({ length: semanas }).map((_, i) => ({
      programId: p.id,
      numero: i + 1,
    }))
  );

  revalidatePath(`/atletas/${athleteId}`);
  return p;
}

export async function crearDia(
  weekId: string,
  athleteId: string,
  nombre: string
) {
  const existentes = await db.query.days.findMany({
    where: eq(days.weekId, weekId),
  });
  await db.insert(days).values({
    weekId,
    nombre,
    orden: existentes.length,
  });
  revalidatePath(`/atletas/${athleteId}`);
}

export async function crearEjercicio(
  dayId: string,
  athleteId: string,
  formData: FormData
) {
  const nombre = formData.get("nombre") as string;
  const descanso = formData.get("descanso") as string;
  const observaciones = formData.get("observaciones") as string;

  const existentes = await db.query.exercises.findMany({
    where: eq(exercises.dayId, dayId),
  });

  const [ex] = await db
    .insert(exercises)
    .values({
      dayId,
      // Normalizado para que "SENTADILLA" y "Sentadilla" sean el mismo ejercicio
      nombre: capitalizarNombre(nombre),
      orden: existentes.length,
      descanso: descanso || null,
      observaciones: observaciones || null,
    })
    .returning();

  revalidatePath(`/atletas/${athleteId}`);
  return ex;
}

export async function crearSet(
  exerciseId: string,
  athleteId: string,
  formData: FormData
) {
  const repeticionesObjetivo = parseInt(
    formData.get("repeticionesObjetivo") as string,
    10
  );
  const pesoTipo = formData.get("pesoTipo") as "absoluto" | "porcentaje_rm";
  const pesoKg = formData.get("pesoKg") as string;
  const porcentajeRm = formData.get("porcentajeRm") as string;
  const rpeObjetivo = formData.get("rpeObjetivo") as string;
  const cantidad = parseInt((formData.get("cantidad") as string) || "1", 10);

  const existentes = await db.query.plannedSets.findMany({
    where: eq(plannedSets.exerciseId, exerciseId),
  });

  const nuevos = Array.from({ length: cantidad }).map((_, i) => ({
    exerciseId,
    numeroSet: existentes.length + i + 1,
    repeticionesObjetivo,
    pesoTipo,
    pesoKg: pesoTipo === "absoluto" && pesoKg ? parseFloat(pesoKg) : null,
    porcentajeRm:
      pesoTipo === "porcentaje_rm" && porcentajeRm
        ? parseFloat(porcentajeRm)
        : null,
    rpeObjetivo: rpeObjetivo ? parseFloat(rpeObjetivo) : null,
  }));

  await db.insert(plannedSets).values(nuevos);
  revalidatePath(`/atletas/${athleteId}`);
}

export async function eliminarEjercicio(exerciseId: string, athleteId: string) {
  await db.delete(exercises).where(eq(exercises.id, exerciseId));
  revalidatePath(`/atletas/${athleteId}`);
}

export async function eliminarDia(dayId: string, athleteId: string) {
  await db.delete(days).where(eq(days.id, dayId));
  revalidatePath(`/atletas/${athleteId}`);
}

export async function registrarSet(
  plannedSetId: string,
  data: {
    pesoKgReal?: number;
    repeticionesReales?: number;
    rpeReal?: number;
    comentario?: string;
  },
  revalidateAthleteId?: string
) {
  const existente = await db.query.setLogs.findFirst({
    where: eq(setLogs.plannedSetId, plannedSetId),
    orderBy: [desc(setLogs.completadoEn)],
  });

  if (existente) {
    await db
      .update(setLogs)
      .set({ ...data, completadoEn: new Date() })
      .where(eq(setLogs.id, existente.id));
  } else {
    await db.insert(setLogs).values({
      plannedSetId,
      ...data,
      completadoEn: new Date(),
    });
  }

  if (revalidateAthleteId) {
    revalidatePath(`/atletas/${revalidateAthleteId}`);
  }
}

export async function completarDia(dayId: string, pin: string) {
  await db.insert(dayCompletions).values({ dayId });
  revalidatePath(`/hoy/${pin}`);
}
