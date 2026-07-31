import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
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
import { ArrowLeft } from "lucide-react";
import { EvolutionChart } from "@/components/evolution-chart";
import { ultimosRecords } from "@/lib/actions/records";
import { puntajeWilks, puntajeIpfGl, totalDesdeRecords } from "@/lib/scoring";
import { Card } from "@/components/ui/card";

export default async function HistorialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const coachId = (session!.user as { id: string }).id;

  const atleta = await db.query.athletes.findFirst({
    where: and(eq(athletes.id, id), eq(athletes.coachId, coachId)),
  });
  if (!atleta) notFound();

  // Traemos todos los sets registrados de todos los programas del atleta,
  // con el nombre del ejercicio y la fecha, para graficar evolución.
  const rows = await db
    .select({
      ejercicio: exercises.nombre,
      pesoReal: setLogs.pesoKgReal,
      repsReales: setLogs.repeticionesReales,
      rpeReal: setLogs.rpeReal,
      fecha: setLogs.completadoEn,
    })
    .from(setLogs)
    .innerJoin(plannedSets, eq(setLogs.plannedSetId, plannedSets.id))
    .innerJoin(exercises, eq(plannedSets.exerciseId, exercises.id))
    .innerJoin(days, eq(exercises.dayId, days.id))
    .innerJoin(weeks, eq(days.weekId, weeks.id))
    .innerJoin(programs, eq(weeks.programId, programs.id))
    .where(eq(programs.athleteId, id));

  const porEjercicio = new Map<
    string,
    { fecha: string; peso: number }[]
  >();
  for (const r of rows) {
    if (!r.pesoReal || !r.fecha) continue;
    const arr = porEjercicio.get(r.ejercicio) ?? [];
    arr.push({
      fecha: new Date(r.fecha).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
      }),
      peso: r.pesoReal,
    });
    porEjercicio.set(r.ejercicio, arr);
  }

  const ejerciciosConDatos = Array.from(porEjercicio.entries());

  const records = await ultimosRecords(id);
  const total = totalDesdeRecords(
    Object.values(records).map((r) => ({ lift: r.lift, valorKg: r.valorKg }))
  );
  const puedeCalcularScore = total > 0 && atleta.pesoCorporal && atleta.sexo;

  return (
    <div className="max-w-4xl">
      <Link
        href={`/atletas/${id}`}
        className="mb-4 flex items-center gap-1 text-sm text-chalk-muted hover:text-chalk"
      >
        <ArrowLeft size={14} /> {atleta.nombre} {atleta.apellido}
      </Link>

      <h1 className="font-display text-2xl font-bold tracking-tight text-chalk">
        Historial de progreso
      </h1>
      <p className="mt-1 text-sm text-chalk-muted">
        Evolución de cargas registradas por ejercicio.
      </p>

      {puedeCalcularScore && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-chalk-muted">
              Total (S+B+P)
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-chalk">
              {total} kg
            </p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-chalk-muted">
              Puntaje Wilks
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-chalk">
              {puntajeWilks(total, atleta.pesoCorporal!, atleta.sexo!)}
            </p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-chalk-muted">
              IPF GL Points
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-chalk">
              {puntajeIpfGl(total, atleta.pesoCorporal!, atleta.sexo!)}
            </p>
          </Card>
        </div>
      )}

      {ejerciciosConDatos.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border-strong p-12 text-center text-sm text-chalk-muted">
          Todavía no hay entrenamientos registrados para este atleta.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {ejerciciosConDatos.map(([nombre, datos]) => (
            <EvolutionChart key={nombre} nombre={nombre} datos={datos} />
          ))}
        </div>
      )}
    </div>
  );
}
