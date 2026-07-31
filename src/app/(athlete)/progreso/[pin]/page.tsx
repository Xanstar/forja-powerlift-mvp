import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { athletes, programs, days, weeks, exercises, plannedSets, setLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { EvolutionChart } from "@/components/evolution-chart";
import { Card } from "@/components/ui/card";
import { ultimosRecords } from "@/lib/actions/records";
import { puntajeWilks, puntajeIpfGl, totalDesdeRecords } from "@/lib/scoring";

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

  const atleta = await db.query.athletes.findFirst({
    where: eq(athletes.accessPin, pin),
  });
  if (!atleta) notFound();

  const rows = await db
    .select({
      ejercicio: exercises.nombre,
      pesoReal: setLogs.pesoKgReal,
      fecha: setLogs.completadoEn,
    })
    .from(setLogs)
    .innerJoin(plannedSets, eq(setLogs.plannedSetId, plannedSets.id))
    .innerJoin(exercises, eq(plannedSets.exerciseId, exercises.id))
    .innerJoin(days, eq(exercises.dayId, days.id))
    .innerJoin(weeks, eq(days.weekId, weeks.id))
    .innerJoin(programs, eq(weeks.programId, programs.id))
    .where(eq(programs.athleteId, atleta.id));

  const porEjercicio = new Map<string, { fecha: string; peso: number }[]>();
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

  const records = await ultimosRecords(atleta.id);
  const lifts = ["sentadilla", "banca", "peso_muerto"] as const;
  const total = totalDesdeRecords(
    Object.values(records).map((r) => ({ lift: r.lift, valorKg: r.valorKg }))
  );
  const puedeCalcularScore = total > 0 && atleta.pesoCorporal && atleta.sexo;

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="flex items-center justify-between border-b border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <Dumbbell size={18} className="text-accent" />
          <span className="font-display text-sm font-bold text-chalk">
            Mi progreso
          </span>
        </div>
        <Link
          href={`/hoy/${pin}`}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-chalk-muted transition-colors hover:bg-surface hover:text-chalk"
        >
          <ArrowLeft size={15} />
          Entrenar
        </Link>
      </header>

      <div className="px-4 py-5">
        <h1 className="font-display text-xl font-bold text-chalk">
          {atleta.nombre} {atleta.apellido}
        </h1>
        <p className="mt-1 text-sm text-chalk-muted">
          Así va tu fuerza semana a semana.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-2">
          {lifts.map((lift) => {
            const rec = records[lift];
            return (
              <Card key={lift} className="p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-chalk-muted">
                  {NOMBRES_LIFT[lift]}
                </p>
                <p className="mt-1.5 font-display text-lg font-bold text-chalk">
                  {rec ? `${rec.valorKg} kg` : "—"}
                </p>
                {rec && (
                  <p className="mt-0.5 text-[10px] text-chalk-faint">
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
              <p className="text-[11px] font-medium uppercase tracking-wide text-chalk-muted">
                Total (S+B+P)
              </p>
              <p className="mt-1.5 font-display text-lg font-bold text-chalk">
                {total} kg
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-chalk-muted">
                Wilks
              </p>
              <p className="mt-1.5 font-display text-lg font-bold text-chalk">
                {puntajeWilks(total, atleta.pesoCorporal!, atleta.sexo!)}
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-chalk-muted">
                IPF GL Points
              </p>
              <p className="mt-1.5 font-display text-lg font-bold text-chalk">
                {puntajeIpfGl(total, atleta.pesoCorporal!, atleta.sexo!)}
              </p>
            </Card>
          </div>
        )}

        {ejerciciosConDatos.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border-strong p-10 text-center text-sm text-chalk-muted">
            Todavía no hay entrenamientos registrados. ¡Empezá a loggear y tu
            evolución aparece acá!
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {ejerciciosConDatos.map(([nombre, datos]) => (
              <EvolutionChart key={nombre} nombre={nombre} datos={datos} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
