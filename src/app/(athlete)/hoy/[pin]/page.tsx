import { notFound } from "next/navigation";
import { db } from "@/db";
import { athletes, programs, dayCompletions, days as daysTable } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { Dumbbell } from "lucide-react";
import { WorkoutView } from "@/components/workout-view";

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
                with: { sets: { with: { logs: true } } },
              },
              completions: true,
            },
          },
        },
      },
    },
  });

  // Encontrar el primer día sin completar del programa activo
  let proximoDia: (NonNullable<typeof programaActivo>["weeks"][number]["days"][number] & {
    semanaNumero: number;
  }) | null = null;
  outer: if (programaActivo) {
    for (const semana of programaActivo.weeks) {
      for (const dia of semana.days) {
        if (dia.completions.length === 0) {
          proximoDia = { ...dia, semanaNumero: semana.numero };
          break outer;
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="flex items-center gap-2 border-b border-border px-4 py-4">
        <Dumbbell size={18} className="text-accent" />
        <span className="font-display text-sm font-bold text-chalk">
          Hola, {atleta.nombre}
        </span>
      </header>

      {!programaActivo || !proximoDia ? (
        <div className="px-4 py-16 text-center text-sm text-chalk-muted">
          No tenés entrenamientos pendientes por ahora. ¡Buen descanso! 💪
        </div>
      ) : (
        <WorkoutView
          dia={proximoDia}
          semanaNumero={proximoDia.semanaNumero}
          pin={pin}
        />
      )}
    </div>
  );
}
