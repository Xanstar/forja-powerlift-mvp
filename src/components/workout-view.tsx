"use client";

import { useState, useTransition, useEffect } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { registrarSet, completarDia } from "@/lib/actions/planning";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { encolarSetOffline, sincronizarCola } from "@/lib/offline-queue";

type SetLog = {
  id: string;
  pesoKgReal: number | null;
  repeticionesReales: number | null;
  rpeReal: number | null;
};

type SetPlan = {
  id: string;
  numeroSet: number;
  repeticionesObjetivo: number;
  pesoTipo: "absoluto" | "porcentaje_rm";
  pesoKg: number | null;
  porcentajeRm: number | null;
  rpeObjetivo: number | null;
  logs: SetLog[];
};

type Ejercicio = {
  id: string;
  nombre: string;
  descanso: string | null;
  observaciones: string | null;
  sets: SetPlan[];
};

type Dia = {
  id: string;
  nombre: string;
  exercises: Ejercicio[];
};

export function WorkoutView({
  dia,
  semanaNumero,
  pin,
  completado = false,
  onCompletado,
}: {
  dia: Dia;
  semanaNumero: number;
  pin: string;
  completado?: boolean;
  onCompletado?: () => void;
}) {
  const [terminado, setTerminado] = useState(completado);
  const [, startTransition] = useTransition();

  // Si el atleta perdió señal a mitad de entrenamiento, apenas vuelve la
  // conexión sincronizamos los sets que quedaron guardados en el celular.
  useEffect(() => {
    const sync = () => sincronizarCola(registrarSet);
    sync();
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, []);

  const totalSets = dia.exercises.reduce((acc, e) => acc + e.sets.length, 0);
  const setsCompletados = dia.exercises.reduce(
    (acc, e) => acc + e.sets.filter((s) => s.logs.length > 0).length,
    0
  );

  if (terminado) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <CheckCircle2 size={40} className="mb-3 text-success" />
          <p className="font-display text-xl font-bold text-chalk">
            {completado ? "Día completado" : "¡Entrenamiento completado!"}
          </p>
          <p className="mt-1 text-sm text-chalk-muted">
            {completado
              ? "Esto es lo que registraste en esta sesión."
              : "Nos vemos en el próximo."}
          </p>
        </div>

        <div className="mt-2 space-y-5">
          {dia.exercises.map((ex) => (
            <ExerciseLogger key={ex.id} ejercicio={ex} completado />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-chalk-muted">
            Semana {semanaNumero}
          </p>
          <h1 className="font-display text-xl font-bold text-chalk">
            {dia.nombre}
          </h1>
        </div>
        <p className="text-xs text-chalk-muted">
          {setsCompletados}/{totalSets} sets
        </p>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="h-full bg-accent transition-all"
          style={{
            width: totalSets ? `${(setsCompletados / totalSets) * 100}%` : "0%",
          }}
        />
      </div>

      <div className="mt-6 space-y-5">
        {dia.exercises.map((ex) => (
          <ExerciseLogger key={ex.id} ejercicio={ex} />
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background p-4 pb-6">
        <Button
          className="w-full"
          size="lg"
          onClick={() =>
            startTransition(async () => {
              await completarDia(dia.id, pin);
              setTerminado(true);
              onCompletado?.();
            })
          }
        >
          Completar entrenamiento
        </Button>
      </div>
    </div>
  );
}

function ExerciseLogger({
  ejercicio,
  completado = false,
}: {
  ejercicio: Ejercicio;
  completado?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="font-medium text-chalk">{ejercicio.nombre}</p>
      {(ejercicio.descanso || ejercicio.observaciones) && (
        <p className="mt-0.5 text-xs text-chalk-muted">
          {[ejercicio.descanso, ejercicio.observaciones]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}

      <div className="mt-3 space-y-2">
        {ejercicio.sets.map((set) => (
          <SetRow key={set.id} set={set} completado={completado} />
        ))}
      </div>
    </div>
  );
}

function SetRow({
  set,
  completado = false,
}: {
  set: SetPlan;
  completado?: boolean;
}) {
  const yaHecho = set.logs.length > 0;
  const [abierto, setAbierto] = useState(false);
  const [peso, setPeso] = useState(
    yaHecho ? String(set.logs[0].pesoKgReal ?? "") : String(set.pesoKg ?? "")
  );
  const [reps, setReps] = useState(
    yaHecho
      ? String(set.logs[0].repeticionesReales ?? "")
      : String(set.repeticionesObjetivo)
  );
  const [rpe, setRpe] = useState(
    yaHecho ? String(set.logs[0].rpeReal ?? "") : ""
  );
  const [, startTransition] = useTransition();
  const [guardado, setGuardado] = useState(yaHecho);
  const [guardadoOffline, setGuardadoOffline] = useState(false);

  const pesoObjetivo =
    set.pesoTipo === "absoluto"
      ? set.pesoKg
        ? `${set.pesoKg}kg`
        : "—"
      : `${set.porcentajeRm}% RM`;

  const log = set.logs[0];

  if (completado) {
    return (
      <div className="rounded-lg border border-border bg-background px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {log ? (
              <CheckCircle2 size={16} className="shrink-0 text-success" />
            ) : (
              <Circle size={16} className="shrink-0 text-chalk-faint" />
            )}
            <span className="text-sm text-chalk">
              Set {set.numeroSet} · {set.repeticionesObjetivo} reps ·{" "}
              {pesoObjetivo}
              {set.rpeObjetivo ? ` · RPE ${set.rpeObjetivo}` : ""}
            </span>
          </div>
        </div>
        {log && (
          <p className="mt-1.5 pl-[26px] text-xs text-chalk-muted">
            Registraste:{" "}
            <span className="text-chalk">
              {log.pesoKgReal}kg × {log.repeticionesReales}
              {log.rpeReal ? ` @ RPE ${log.rpeReal}` : ""}
            </span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 transition-colors",
        guardado
          ? "border-success/30 bg-success/5"
          : "border-border bg-background"
      )}
    >
      <button
        className="flex w-full items-center justify-between"
        onClick={() => setAbierto(!abierto)}
      >
        <div className="flex items-center gap-2.5">
          {guardado ? (
            <CheckCircle2 size={16} className="text-success" />
          ) : (
            <Circle size={16} className="text-chalk-faint" />
          )}
          <span className="text-sm text-chalk">
            Set {set.numeroSet} · {set.repeticionesObjetivo} reps ·{" "}
            {pesoObjetivo}
            {set.rpeObjetivo ? ` · RPE ${set.rpeObjetivo}` : ""}
          </span>
        </div>
      </button>

      {abierto && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Kg"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-center text-sm text-chalk"
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder="Reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-center text-sm text-chalk"
          />
          <input
            type="number"
            inputMode="decimal"
            placeholder="RPE"
            value={rpe}
            onChange={(e) => setRpe(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-center text-sm text-chalk"
          />
          <button
            className="col-span-3 mt-1 rounded-md bg-accent py-1.5 text-sm font-medium text-white"
            onClick={() =>
              startTransition(async () => {
                const data = {
                  pesoKgReal: peso ? parseFloat(peso) : undefined,
                  repeticionesReales: reps ? parseInt(reps, 10) : undefined,
                  rpeReal: rpe ? parseFloat(rpe) : undefined,
                };
                try {
                  await registrarSet(set.id, data);
                  setGuardado(true);
                  setGuardadoOffline(false);
                } catch {
                  // Sin señal: lo guardamos en el celular y se sube solo
                  // cuando vuelva la conexión (ver offline-queue.ts).
                  encolarSetOffline({ plannedSetId: set.id, data });
                  setGuardado(true);
                  setGuardadoOffline(true);
                }
                setAbierto(false);
              })
            }
          >
            Guardar set
          </button>
          {guardadoOffline && (
            <p className="col-span-3 text-center text-[11px] text-chalk-muted">
              Guardado en el celular · se sincroniza cuando vuelva la señal
            </p>
          )}
        </div>
      )}
    </div>
  );
}
