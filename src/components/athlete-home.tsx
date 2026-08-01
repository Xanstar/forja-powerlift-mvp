"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  LineChart,
  LogOut,
  Trophy,
} from "lucide-react";
import { WorkoutView } from "@/components/workout-view";
import { cn } from "@/lib/utils";

export type DiaAtleta = {
  id: string;
  nombre: string;
  semanaNumero: number;
  etiquetaSemana: string;
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

export type SemanaAtleta = {
  numero: number;
  etiqueta: string;
  completados: number;
  dias: DiaAtleta[];
};

export function AthleteHome({
  nombre,
  pin,
  semanas,
  proximoDiaId,
  totalDias,
  completadosTotal,
}: {
  nombre: string;
  pin: string;
  semanas: SemanaAtleta[];
  proximoDiaId: string | null;
  totalDias: number;
  completadosTotal: number;
}) {
  const [semanasState, setSemanasState] = useState(semanas);
  const [seleccionado, setSeleccionado] = useState<string | null>(proximoDiaId);

  const todosDias = semanasState.flatMap((s) => s.dias);
  const diaActual = todosDias.find((d) => d.id === seleccionado) ?? null;
  const semanaSeleccionada =
    semanasState.find((s) => s.dias.some((d) => d.id === seleccionado)) ??
    semanasState[0] ??
    null;
  const proximo =
    todosDias.find((d) => !d.completado) ??
    (todosDias.length > 0 ? todosDias[todosDias.length - 1] : null);
  const completados = todosDias.filter((d) => d.completado).length;
  const progreso = totalDias > 0 ? completados / totalDias : 0;

  function marcarCompletado(dayId: string) {
    setSemanasState((semanasPrev) =>
      semanasPrev.map((s) => ({
        ...s,
        completados: s.dias.some(
          (d) => d.id === dayId && !d.completado
        )
          ? s.completados + 1
          : s.completados,
        dias: s.dias.map((d) =>
          d.id === dayId ? { ...d, completado: true } : d
        ),
      }))
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

      {totalDias === 0 ? (
        <div className="px-4 py-16 text-center text-sm text-chalk-muted">
          Todavía no tenés un programa asignado. Hablá con tu entrenador.
        </div>
      ) : (
        <div>
          <div className="px-4 pt-4">
            <div className="rounded-xl border border-border bg-surface p-4">
              {proximo && (proximo.completado ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-chalk-muted">
                      Programa completado
                    </p>
                    <p className="font-display text-lg font-bold text-chalk">
                      ¡Buen trabajo!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <ChevronRight size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-chalk-muted">
                      Próximo entrenamiento
                    </p>
                    <p className="truncate font-display text-lg font-bold text-chalk">
                      {proximo.nombre} · Semana {proximo.semanaNumero}
                    </p>
                  </div>
                  <p className="ml-auto shrink-0 text-xs font-medium text-chalk-muted">
                    {completados}/{totalDias} hechos
                  </p>
                </div>
              ))}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${progreso * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 px-4">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {semanasState.map((semana) => {
                const completa =
                  semana.dias.length > 0 &&
                  semana.completados === semana.dias.length;
                const activa =
                  semana.numero ===
                  (semanaSeleccionada?.numero ??
                    semanasState[0]?.numero);
                return (
                  <button
                    key={semana.numero}
                    onClick={() => {
                      const diaDeSemana =
                        semana.dias.find((d) => !d.completado)?.id ??
                        semana.dias[0]?.id;
                      if (diaDeSemana) setSeleccionado(diaDeSemana);
                    }}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                      activa
                        ? "border-accent bg-accent text-white"
                        : "border-border bg-surface text-chalk-muted hover:text-chalk"
                    )}
                  >
                    {completa ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          activa ? "bg-white" : "bg-accent"
                        )}
                      />
                    )}
                    Sem {semana.numero}
                  </button>
                );
              })}
            </div>
          </div>

          {semanaSeleccionada && (
            <div className="mt-2 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {semanaSeleccionada.dias.map((dia) => (
                <button
                  key={dia.id}
                  onClick={() => setSeleccionado(dia.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                    seleccionado === dia.id
                      ? "border-accent/50 bg-accent/10 text-chalk"
                      : dia.completado
                        ? "border-success/30 bg-surface text-chalk-muted"
                        : "border-border bg-surface text-chalk-muted hover:text-chalk"
                  )}
                >
                  {dia.completado ? (
                    <CheckCircle2 size={14} className="text-success" />
                  ) : (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        seleccionado === dia.id ? "bg-accent" : "bg-chalk-faint"
                      )}
                    />
                  )}
                  {dia.nombre}
                </button>
              ))}
            </div>
          )}

          <div className="px-4 py-5">
            {diaActual ? (
              <WorkoutView
                dia={diaActual}
                etiquetaSemana={diaActual.etiquetaSemana}
                completado={diaActual.completado}
                onCompletado={() => marcarCompletado(diaActual.id)}
              />
            ) : (
              <div className="px-4 py-16 text-center text-sm text-chalk-muted">
                No tenés entrenamientos pendientes por ahora. ¡Buen descanso!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
