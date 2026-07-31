"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { CheckCircle2, Circle, Timer } from "lucide-react";
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

type UltimaVez = {
  series: number;
  reps: number;
  peso: number | null;
};

type Ejercicio = {
  id: string;
  nombre: string;
  descanso: string | null;
  observaciones: string | null;
  ultimaVez: UltimaVez | null;
  sets: SetPlan[];
};

type Dia = {
  id: string;
  nombre: string;
  exercises: Ejercicio[];
};

// "3 min", "2-3 min", "1:30", "45 seg" → segundos. Si no se puede, null.
function parseDescansoSegundos(s: string | null): number | null {
  if (!s) return null;
  const t = s.trim();
  const mmss = t.match(/^(\d+):([0-5]?\d)$/);
  if (mmss) return parseInt(mmss[1], 10) * 60 + parseInt(mmss[2], 10);
  const minSeg = t.match(/(\d+)\s*min(?:uto)?s?\s*(?:y\s*)?(\d+)?\s*seg(?:undos?)?/i);
  if (minSeg) {
    return parseInt(minSeg[1], 10) * 60 + (minSeg[2] ? parseInt(minSeg[2], 10) : 0);
  }
  const min = t.match(/(\d+)\s*min/i);
  if (min) return parseInt(min[1], 10) * 60;
  const seg = t.match(/(\d+)\s*seg/i);
  if (seg) return parseInt(seg[1], 10);
  const primerNumero = t.match(/(\d+)/);
  if (primerNumero) return parseInt(primerNumero[1], 10) * 60;
  return null;
}

function formatearTiempo(seg: number): string {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

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

  // Timer de descanso que arranca solo al completar una serie.
  const [restante, setRestante] = useState<number | null>(null);
  const [totalTimer, setTotalTimer] = useState(0);
  const [timerListo, setTimerListo] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const sync = () => sincronizarCola(registrarSet);
    sync();
    window.addEventListener("online", sync);
    return () => {
      window.removeEventListener("online", sync);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function iniciarDescanso(seg: number | null) {
    setTimerListo(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (!seg || seg <= 0) {
      setRestante(null);
      return;
    }
    setTotalTimer(seg);
    setRestante(seg);
    timerRef.current = setInterval(() => {
      setRestante((prev) => {
        if (prev == null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimerListo(true);
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            try {
              navigator.vibrate([300, 150, 300]);
            } catch {
              // algunos navegadores no permiten vibración
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Cuando el timer llega a 0, mostramos "¡Listo!" unos segundos y desaparece.
  useEffect(() => {
    if (restante !== 0) return;
    const t = setTimeout(() => {
      setRestante(null);
      setTimerListo(false);
    }, 4000);
    return () => clearTimeout(t);
  }, [restante]);

  // Tras completar una serie, scrollea hasta la próxima serie pendiente.
  function avanzarFoco(setId: string) {
    setTimeout(() => {
      const filas = Array.from(document.querySelectorAll<HTMLElement>("[data-setid]"));
      const idx = filas.findIndex((f) => f.dataset.setid === setId);
      for (let i = idx + 1; i < filas.length; i++) {
        if (filas[i].dataset.completado === "false") {
          filas[i].scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
      }
    }, 350);
  }

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
          <ExerciseLogger
            key={ex.id}
            ejercicio={ex}
            onGuardar={(setId) => {
              iniciarDescanso(parseDescansoSegundos(ex.descanso));
              avanzarFoco(setId);
            }}
          />
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-4 pb-6 backdrop-blur">
        {restante != null && (
          <div className="mb-3 rounded-xl border border-border bg-surface p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-chalk">
                <Timer size={16} className="text-accent" />
                <span className="font-medium">Descanso</span>
                {timerListo && (
                  <span className="text-xs font-medium text-success">
                    ¡Listo, a tirar!
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "font-display text-lg font-bold tabular-nums",
                  timerListo ? "text-success" : "text-chalk"
                )}
              >
                {formatearTiempo(restante)}
              </span>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-accent transition-all duration-1000 ease-linear"
                style={{
                  width: `${((totalTimer - restante) / totalTimer) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

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
  onGuardar,
}: {
  ejercicio: Ejercicio;
  completado?: boolean;
  onGuardar?: (setId: string) => void;
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
      {ejercicio.ultimaVez && (
        <p className="mt-1 text-xs text-chalk-muted">
          Última vez: {ejercicio.ultimaVez.series}×{ejercicio.ultimaVez.reps}
          {ejercicio.ultimaVez.peso != null
            ? ` @ ${ejercicio.ultimaVez.peso}kg`
            : ""}
        </p>
      )}

      <div className="mt-3 space-y-2">
        {ejercicio.sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            completado={completado}
            onGuardar={onGuardar}
          />
        ))}
      </div>
    </div>
  );
}

function SetRow({
  set,
  completado = false,
  onGuardar,
}: {
  set: SetPlan;
  completado?: boolean;
  onGuardar?: (setId: string) => void;
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
  const [guardado, setGuardado] = useState(yaHecho);
  const [guardadoOffline, setGuardadoOffline] = useState(false);
  const [, startTransition] = useTransition();

  const pesoObjetivo =
    set.pesoTipo === "absoluto"
      ? set.pesoKg
        ? `${set.pesoKg}kg`
        : "—"
      : `${set.porcentajeRm}% RM`;

  const log = set.logs[0];

  async function guardar() {
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
    const recienGuardado = !guardado;
    setAbierto(false);
    if (recienGuardado) onGuardar?.(set.id);
  }

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
      data-setid={set.id}
      data-completado={guardado ? "true" : "false"}
      className={cn(
        "rounded-lg border px-3 py-2.5 transition-all",
        guardado
          ? "border-success/25 bg-background opacity-60"
          : "border-border bg-background"
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => startTransition(guardar)}
          aria-label={
            guardado
              ? `Serie ${set.numeroSet} completada`
              : `Completar serie ${set.numeroSet}`
          }
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            guardado
              ? "border-success bg-success/15 text-success"
              : "border-border-strong text-chalk-faint hover:border-accent hover:text-accent"
          )}
        >
          {guardado ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>

        <button
          className="flex flex-1 items-center justify-between text-left"
          onClick={() => setAbierto(!abierto)}
        >
          <span
            className={cn(
              "text-sm",
              guardado ? "text-chalk/70" : "text-chalk"
            )}
          >
            Set {set.numeroSet} ·{" "}
            <span className="font-medium">
              {set.repeticionesObjetivo} reps
            </span>{" "}
            · {pesoObjetivo}
            {set.rpeObjetivo ? ` · RPE ${set.rpeObjetivo}` : ""}
          </span>
        </button>
      </div>

      {abierto && (
        <div className="mt-3 pl-[52px]">
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              inputMode="decimal"
              placeholder="Kg"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-2 text-center text-sm text-chalk placeholder:text-chalk-faint"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-2 text-center text-sm text-chalk placeholder:text-chalk-faint"
            />
            <input
              type="number"
              inputMode="decimal"
              placeholder="RPE"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-2 text-center text-sm text-chalk placeholder:text-chalk-faint"
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => startTransition(guardar)}
              className="flex-1 rounded-md bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Guardar serie
            </button>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="rounded-md px-3 py-2.5 text-sm text-chalk-muted hover:bg-surface-hover hover:text-chalk"
            >
              Cerrar
            </button>
          </div>
          {guardadoOffline && (
            <p className="mt-2 text-center text-[11px] text-chalk-muted">
              Guardado en el celular · se sincroniza cuando vuelva la señal
            </p>
          )}
        </div>
      )}
    </div>
  );
}
