import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { athletes, days, dayCompletions, weeks, programs } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import {
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Crosshair,
  FileUp,
} from "lucide-react";
import { marcasDeCoach, LIFTS } from "@/lib/queries";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();
  const coachId = (session!.user as { id: string }).id;

  const misAtletas = await db.query.athletes.findMany({
    where: eq(athletes.coachId, coachId),
  });
  const atletasActivos = misAtletas.filter((a) => a.estado === "activo");

  const marcas = await marcasDeCoach(coachId);
  const atletasSinMarcaCompleta = atletasActivos.filter((a) => {
    const m = marcas.get(a.id) ?? {};
    return LIFTS.some((l) => m[l] == null);
  });

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
    <div className="max-w-6xl">
      <h1 className="font-display text-4xl font-bold tracking-[-0.04em] text-chalk">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-chalk-muted">
        Un vistazo rápido a lo que está pasando hoy.
      </p>

      <div className="mt-8 grid grid-cols-2 border-y border-chalk lg:grid-cols-4">
        <Card className="border-0 border-r border-chalk bg-transparent px-0 py-5 pr-4 lg:px-5 lg:first:pl-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-chalk-muted">
              Atletas activos
            </span>
            <Users size={16} className="text-chalk-faint" />
          </div>
          <p className="data-number mt-3 text-5xl font-bold text-chalk">
            {atletasActivos.length}
          </p>
        </Card>

        <Card className="border-0 bg-transparent px-4 py-5 lg:border-r lg:border-chalk lg:px-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-chalk-muted">
              Entrenamientos pendientes hoy
            </span>
            <Clock size={16} className="text-chalk-faint" />
          </div>
          <p className="data-number mt-3 text-5xl font-bold text-chalk">
            {pendientesHoy}
          </p>
        </Card>

        <Card className="border-0 border-r border-t border-chalk bg-transparent px-0 py-5 pr-4 lg:border-t-0 lg:px-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-chalk-muted">
              Completados hoy
            </span>
            <CheckCircle2 size={16} className="text-success" />
          </div>
          <p className="data-number mt-3 text-5xl font-bold text-chalk">
            {completadosHoy.length}
          </p>
        </Card>

        <Card className="border-0 border-t border-chalk bg-transparent px-4 py-5 lg:border-t-0 lg:px-5 lg:last:pr-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-chalk-muted">
              Sin marca completa
            </span>
            <Crosshair size={16} className="text-accent" />
          </div>
          <p className="data-number mt-3 text-5xl font-bold text-chalk">
            {atletasSinMarcaCompleta.length}
          </p>
        </Card>
      </div>

      <section className="mt-10 flex flex-wrap items-center justify-between gap-5 border-y border-accent bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <div className="border border-accent bg-surface p-2.5">
            <Crosshair size={18} className="text-accent" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-chalk">
              Toma de marcas
            </h2>
            <p className="mt-0.5 text-sm text-chalk-muted">
              Pesaje + los tres levantamientos, con Wilks e IPF GL en vivo.
              {atletasSinMarcaCompleta.length > 0 && (
                <>
                  {" "}
                  {atletasSinMarcaCompleta.length} atleta
                  {atletasSinMarcaCompleta.length !== 1 && "s"} sin marcas
                  completas.
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/marcas">
            <Button>Ir a toma de marcas</Button>
          </Link>
          <Link href="/atletas">
            <Button variant="secondary">
              <FileUp size={15} /> Importar desde Excel
            </Button>
          </Link>
        </div>
      </section>

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
          <div className="divide-y divide-border-strong border-y border-chalk bg-surface">
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
