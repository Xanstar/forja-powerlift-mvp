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
  dayExecutions,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { AthleteHome } from "@/components/athlete-home";
import {
  fechaInicioSemana,
  etiquetaSemana,
} from "@/lib/calendario";
import { normalizarNombre, capitalizarNombre } from "@/lib/nombres";
import { liftForExercise, resolvePrescriptionKg } from "@/lib/execution";

type Athlete = typeof import("@/db/schema").athletes.$inferSelect;

type LogHistorico = {
  dayId: string;
  ejercicio: string;
  peso: number | null;
  reps: number | null;
  fecha: Date | null;
};

export async function AthleteToday({ atleta }: { atleta: Athlete }) {

  const programaActivo = await db.query.programs.findFirst({
    where: and(
      eq(programs.athleteId, atleta.id),
      eq(programs.activo, true),
      eq(programs.status, "published")
    ),
    with: {
      weeks: {
        orderBy: (w, { asc }) => [asc(w.numero)],
        with: {
          days: {
            orderBy: (d, { asc }) => [asc(d.orden)],
            with: {
              exercises: {
                orderBy: (e, { asc }) => [asc(e.orden)],
                with: {
                  sets: {
                    orderBy: (s, { asc }) => [asc(s.numeroSet)],
                    with: { logs: true },
                  },
                },
              },
              completions: true,
            },
          },
        },
      },
    },
  });

  const [executionRows, completedDays, recordRows] = await Promise.all([
    db.query.executionSets.findMany({
      where: eq(executionSets.athleteId, atleta.id),
      orderBy: [desc(executionSets.recordedAt)],
    }),
    db.query.dayExecutions.findMany({
      where: eq(dayExecutions.athleteId, atleta.id),
    }),
    db.query.records.findMany({
      where: eq(records.athleteId, atleta.id),
      orderBy: [desc(records.fecha)],
    }),
  ]);
  const executionBySet = new Map(
    executionRows.map((row) => [row.sourcePlannedSetId, row])
  );
  const completedDayIds = new Set(completedDays.map((row) => row.sourceDayId));
  const currentRecords = new Map<string, number>();
  for (const record of recordRows) {
    if (!currentRecords.has(record.lift)) currentRecords.set(record.lift, record.valorKg);
  }

  // Historial inmutable para el contexto de la última sesión del ejercicio.
  const logsHistoricos: LogHistorico[] = await db
    .select({
      dayId: executionSets.sourceDayId,
      ejercicio: executionSets.exerciseName,
      peso: executionSets.actualWeightKg,
      reps: executionSets.actualReps,
      fecha: executionSets.recordedAt,
    })
    .from(executionSets)
    .where(eq(executionSets.athleteId, atleta.id));

  // Última sesión (día) de un ejercicio, excluyendo el día actual.
  // Los ejercicios se asocian por nombre normalizado (sin mayúsculas ni
  // espacios extra): "SENTADILLA", "Sentadilla" y "sentadilla " son lo mismo.
  function ultimaVezDe(
    nombreEjercicio: string,
    dayIdActual: string
  ): { series: number; reps: number; peso: number | null } | null {
    const objetivo = normalizarNombre(nombreEjercicio);
    const porDia = new Map<string, LogHistorico[]>();
    for (const l of logsHistoricos) {
      if (
        l.peso == null ||
        l.fecha == null ||
        normalizarNombre(l.ejercicio) !== objetivo ||
        l.dayId === dayIdActual
      ) {
        continue;
      }
      const arr = porDia.get(l.dayId) ?? [];
      arr.push(l);
      porDia.set(l.dayId, arr);
    }
    if (porDia.size === 0) return null;

    let mejor:
      | { fecha: Date; series: number; reps: number; peso: number }
      | null = null;
    for (const arr of porDia.values()) {
      const ordenados = [...arr].sort(
        (a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0)
      );
      const sets = ordenados.length;
      const totalReps = ordenados.reduce((acc, s) => acc + (s.reps ?? 0), 0);
      const reps = sets ? Math.round(totalReps / sets) : 0;
      const primerFecha = ordenados[0].fecha!;
      if (!mejor || primerFecha > mejor.fecha) {
        mejor = {
          fecha: primerFecha,
          series: sets,
          reps,
          peso: ordenados[0].peso!,
        };
      }
    }
    return mejor
      ? { series: mejor.series, reps: mejor.reps, peso: mejor.peso }
      : null;
  }

  const semanasPrograma = programaActivo?.weeks ?? [];
  const fechaInicioPrograma = programaActivo?.fechaInicio ?? null;
  const dias = semanasPrograma.flatMap((semana) => {
    const fechaSemana = fechaInicioSemana(fechaInicioPrograma, semana.numero);
    return semana.days.map((dia) => ({
      id: dia.id,
      nombre: capitalizarNombre(dia.nombre),
      semanaNumero: semana.numero,
      etiquetaSemana: etiquetaSemana(semana.numero, fechaSemana),
      completado:
        completedDayIds.has(dia.id) || dia.completions.length > 0,
      exercises: dia.exercises.map((ex) => ({
        id: ex.id,
        nombre: capitalizarNombre(ex.nombre),
        descanso: ex.descanso,
        observaciones: ex.observaciones,
        ultimaVez: ultimaVezDe(ex.nombre, dia.id),
        sets: ex.sets.map((s) => {
          const execution = executionBySet.get(s.id);
          const lift = liftForExercise(ex.nombre);
          const sourceOneRmKg = lift ? currentRecords.get(lift) ?? null : null;
          const resolvedWeightKg =
            execution?.prescribedWeightKg ??
            (s.pesoTipo === "porcentaje_rm"
              ? resolvePrescriptionKg(s.porcentajeRm, sourceOneRmKg)
              : s.pesoKg);
          return {
            id: s.id,
            numeroSet: s.numeroSet,
            repeticionesObjetivo: s.repeticionesObjetivo,
            pesoTipo: s.pesoTipo,
            pesoKg: s.pesoKg,
            porcentajeRm: s.porcentajeRm,
            resolvedWeightKg,
            sourceOneRmKg,
            rpeObjetivo: s.rpeObjetivo,
            logs: execution
              ? [
                  {
                    id: execution.id,
                    pesoKgReal: execution.actualWeightKg,
                    repeticionesReales: execution.actualReps,
                    rpeReal: execution.actualRpe,
                    status: execution.status,
                    skipReason: execution.skipReason,
                    clientMutationId: execution.clientMutationId,
                  },
                ]
              : s.logs.map((l) => ({
                  id: l.id,
                  pesoKgReal: l.pesoKgReal,
                  repeticionesReales: l.repeticionesReales,
                  rpeReal: l.rpeReal,
                  status: "completed" as const,
                  skipReason: null,
                  clientMutationId: `legacy-${l.id}`,
                })),
          };
        }),
      })),
    }));
  });

  const semanas = semanasPrograma
    .map((semana) => {
      const fechaSemana = fechaInicioSemana(fechaInicioPrograma, semana.numero);
      const diasSemana = dias.filter((d) => d.semanaNumero === semana.numero);
      return {
        numero: semana.numero,
        etiqueta: etiquetaSemana(semana.numero, fechaSemana),
        completados: diasSemana.filter((d) => d.completado).length,
        dias: diasSemana,
      };
    })
    .filter((s) => s.dias.length > 0);

  const totalDias = dias.length;
  const completadosTotal = dias.filter((d) => d.completado).length;
  const proximoDiaId =
    dias.find((d) => !d.completado)?.id ?? dias[0]?.id ?? null;

  return (
    <AthleteHome
      nombre={atleta.nombre}
      semanas={semanas}
      proximoDiaId={proximoDiaId}
      totalDias={totalDias}
      completadosTotal={completadosTotal}
    />
  );
}
