"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Dumbbell, LineChart, LogOut } from "lucide-react";
import { WorkoutView } from "@/components/workout-view";
import { cn } from "@/lib/utils";

export type DiaAtleta = {
  id: string;
  nombre: string;
  semanaNumero: number;
  completado: boolean;
  exercises: {
    id: string;
    nombre: string;
    descanso: string | null;
    observaciones: string | null;
    ultimaVez: {
      series: number;
      reps: number;
      peso: number | null;
    } | null;
    sets: {
      id: string;
      numeroSet: number;
      repeticionesObjetivo: number;
      pesoTipo: "absoluto" | "porcentaje_rm";
      pesoKg: number | null;
      porcentajeRm: number | null;
      rpeObjetivo: number | null;
      logs: {
        id: string;
        pesoKgReal: number | null;
        repeticionesReales: number | null;
        rpeReal: number | null;
      }[];
    }[];
  }[];
};

export function AthleteHome({
  nombre,
  pin,
  diasIniciales,
}: {
  nombre: string;
  pin: string;
  diasIniciales: DiaAtleta[];
}) {
  const [dias, setDias] = useState(diasIniciales);
  const pendienteInicial =
    dias.find((d) => !d.completado)?.id ?? dias[0]?.id ?? null;
  const [seleccionado, setSeleccionado] = useState<string | null>(
    pendienteInicial
  );

  const diaActual = dias.find((d) => d.id === seleccionado) ?? null;

  function marcarCompletado(dayId: string) {
    setDias((ds) =>
      ds.map((d) => (d.id === dayId ? { ...d, completado: true } : d))
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="flex items-center justify-between border-b border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <Dumbbell size={18} className="text-accent" />
          <span className="font-display text-sm font-bold text-chalk">
            Hola, {nombre}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/progreso/${pin}`}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-chalk-muted transition-colors hover:bg-surface hover:text-chalk"
          >
            <LineChart size={15} />
            Progreso
          </Link>
          <Link
            href="/hoy"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-chalk-muted transition-colors hover:bg-surface hover:text-chalk"
          >
            <LogOut size={15} />
            Salir
          </Link>
        </div>
      </header>

      {dias.length === 0 ? (
        <div className="px-4 py-16 text-center text-sm text-chalk-muted">
          Todavía no tenés un programa asignado. Hablá con tu entrenador.
        </div>
      ) : (
        <div>
          <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
            <div className="relative">
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {dias.map((dia) => (
                  <button
                    key={dia.id}
                    onClick={() => setSeleccionado(dia.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                      seleccionado === dia.id
                        ? "border-accent bg-accent text-white"
                        : "border-border bg-surface text-chalk-muted hover:text-chalk"
                    )}
                  >
                    {dia.completado ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          seleccionado === dia.id ? "bg-white" : "bg-accent"
                        )}
                      />
                    )}
                    Sem {dia.semanaNumero} · {dia.nombre}
                  </button>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent" />
            </div>
          </div>

          <div className="px-4 py-5">
            {diaActual ? (
              <WorkoutView
                dia={diaActual}
                semanaNumero={diaActual.semanaNumero}
                pin={pin}
                completado={diaActual.completado}
                onCompletado={() => marcarCompletado(diaActual.id)}
              />
            ) : (
              <div className="px-4 py-16 text-center text-sm text-chalk-muted">
                No tenés entrenamientos pendientes por ahora. ¡Buen descanso! 💪
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
