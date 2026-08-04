"use server";

import { db } from "@/db";
import {
  programs,
  weeks,
  days,
  exercises,
  plannedSets,
  setLogs,
  executionSets,
  records,
} from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { capitalizarNombre } from "@/lib/nombres";
import {
  requireAthleteResource,
  requireCoachResource,
} from "@/lib/server-authorization";
import {
  assertPlanDeletionAllowed,
  liftForExercise,
  resolvePrescriptionKg,
} from "@/lib/execution";
import {
  assertValidDayCompletionMutationId,
  completeDay,
  type DayCompletionResult,
} from "@/lib/day-completion";

export async function crearPrograma(
  athleteId: string,
  nombre: string,
  semanas = 4,
  fechaInicio?: Date
) {
  await requireCoachResource("athlete", athleteId);
  const latest = await db.query.programs.findFirst({
    where: eq(programs.athleteId, athleteId),
    orderBy: [desc(programs.version)],
  });

  const [p] = await db
    .insert(programs)
    .values({
      athleteId,
      nombre,
      semanas,
      fechaInicio,
      activo: false,
      status: "draft",
      version: (latest?.version ?? 0) + 1,
    })
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

export async function publicarPrograma(programId: string, athleteId: string) {
  await requireCoachResource("athlete", athleteId);
  const program = await db.query.programs.findFirst({
    where: and(eq(programs.id, programId), eq(programs.athleteId, athleteId)),
  });
  if (!program) throw new Error("Programa inexistente.");
  await db.transaction(async (tx) => {
    await tx
      .update(programs)
      .set({ activo: false })
      .where(eq(programs.athleteId, athleteId));
    await tx
      .update(programs)
      .set({ activo: true, status: "published", publishedAt: new Date() })
      .where(eq(programs.id, programId));
  });
  revalidatePath(`/atletas/${athleteId}`);
  revalidatePath("/hoy");
}

export async function crearDia(
  weekId: string,
  athleteId: string,
  nombre: string
) {
  await requireCoachResource("week", weekId, athleteId);
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
  await requireCoachResource("day", dayId, athleteId);
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
  await requireCoachResource("exercise", exerciseId, athleteId);
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
  await requireCoachResource("exercise", exerciseId, athleteId);
  const sourceSets = await db
    .select({ id: plannedSets.id })
    .from(plannedSets)
    .where(eq(plannedSets.exerciseId, exerciseId));
  const evidence = sourceSets.length
    ? await db
        .select({ id: executionSets.id })
        .from(executionSets)
        .where(
          inArray(
            executionSets.sourcePlannedSetId,
            sourceSets.map((set) => set.id)
          )
        )
        .limit(1)
    : [];
  assertPlanDeletionAllowed(evidence.length);
  await db.delete(exercises).where(eq(exercises.id, exerciseId));
  revalidatePath(`/atletas/${athleteId}`);
}

export async function eliminarDia(dayId: string, athleteId: string) {
  await requireCoachResource("day", dayId, athleteId);
  const evidence = await db
    .select({ id: executionSets.id })
    .from(executionSets)
    .where(eq(executionSets.sourceDayId, dayId))
    .limit(1);
  assertPlanDeletionAllowed(evidence.length);
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
    status?: "completed" | "skipped";
    skipReason?: string;
    clientMutationId: string;
    expectedMutationId?: string;
  },
  revalidateAthleteId?: string
) {
  const owner = await requireAthleteResource("plannedSet", plannedSetId);
  if (!data.clientMutationId || data.clientMutationId.length > 100) {
    throw new Error("Identificador de escritura inválido.");
  }
  const retry = await db.query.executionSets.findFirst({
    where: eq(executionSets.clientMutationId, data.clientMutationId),
  });
  if (retry) return { status: retry.status, outcome: "duplicate" as const };
  const currentExecution = await db.query.executionSets.findFirst({
    where: eq(executionSets.sourcePlannedSetId, plannedSetId),
  });
  if (
    currentExecution &&
    currentExecution.clientMutationId !== data.expectedMutationId
  ) {
    return { status: currentExecution.status, outcome: "conflict" as const };
  }

  const source = await db
    .select({
      programId: programs.id,
      programName: programs.nombre,
      weekNumber: weeks.numero,
      dayId: days.id,
      dayName: days.nombre,
      exerciseName: exercises.nombre,
      setNumber: plannedSets.numeroSet,
      targetReps: plannedSets.repeticionesObjetivo,
      targetRpe: plannedSets.rpeObjetivo,
      prescriptionType: plannedSets.pesoTipo,
      weightKg: plannedSets.pesoKg,
      percentageRm: plannedSets.porcentajeRm,
    })
    .from(plannedSets)
    .innerJoin(exercises, eq(plannedSets.exerciseId, exercises.id))
    .innerJoin(days, eq(exercises.dayId, days.id))
    .innerJoin(weeks, eq(days.weekId, weeks.id))
    .innerJoin(programs, eq(weeks.programId, programs.id))
    .where(eq(plannedSets.id, plannedSetId))
    .limit(1);
  if (!source[0]) throw new Error("Serie planificada inexistente.");

  const lift = liftForExercise(source[0].exerciseName);
  const currentRecord = lift
    ? await db.query.records.findFirst({
        where: and(eq(records.athleteId, owner.athleteId), eq(records.lift, lift)),
        orderBy: [desc(records.fecha)],
      })
    : null;
  const prescribedWeightKg =
    source[0].prescriptionType === "absoluto"
      ? source[0].weightKg
      : resolvePrescriptionKg(
          source[0].percentageRm,
          currentRecord?.valorKg ?? null
        );
  const status = data.status ?? "completed";
  if (status === "completed" && data.repeticionesReales == null) {
    throw new Error("Registrá las repeticiones o marcá la serie como omitida.");
  }

  const values = {
      athleteId: owner.athleteId,
      sourceProgramId: source[0].programId,
      sourceDayId: source[0].dayId,
      sourcePlannedSetId: plannedSetId,
      clientMutationId: data.clientMutationId,
      programName: source[0].programName,
      weekNumber: source[0].weekNumber,
      dayName: source[0].dayName,
      exerciseName: source[0].exerciseName,
      setNumber: source[0].setNumber,
      targetReps: source[0].targetReps,
      targetRpe: source[0].targetRpe,
      prescriptionType: source[0].prescriptionType,
      prescribedWeightKg,
      percentageRm: source[0].percentageRm,
      sourceOneRmKg: currentRecord?.valorKg ?? null,
      status,
      skipReason: status === "skipped" ? data.skipReason?.trim() || null : null,
      actualWeightKg: status === "completed" ? data.pesoKgReal ?? null : null,
      actualReps: status === "completed" ? data.repeticionesReales ?? null : null,
      actualRpe: status === "completed" ? data.rpeReal ?? null : null,
      comment: data.comentario?.trim() || null,
      recordedAt: new Date(),
    };
  if (currentExecution) {
    await db
      .update(executionSets)
      .set({
        clientMutationId: data.clientMutationId,
        status,
        skipReason: status === "skipped" ? data.skipReason?.trim() || null : null,
        actualWeightKg: status === "completed" ? data.pesoKgReal ?? null : null,
        actualReps: status === "completed" ? data.repeticionesReales ?? null : null,
        actualRpe: status === "completed" ? data.rpeReal ?? null : null,
        comment: data.comentario?.trim() || null,
        recordedAt: new Date(),
      })
      .where(
        and(
          eq(executionSets.id, currentExecution.id),
          eq(executionSets.clientMutationId, data.expectedMutationId!)
        )
      );
  } else {
    const inserted = await db
      .insert(executionSets)
      .values(values)
      .onConflictDoNothing()
      .returning({ id: executionSets.id });
    if (inserted.length === 0) {
      return { status, outcome: "conflict" as const };
    }
  }

  if (revalidateAthleteId) {
    revalidatePath(`/atletas/${revalidateAthleteId}`);
  }
  return { status, outcome: "applied" as const };
}

