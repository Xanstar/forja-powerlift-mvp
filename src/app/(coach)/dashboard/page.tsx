import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  athletes,
  days,
  dayExecutions,
  executionSets,
  exercises,
  plannedSets,
  programs,
  weeks,
} from "@/db/schema";
import { and, eq, lt } from "drizzle-orm";
import { marcasDeCoach, LIFTS } from "@/lib/queries";

type QueueItem = {
  key: string;
  title: string;
  detail: string;
  href: string;
  action: string;
  status: "Revisar" | "Pendiente";
};

export default async function DashboardPage() {
  const session = await auth();
  const coachId = (session!.user as { id: string }).id;
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);

  const [coachAthletes, marks, plannedRows, executedRows, completedRows, scheduledRows] =
    await Promise.all([
      db.query.athletes.findMany({
        where: eq(athletes.coachId, coachId),
        orderBy: (athlete, { asc }) => [asc(athlete.nombre)],
      }),
      marcasDeCoach(coachId),
      db
        .select({
          dayId: days.id,
          setId: plannedSets.id,
          athleteId: athletes.id,
          athleteName: athletes.nombre,
          athleteLastName: athletes.apellido,
          dayName: days.nombre,
        })
        .from(plannedSets)
        .innerJoin(exercises, eq(plannedSets.exerciseId, exercises.id))
        .innerJoin(days, eq(exercises.dayId, days.id))
        .innerJoin(weeks, eq(days.weekId, weeks.id))
        .innerJoin(programs, eq(weeks.programId, programs.id))
        .innerJoin(athletes, eq(programs.athleteId, athletes.id))
        .where(
          and(
            eq(athletes.coachId, coachId),
            eq(programs.activo, true),
            eq(programs.status, "published")
          )
        ),
      db
        .select({ dayId: executionSets.sourceDayId, athleteId: executionSets.athleteId })
        .from(executionSets),
      db
        .select({ dayId: dayExecutions.sourceDayId })
        .from(dayExecutions),
      db
        .select({
          dayId: days.id,
          dayName: days.nombre,
          date: days.fecha,
          athleteId: athletes.id,
          athleteName: athletes.nombre,
          athleteLastName: athletes.apellido,
        })
        .from(days)
        .innerJoin(weeks, eq(days.weekId, weeks.id))
        .innerJoin(programs, eq(weeks.programId, programs.id))
        .innerJoin(athletes, eq(programs.athleteId, athletes.id))
        .where(
          and(
            eq(athletes.coachId, coachId),
            eq(programs.activo, true),
            eq(programs.status, "published"),
            lt(days.fecha, tomorrow)
          )
        ),
    ]);

  const completed = new Set(completedRows.map((row) => row.dayId));
  const plannedByDay = new Map<string, (typeof plannedRows)[number][]>();
  for (const row of plannedRows) {
    plannedByDay.set(row.dayId, [...(plannedByDay.get(row.dayId) ?? []), row]);
  }
  const executedCount = new Map<string, number>();
  for (const row of executedRows) {
    executedCount.set(row.dayId, (executedCount.get(row.dayId) ?? 0) + 1);
  }

  const queue: QueueItem[] = [];
  const queuedDays = new Set<string>();
  for (const [dayId, sets] of plannedByDay) {
    const count = executedCount.get(dayId) ?? 0;
    if (count > 0 && count < sets.length && !completed.has(dayId)) {
      const source = sets[0];
      queue.push({
        key: `incomplete-${dayId}`,
        title: "Sesión incompleta",
        detail: `${source.athleteName} ${source.athleteLastName} · ${source.dayName} · ${count} de ${sets.length} series registradas.`,
        href: `/atletas/${source.athleteId}/historial`,
        action: "Revisar sesión",
        status: "Revisar",
      });
      queuedDays.add(dayId);
    }
  }
  for (const row of scheduledRows) {
    if (completed.has(row.dayId) || queuedDays.has(row.dayId)) continue;
    queue.push({
      key: `missed-${row.dayId}`,
      title: `${row.athleteName} ${row.athleteLastName} · ${row.dayName}`,
      detail: `${row.date?.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })} · sin cierre de sesión.`,
      href: `/atletas/${row.athleteId}`,
      action: "Revisar programa",
      status: "Pendiente",
    });
  }
  for (const athlete of coachAthletes) {
    if (athlete.invitacionEnviadaAt && !athlete.telefonoVerificadoAt) {
      queue.push({
        key: `access-${athlete.id}`,
        title: `${athlete.nombre} ${athlete.apellido}`,
        detail: "Invitación enviada; activación pendiente.",
        href: `/atletas/${athlete.id}`,
        action: "Revisar acceso",
        status: "Pendiente",
      });
    }
    const athleteMarks = marks.get(athlete.id) ?? {};
    if (athlete.estado === "activo" && LIFTS.some((lift) => !athleteMarks[lift])) {
      queue.push({
        key: `marks-${athlete.id}`,
        title: `${athlete.nombre} ${athlete.apellido}`,
        detail: "Falta al menos una marca para resolver prescripciones por %1RM.",
        href: "/marcas",
        action: "Completar marcas",
        status: "Pendiente",
      });
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-end justify-between gap-4 border-b border-chalk pb-5">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-[-0.04em] text-chalk">
            Decisiones pendientes
          </h1>
          <p className="mt-2 text-sm text-chalk-muted">
            {queue.length === 0
              ? "No hay desvíos respaldados por los registros actuales."
              : `${queue.length} asunto${queue.length === 1 ? "" : "s"} para revisar.`}
          </p>
        </div>
        {queue[0] && (
          <Link href={queue[0].href} className="inline-flex min-h-11 items-center bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover">
            {queue[0].action}
          </Link>
        )}
      </div>

      {queue.length === 0 ? (
        <div className="competition-sheet mt-6 border-y border-success p-6">
          <p className="font-semibold text-success">Sin pendientes verificables</p>
          <p className="mt-1 text-sm text-chalk-muted">La cola se completa sólo con fechas, series, marcas y accesos registrados.</p>
        </div>
      ) : (
        <ol className="mt-6 divide-y divide-border-strong border-y border-chalk bg-surface">
          {queue.map((item, index) => (
            <li key={item.key} className="grid gap-3 px-4 py-5 sm:grid-cols-[2rem_1fr_auto] sm:items-center">
              <span className="data-number text-xl text-chalk-muted">{index + 1}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-chalk">{item.title}</h2>
                  <span className={item.status === "Revisar" ? "competition-stamp" : "text-xs font-semibold text-steel"}>{item.status}</span>
                </div>
                <p className="mt-1 text-sm text-chalk-muted">{item.detail}</p>
              </div>
              <Link href={item.href} className="inline-flex min-h-11 items-center justify-center border border-border-strong px-3 text-sm font-semibold text-chalk hover:border-chalk">
                {item.action}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
