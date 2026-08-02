import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  athletes,
  executionSets,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { EvolutionChart } from "@/components/evolution-chart";
import { ultimosRecords } from "@/lib/actions/records";
import { puntajeWilks, puntajeIpfGl, totalDesdeRecords } from "@/lib/scoring";
import { Card } from "@/components/ui/card";
import { aggregateSessionProgress } from "@/lib/execution";
import { capitalizarNombre, normalizarNombre } from "@/lib/nombres";

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

  const rows = await db
    .select({
      sourceDayId: executionSets.sourceDayId,
      exerciseName: executionSets.exerciseName,
      actualWeightKg: executionSets.actualWeightKg,
      actualReps: executionSets.actualReps,
      status: executionSets.status,
      recordedAt: executionSets.recordedAt,
    })
    .from(executionSets)
    .where(eq(executionSets.athleteId, id));

  const porEjercicio = new Map<
    string,
    { fecha: string; peso: number }[]
  >();
  for (const session of aggregateSessionProgress(rows)) {
    const key = normalizarNombre(session.exerciseName);
    const arr = porEjercicio.get(key) ?? [];
    arr.push({
      fecha: session.date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
      }),
      peso: session.estimatedOneRmKg,
    });
    porEjercicio.set(key, arr);
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
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm text-chalk-muted hover:text-chalk"
      >
        <ArrowLeft size={14} /> {atleta.nombre} {atleta.apellido}
      </Link>

      <h1 className="font-display text-4xl font-bold tracking-[-0.04em] text-chalk">
        Historial de progreso
      </h1>
      <p className="mt-1 text-sm text-chalk-muted">
        Mejor e1RM por sesión, calculado con la fórmula de Epley.
      </p>

      {puedeCalcularScore && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-chalk-muted">
              Total (S+B+P)
            </p>
            <p className="data-number mt-2 text-3xl font-bold text-chalk">
              {total} kg
            </p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-chalk-muted">
              Puntaje Wilks
            </p>
            <p className="data-number mt-2 text-3xl font-bold text-chalk">
              {puntajeWilks(total, atleta.pesoCorporal!, atleta.sexo!)}
            </p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-chalk-muted">
              Puntos IPF GL
            </p>
            <p className="data-number mt-2 text-3xl font-bold text-chalk">
              {puntajeIpfGl(total, atleta.pesoCorporal!, atleta.sexo!)}
            </p>
          </Card>
        </div>
      )}

      {ejerciciosConDatos.length === 0 ? (
        <div className="mt-8 border border-dashed border-border-strong p-12 text-center text-sm text-chalk-muted">
          Todavía no hay entrenamientos registrados para este atleta.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {ejerciciosConDatos.map(([nombre, datos]) => (
            <EvolutionChart key={nombre} nombre={capitalizarNombre(nombre)} datos={datos} metricLabel="e1RM de sesión" />
          ))}
        </div>
      )}
    </div>
  );
}
