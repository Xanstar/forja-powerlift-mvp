import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { athletes, programs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ArrowLeft, Smartphone, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PlanBuilder } from "@/components/plan-builder";
import { RecordForm } from "@/components/record-form";
import { NewProgramForm } from "@/components/new-program-form";
import { ultimosRecords } from "@/lib/actions/records";
import { EditAthleteForm } from "@/components/edit-athlete-form";
import { AthleteInvitation } from "@/components/athlete-invitation";

const LIFT_LABELS: Record<string, string> = {
  sentadilla: "Sentadilla",
  banca: "Press Banca",
  peso_muerto: "Peso Muerto",
};

export default async function AtletaDetallePage({
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

  const programaActivo = await db.query.programs.findFirst({
    where: and(eq(programs.athleteId, id), eq(programs.activo, true)),
    with: {
      weeks: {
        with: {
          days: {
            with: {
              exercises: {
                with: { sets: true },
              },
            },
          },
        },
      },
    },
  });

  const records = await ultimosRecords(id);

  return (
    <div className="max-w-5xl">
      <Link
        href="/atletas"
        className="mb-4 flex items-center gap-1 text-sm text-chalk-muted hover:text-chalk"
      >
        <ArrowLeft size={14} /> Atletas
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-[-0.04em] text-chalk">
            {atleta.nombre} {atleta.apellido}
          </h1>
          <p className="mt-1 text-sm text-chalk-muted">
            {atleta.categoria ?? "Sin categoría"}
            {atleta.pesoCorporal ? ` · ${atleta.pesoCorporal}kg` : ""}
          </p>
        </div>
        <Link
          href={`/atletas/${id}/historial`}
          className="flex min-h-11 items-center gap-1.5 border border-border-strong bg-surface px-3.5 py-2 text-sm font-semibold text-chalk hover:border-chalk hover:bg-surface-hover"
        >
          <TrendingUp size={15} /> Ver historial
        </Link>
      </div>

      <Card className="mt-8 space-y-3 border-y border-steel bg-blue-50">
        <div className="flex items-start gap-3">
          <Smartphone size={18} className="shrink-0 text-steel" />
          <div className="text-sm text-chalk-muted">
            <p>
              WhatsApp:{" "}
              <span className="text-chalk">
                {atleta.telefonoE164 ?? "Sin teléfono"}
              </span>
              {atleta.telefonoVerificadoAt
                ? " · verificado"
                : " · pendiente de verificación"}
            </p>
            <p className="mt-1 text-xs text-chalk-faint">
              El PIN legado sigue disponible durante la transición y puede deshabilitarse por configuración.
            </p>
          </div>
        </div>
        {atleta.telefonoE164 && (
          <AthleteInvitation athleteId={atleta.id} />
        )}
      </Card>

      <section className="mt-8">
        <h2 className="font-display text-base font-semibold text-chalk">
          Récords (1RM)
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(["sentadilla", "banca", "peso_muerto"] as const).map((lift) => (
            <Card key={lift}>
              <p className="text-xs font-medium uppercase tracking-wide text-chalk-muted">
                {LIFT_LABELS[lift]}
              </p>
              <p className="data-number mt-2 text-3xl font-bold text-chalk">
                {records[lift] ? `${records[lift].valorKg} kg` : "—"}
              </p>
              {records[lift] && (
                <p className="mt-0.5 text-xs text-chalk-faint capitalize">
                  {records[lift].tipo}
                </p>
              )}
            </Card>
          ))}
        </div>
        <div className="mt-3">
          <RecordForm athleteId={id} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-base font-semibold text-chalk">
          Planificación
        </h2>

        {!programaActivo ? (
          <Card className="text-center">
            <p className="mb-3 text-sm text-chalk-muted">
              Este atleta todavía no tiene un programa activo.
            </p>
            <NewProgramForm athleteId={id} />
          </Card>
        ) : (
          <>
            <p className="mb-3 text-sm text-chalk-muted">
              Programa activo:{" "}
              <span className="text-chalk">{programaActivo.nombre}</span>
            </p>
            <PlanBuilder
              athleteId={id}
              semanas={programaActivo.weeks}
              semanasTotal={programaActivo.semanas}
              fechaInicio={programaActivo.fechaInicio}
            />
          </>
        )}
      </section>

      <section className="mt-10 border-t border-border pt-6">
        <h2 className="mb-3 font-display text-base font-semibold text-chalk">
          Perfil del atleta
        </h2>
        <EditAthleteForm atleta={atleta} />
      </section>
    </div>
  );
}