export async function completarDia(
  dayId: string,
  clientMutationId: string
): Promise<DayCompletionResult> {
  assertValidDayCompletionMutationId(clientMutationId);
  const owner = await requireAthleteResource("day", dayId);
  const result = await completeDay(db, {
    athleteId: owner.athleteId,
    dayId,
    clientMutationId,
  });
  if (result.outcome !== "conflict") revalidatePath("/hoy");
  return result;
}

export async function duplicarDia(dayId: string, athleteId: string) {
  await requireCoachResource("day", dayId, athleteId);
  const source = await db.query.days.findFirst({
    where: eq(days.id, dayId),
    with: {
      exercises: {
        orderBy: (exercise, { asc }) => [asc(exercise.orden)],
        with: { sets: { orderBy: (set, { asc }) => [asc(set.numeroSet)] } },
      },
    },
  });
  if (!source) throw new Error("Día inexistente.");
  const existing = await db.query.days.findMany({
    where: eq(days.weekId, source.weekId),
  });
  const newDayId = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(days).values({
      id: newDayId,
      weekId: source.weekId,
      nombre: `${source.nombre} copia`,
      orden: existing.length,
      fecha: null,
    });
    for (const exercise of source.exercises) {
      const newExerciseId = crypto.randomUUID();
      await tx.insert(exercises).values({
        id: newExerciseId,
        dayId: newDayId,
        nombre: exercise.nombre,
        orden: exercise.orden,
        descanso: exercise.descanso,
        observaciones: exercise.observaciones,
      });
      if (exercise.sets.length) {
        await tx.insert(plannedSets).values(
          exercise.sets.map((set) => ({
            exerciseId: newExerciseId,
            numeroSet: set.numeroSet,
            repeticionesObjetivo: set.repeticionesObjetivo,
            pesoTipo: set.pesoTipo,
            pesoKg: set.pesoKg,
            porcentajeRm: set.porcentajeRm,
            rpeObjetivo: set.rpeObjetivo,
          }))
        );
      }
    }
  });
  revalidatePath(`/atletas/${athleteId}`);
}
