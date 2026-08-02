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
import { publicarPrograma } from "@/lib/actions/planning";
import { Button } from "@/components/ui/button";

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

  const athletePrograms = await db.query.programs.findMany({
    where: eq(programs.athleteId, id),
    orderBy: (program, { desc }) => [desc(program.createdAt)],
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
  const programaActivo =
    athletePrograms.find((program) => program.status === "draft") ??
    athletePrograms.find((program) => program.activo) ??
    null;

  const records = await ultimosRecords(id);

  return (
    <div className="max-w-5xl">
      <Link
        href="/atletas"
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm text-chalk-muted hover:text-chalk"
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

      <details className="mt-8 border-y border-steel bg-blue-50">
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 font-semibold text-chalk">
          <Smartphone size={18} className="text-steel" /> Acceso y activación
          <span className="ml-auto text-xs font-medium text-chalk-muted">
            {atleta.telefonoVerificadoAt ? "Verificado" : "Pendiente"}
          </span>
        </summary>
        <div className="border-t border-steel px-5 py-4 text-sm text-chalk-muted">
          <p>WhatsApp: <span className="text-chalk">{atleta.telefonoE164 ?? "Sin teléfono"}</span></p>
          <p className="mt-1 text-xs">El PIN legado continúa disponible durante la transición.</p>
          {atleta.telefonoE164 && <div className="mt-3"><AthleteInvitation athleteId={atleta.id} /></div>}
        </div>
      </details>

      <section className="mt-8 border-y border-chalk py-5">
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

      <details className="mt-8 border-y border-chalk bg-surface" open={!programaActivo}>
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between px-5 font-display text-lg font-semibold text-chalk">
          Programa
          <span className="text-sm font-normal text-chalk-muted">{programaActivo ? `${programaActivo.nombre} · v${programaActivo.version} · ${programaActivo.status === "draft" ? "Borrador" : "Publicado"}` : "Sin programa activo"}</span>
        </summary>
        <div className="border-t border-chalk p-5">

        {!programaActivo ? (
          <Card className="text-center">
            <p className="mb-3 text-sm text-chalk-muted">
              Este atleta todavía no tiene un programa activo.
            </p>
            <NewProgramForm athleteId={id} />
          </Card>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border-strong pb-4">
              <p className="text-sm text-chalk-muted">
                {programaActivo.status === "draft" ? "Borrador" : "Publicado"}: <span className="text-chalk">{programaActivo.nombre} · versión {programaActivo.version}</span>
              </p>
              {programaActivo.status === "draft" && (
                <form action={publicarPrograma.bind(null, programaActivo.id, id)}>
                  <Button type="submit">Publicar programa</Button>
                </form>
              )}
            </div>
            <PlanBuilder
              athleteId={id}
              semanas={programaActivo.weeks}
              semanasTotal={programaActivo.semanas}
              fechaInicio={programaActivo.fechaInicio}
              readOnly={programaActivo.status === "published"}
            />
            {programaActivo.status === "published" && (
              <details className="mt-4 border-t border-border-strong pt-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-semibold text-steel">
                  Preparar nuevo borrador
                </summary>
                <div className="mt-3"><NewProgramForm athleteId={id} /></div>
              </details>
            )}
          </>
        )}
        </div>
      </details>

      <details className="mt-8 border-y border-chalk bg-surface">
        <summary className="flex min-h-16 cursor-pointer list-none items-center px-5 font-display text-lg font-semibold text-chalk">Perfil y datos</summary>
        <div className="border-t border-chalk p-5"><EditAthleteForm atleta={atleta} /></div>
      </details>
    </div>
  );
}
