import { notFound } from "next/navigation";
import { db } from "@/db";
import { athletes, programs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { AthleteHome } from "@/components/athlete-home";

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
