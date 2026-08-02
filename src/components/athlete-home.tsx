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
import { ForjaLogo } from "@/components/forja-logo";
import { ThemeControl } from "@/components/theme-control";

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
      resolvedWeightKg: number | null;
      sourceOneRmKg: number | null;
      rpeObjetivo: number | null;
      logs: {
        id: string;
        pesoKgReal: number | null;
        repeticionesReales: number | null;
        rpeReal: number | null;
        status: "completed" | "skipped";
        skipReason: string | null;
        clientMutationId: string;
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
    <div className="min-h-screen bg-background pb-32">
      <header className="flex items-center justify-between border-b border-chalk bg-surface px-4 py-4">
        <div className="flex items-center gap-2">
          <ForjaLogo className="w-[112px] sm:w-[132px]" />
          <span className="hidden border-l border-border-strong pl-2 text-sm font-semibold text-chalk-muted sm:inline">{nombre}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeControl />
          <Link
            href={`/progreso/${pin}`}
            className="flex min-h-11 items-center gap-1.5 px-2.5 py-1.5 text-sm font-semibold text-chalk-muted transition-colors hover:bg-surface-hover hover:text-chalk"
          >
            <LineChart size={15} />
            Progreso
          </Link>
          <Link
            href="/hoy"
            className="flex min-h-11 items-center gap-1.5 px-2.5 py-1.5 text-sm font-semibold text-chalk-muted transition-colors hover:bg-surface-hover hover:text-chalk"
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
            <div className="competition-sheet border-y border-chalk p-4">
              {proximo && (proximo.completado ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-success bg-surface text-success">
                    <Trophy size={20} />
                  </div>
                  <p className="font-display text-lg font-bold text-chalk">
                    Programa completado
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-accent bg-surface text-accent-ink">
                    <ChevronRight size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-bold text-chalk">
                      Próxima sesión: {proximo.nombre} · Semana {proximo.semanaNumero}
                    </p>
                  </div>
                  <p className="ml-auto shrink-0 text-xs font-medium text-chalk-muted">
                    {completados}/{totalDias} hechos
                  </p>
                </div>
              ))}
              <div className="mt-3 h-2 w-full overflow-hidden border border-border-strong bg-background">
                <div
                  className="h-full bg-accent transition-all"
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
                      "flex min-h-11 shrink-0 items-center gap-1.5 border px-3.5 py-1.5 text-sm font-semibold transition-colors",
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
                          "h-2 w-2",
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
                    "flex min-h-11 shrink-0 items-center gap-1.5 border px-3.5 py-1.5 text-sm font-semibold transition-colors",
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
                        "h-2 w-2",
                        seleccionado === dia.id ? "bg-accent" : "bg-chalk-faint"
                      )}
                    />
                  )}
                  {dia.nombre}
                </button>
              ))}
            </div>
          )}

          <div className="mx-auto max-w-3xl px-4 py-5">
            {diaActual ? (
              <WorkoutView
                dia={diaActual}
                etiquetaSemana={diaActual.etiquetaSemana}
                completado={diaActual.completado}
                onCompletado={() => marcarCompletado(diaActual.id)}
              />
            ) : (
              <div className="px-4 py-16 text-center text-sm text-chalk-muted">
                No hay sesiones pendientes.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
