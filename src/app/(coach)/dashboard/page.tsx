import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { athletes, days, dayCompletions, weeks, programs } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Users, CheckCircle2, Clock, ArrowUpRight } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const coachId = (session!.user as { id: string }).id;

  const misAtletas = await db.query.athletes.findMany({
    where: eq(athletes.coachId, coachId),
  });
  const atletasActivos = misAtletas.filter((a) => a.estado === "activo");

  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);

  // Días completados hoy, para cualquier atleta de este entrenador
  const completadosHoy = await db
    .select({ id: dayCompletions.id })
    .from(dayCompletions)
    .innerJoin(days, eq(dayCompletions.dayId, days.id))
    .innerJoin(weeks, eq(days.weekId, weeks.id))
    .innerJoin(programs, eq(weeks.programId, programs.id))
    .innerJoin(athletes, eq(programs.athleteId, athletes.id))
    .where(
      and(
        eq(athletes.coachId, coachId),
        gte(dayCompletions.completadoEn, inicioHoy)
      )
    );

  // Días con fecha de hoy que todavía no fueron completados
  const finHoy = new Date(inicioHoy);
  finHoy.setDate(finHoy.getDate() + 1);

  const diasDeHoy = await db
    .select({ id: days.id })
    .from(days)
    .innerJoin(weeks, eq(days.weekId, weeks.id))
    .innerJoin(programs, eq(weeks.programId, programs.id))
    .innerJoin(athletes, eq(programs.athleteId, athletes.id))
    .where(
      and(
        eq(athletes.coachId, coachId),
        gte(days.fecha, inicioHoy),
        lt(days.fecha, finHoy)
      )
    );

  const pendientesHoy = Math.max(diasDeHoy.length - completadosHoy.length, 0);

  const ultimosAtletas = [...misAtletas]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-2xl font-bold tracking-tight text-chalk">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-chalk-muted">
        Un vistazo rápido a lo que está pasando hoy.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-chalk-muted">
              Atletas activos
            </span>
            <Users size={16} className="text-chalk-faint" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-chalk">
            {atletasActivos.length}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-chalk-muted">
              Entrenamientos pendientes hoy
            </span>
            <Clock size={16} className="text-chalk-faint" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-chalk">
            {pendientesHoy}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-chalk-muted">
              Completados hoy
            </span>
            <CheckCircle2 size={16} className="text-success" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-chalk">
            {completadosHoy.length}
          </p>
        </Card>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-chalk">
            Atletas recientes
          </h2>
          <Link
            href="/atletas"
            className="flex items-center gap-1 text-xs text-chalk-muted hover:text-accent"
          >
            Ver todos <ArrowUpRight size={13} />
          </Link>
        </div>

        {ultimosAtletas.length === 0 ? (
          <Card className="text-center text-sm text-chalk-muted">
            Todavía no cargaste ningún atleta.{" "}
            <Link href="/atletas/nuevo" className="text-accent hover:underline">
              Agregá el primero
            </Link>
            .
          </Card>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-surface">
            {ultimosAtletas.map((a) => (
              <Link
                key={a.id}
                href={`/atletas/${a.id}`}
                className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-surface-hover"
              >
                <div>
                  <p className="text-sm font-medium text-chalk">
                    {a.nombre} {a.apellido}
                  </p>
                  <p className="text-xs text-chalk-muted">
                    {a.categoria ?? "Sin categoría"}
                  </p>
                </div>
                <span
                  className={
                    a.estado === "activo"
                      ? "text-xs text-success"
                      : "text-xs text-chalk-faint"
                  }
                >
                  {a.estado === "activo" ? "Activo" : "Inactivo"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
