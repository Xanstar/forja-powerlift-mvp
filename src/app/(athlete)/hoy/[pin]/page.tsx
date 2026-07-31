import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  athletes,
  programs,
  weeks,
  days,
  exercises,
  plannedSets,
  setLogs,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { AthleteHome } from "@/components/athlete-home";

type LogHistorico = {
  dayId: string;
  ejercicio: string;
  peso: number | null;
  reps: number | null;
  fecha: Date | null;
};

export default async function HoyPage({
  params,
}: {
  params: Promise<{ pin: string }>;
}) {
  const { pin } = await params;

  const atleta = await db.query.athletes.findFirst({
    where: eq(athletes.accessPin, pin),
  });
  if (!atleta) notFound();

  const programaActivo = await db.query.programs.findFirst({
    where: and(eq(programs.athleteId, atleta.id), eq(programs.activo, true)),
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

  // Historial de sets con peso, para el "última vez" contextual por ejercicio.
  const logsHistoricos: LogHistorico[] = await db
    .select({
      dayId: days.id,
      ejercicio: exercises.nombre,
      peso: setLogs.pesoKgReal,
      reps: setLogs.repeticionesReales,
      fecha: setLogs.completadoEn,
    })
    .from(setLogs)
    .innerJoin(plannedSets, eq(setLogs.plannedSetId, plannedSets.id))
    .innerJoin(exercises, eq(plannedSets.exerciseId, exercises.id))
    .innerJoin(days, eq(exercises.dayId, days.id))
    .innerJoin(weeks, eq(days.weekId, weeks.id))
    .innerJoin(programs, eq(weeks.programId, programs.id))
    .where(eq(programs.athleteId, atleta.id));

  // Última sesión (día) de un ejercicio por nombre, excluyendo el día actual.
  // Los ejercicios se asocian por nombre: si el coach cambia el nombre,
  // se pierde el vínculo (comportamiento aceptado en el MVP).
  function ultimaVezDe(
    nombreEjercicio: string,
    dayIdActual: string
  ): { series: number; reps: number; peso: number | null } | null {
    const porDia = new Map<string, LogHistorico[]>();
    for (const l of logsHistoricos) {
      if (
        l.peso == null ||
        l.fecha == null ||
        l.ejercicio !== nombreEjercicio ||
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

  const dias = (programaActivo?.weeks ?? []).flatMap((semana) =>
    semana.days.map((dia) => ({
      id: dia.id,
      nombre: dia.nombre,
      semanaNumero: semana.numero,
      completado: dia.completions.length > 0,
      exercises: dia.exercises.map((ex) => ({
        id: ex.id,
        nombre: ex.nombre,
        descanso: ex.descanso,
        observaciones: ex.observaciones,
        ultimaVez: ultimaVezDe(ex.nombre, dia.id),
        sets: ex.sets.map((s) => ({
          id: s.id,
          numeroSet: s.numeroSet,
          repeticionesObjetivo: s.repeticionesObjetivo,
          pesoTipo: s.pesoTipo,
          pesoKg: s.pesoKg,
          porcentajeRm: s.porcentajeRm,
          rpeObjetivo: s.rpeObjetivo,
          logs: s.logs.map((l) => ({
            id: l.id,
            pesoKgReal: l.pesoKgReal,
            repeticionesReales: l.repeticionesReales,
            rpeReal: l.rpeReal,
          })),
        })),
      })),
    }))
  );

  return (
    <AthleteHome nombre={atleta.nombre} pin={pin} diasIniciales={dias} />
  );
}
