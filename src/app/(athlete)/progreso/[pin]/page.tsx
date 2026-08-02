import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { executionSets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { EvolutionChart } from "@/components/evolution-chart";
import { Card } from "@/components/ui/card";
import { ultimosRecords } from "@/lib/actions/records";
import { puntajeWilks, puntajeIpfGl, totalDesdeRecords } from "@/lib/scoring";
import { normalizarNombre } from "@/lib/nombres";
import { athleteForAccessPin } from "@/lib/server-authorization";
import { aggregateSessionProgress } from "@/lib/execution";
import { ForjaLogo } from "@/components/forja-logo";
import { ThemeControl } from "@/components/theme-control";

const NOMBRES_LIFT: Record<string, string> = {
  sentadilla: "Sentadilla",
  banca: "Press Banca",
  peso_muerto: "Peso Muerto",
};

export default async function ProgresoPage({
  params,
}: {
  params: Promise<{ pin: string }>;
}) {
  const { pin } = await params;

  const atleta = await athleteForAccessPin(pin);
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
    .where(eq(executionSets.athleteId, atleta.id));

  const sessions = aggregateSessionProgress(rows);
  const porEjercicio = new Map<string, { nombre: string; puntos: { fecha: string; peso: number }[] }>();
  for (const session of sessions) {
    const key = normalizarNombre(session.exerciseName);
    const current = porEjercicio.get(key) ?? { nombre: session.exerciseName, puntos: [] };
    current.puntos.push({
      fecha: session.date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }),
      peso: session.estimatedOneRmKg,
    });
    porEjercicio.set(key, current);
  }
  const ejerciciosConDatos = [...porEjercicio.values()];

  const records = await ultimosRecords(atleta.id);
  const lifts = ["sentadilla", "banca", "peso_muerto"] as const;
  const total = totalDesdeRecords(
    Object.values(records).map((r) => ({ lift: r.lift, valorKg: r.valorKg }))
  );
  const puedeCalcularScore = total > 0 && atleta.pesoCorporal && atleta.sexo;

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="flex items-center justify-between border-b border-chalk bg-surface px-4 py-4">
        <div className="flex items-center gap-2">
          <ForjaLogo className="w-[112px] sm:w-[132px]" />
          <span className="hidden border-l border-border-strong pl-2 text-sm font-semibold text-chalk-muted sm:inline">Mi progreso</span>
        </div>
        <div className="flex items-center gap-1"><ThemeControl /><Link
          href={`/hoy/${pin}`}
          className="flex min-h-11 items-center gap-1.5 px-2.5 py-1.5 text-sm font-semibold text-chalk-muted transition-colors hover:bg-surface-hover hover:text-chalk"
        >
          <ArrowLeft size={15} />
          Entrenar
        </Link></div>
      </header>

      <div className="px-4 py-5">
        <h1 className="font-display text-3xl font-bold tracking-[-0.04em] text-chalk">
          {atleta.nombre} {atleta.apellido}
        </h1>
        <p className="mt-1 text-sm text-chalk-muted">
          Mejor e1RM por sesión, calculado con la fórmula de Epley.
        </p>

        <div className="mt-6 grid grid-cols-3 border-y border-on-brand-border bg-brand-canvas text-on-brand">
          {lifts.map((lift) => {
            const rec = records[lift];
            return (
              <Card key={lift} className="border-0 border-r border-on-brand-border bg-transparent p-3 last:border-r-0">
                <p className="text-xs font-medium uppercase tracking-wide text-brand-mist">
                  {NOMBRES_LIFT[lift]}
                </p>
                <p className="data-number mt-1.5 text-2xl font-bold text-on-brand">
                  {rec ? `${rec.valorKg} kg` : "—"}
                </p>
                {rec && (
                  <p className="mt-0.5 text-xs text-brand-mist">
                    {rec.tipo === "real" ? "real" : "estimado"}
                  </p>
                )}
              </Card>
            );
          })}
        </div>

        {puedeCalcularScore && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Card className="p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-chalk-muted">
                Total (S+B+P)
              </p>
              <p className="mt-1.5 font-display text-lg font-bold text-chalk">
                {total} kg
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-chalk-muted">
                Wilks
              </p>
              <p className="mt-1.5 font-display text-lg font-bold text-chalk">
                {puntajeWilks(total, atleta.pesoCorporal!, atleta.sexo!)}
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-chalk-muted">
                Puntos IPF GL
              </p>
              <p className="mt-1.5 font-display text-lg font-bold text-chalk">
                {puntajeIpfGl(total, atleta.pesoCorporal!, atleta.sexo!)}
              </p>
            </Card>
          </div>
        )}

        {ejerciciosConDatos.length === 0 ? (
          <div className="mt-8 border border-dashed border-border-strong p-10 text-center text-sm text-chalk-muted">
            Todavía no hay sesiones registradas con carga y repeticiones.
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {ejerciciosConDatos.map(({ nombre, puntos }) => (
              <EvolutionChart key={nombre} nombre={nombre} datos={puntos} metricLabel="e1RM de sesión" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
