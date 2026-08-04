"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { CheckCircle2, Circle, Timer, WifiOff } from "lucide-react";
import { registrarSet, completarDia } from "@/lib/actions/planning";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  encolarSetOffline,
  leerCola,
  leerConflictos,
  QUEUE_EVENT,
  sincronizarCola,
} from "@/lib/offline-queue";
import { dayCompletionOperationId } from "@/lib/day-completion-operation";
import {
  recordWorkoutLog,
  workoutLogsForSummary,
  type LocalWorkoutLog,
} from "@/lib/workout-state";

type SetLog = LocalWorkoutLog;

type SetPlan = {
  id: string;
  numeroSet: number;
  repeticionesObjetivo: number;
  pesoTipo: "absoluto" | "porcentaje_rm";
  pesoKg: number | null;
  porcentajeRm: number | null;
  resolvedWeightKg: number | null;
  sourceOneRmKg: number | null;
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
  if (/^\d+(?:\.\d+)?$/.test(t)) return Math.round(parseFloat(t));
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
  return null;
}

function formatDescansoLabel(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    return `Descanso: ${Math.round(parseFloat(trimmed))} s`;
  }
  return `Descanso: ${trimmed}`;
}

function formatearTiempo(seg: number): string {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Compara lo hecho contra lo planeado. En sets de %RM el peso del plan no es
// comparable con kg reales, así que ahí solo se comparan reps y RPE.
function compararConPlan(
  set: SetPlan,
  pesoReal: number | null,
  repsReal: number | null,
  rpeReal: number | null
): {
  difiere: boolean;
  peso: boolean;
  reps: boolean;
  rpe: boolean;
} {
  const pesoPlan = set.resolvedWeightKg;
  const difierePeso =
    pesoReal != null && pesoPlan != null && pesoReal !== pesoPlan;
  const difiereReps =
    repsReal != null && repsReal !== set.repeticionesObjetivo;
  const difiereRpe =
    rpeReal != null && set.rpeObjetivo != null && rpeReal !== set.rpeObjetivo;
  return {
    difiere: difierePeso || difiereReps || difiereRpe,
    peso: difierePeso,
    reps: difiereReps,
    rpe: difiereRpe,
  };
}

export function WorkoutView({
  dia,
  etiquetaSemana,
  completado = false,
  onCompletado,
}: {
  dia: Dia;
  etiquetaSemana: string;
  completado?: boolean;
  onCompletado?: () => void;
}) {
  const [terminado, setTerminado] = useState(completado);
  const [recorded, setRecorded] = useState<Record<string, "completed" | "skipped">>(
    () =>
      Object.fromEntries(
        dia.exercises.flatMap((exercise) =>
          exercise.sets.flatMap((set) =>
            set.logs[0] ? [[set.id, set.logs[0].status] as const] : []
          )
        )
      )
  );
  const [localLogs, setLocalLogs] = useState<Record<string, SetLog>>({});
  const [pendingCount, setPendingCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [online, setOnline] = useState(true);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [isCompleting, startTransition] = useTransition();

  // Timer de descanso que arranca solo al completar una serie.
  const [restante, setRestante] = useState<number | null>(null);
  const [totalTimer, setTotalTimer] = useState(0);
  const [timerListo, setTimerListo] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const refreshQueue = () => {
      setPendingCount(leerCola().length);
      setConflictCount(leerConflictos().length);
    };
    const sync = async () => {
      setOnline(navigator.onLine);
      if (!navigator.onLine) return;
      const result = await sincronizarCola(registrarSet);
      refreshQueue();
      if (result.synced > 0) {
        setSyncMessage(`${result.synced} serie${result.synced === 1 ? "" : "s"} sincronizada${result.synced === 1 ? "" : "s"}.`);
      }
    };
    refreshQueue();
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    window.addEventListener(QUEUE_EVENT, refreshQueue);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      window.removeEventListener(QUEUE_EVENT, refreshQueue);
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
  const setsCompletados = Object.keys(recorded).length;
  const nextPendingId = dia.exercises
    .flatMap((exercise) => exercise.sets)
    .find((set) => !recorded[set.id])?.id;
  const canComplete =
    totalSets > 0 &&
    setsCompletados === totalSets &&
    pendingCount === 0 &&
    conflictCount === 0;

  if (terminado) {
    return (
      <div>
        <div className="competition-sheet flex flex-col items-center justify-center border-y border-success px-6 py-10 text-center">
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
            <ExerciseLogger
              key={ex.id}
              ejercicio={ex}
              completado
              localLogs={localLogs}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="data-label">
            {etiquetaSemana}
          </p>
          <h1 className="font-display text-xl font-bold text-chalk">
            {dia.nombre}
          </h1>
        </div>
        <p className="text-xs text-chalk-muted">
          {setsCompletados}/{totalSets} series
        </p>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden border border-border-strong bg-surface">
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
            recorded={recorded}
            localLogs={localLogs}
            nextPendingId={nextPendingId}
            onStatus={(setId, status) =>
              setRecorded((current) => ({ ...current, [setId]: status }))
            }
            onRecorded={(setId, log) =>
              setLocalLogs((current) => recordWorkoutLog(current, setId, log))
            }
            onGuardar={(setId) => {
              iniciarDescanso(parseDescansoSegundos(ex.descanso));
              avanzarFoco(setId);
            }}
          />
        ))}
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-chalk bg-surface p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-2 flex max-w-3xl items-center justify-between text-xs text-chalk-muted" aria-live="polite">
          <span className="flex items-center gap-1.5">
            {!online && <WifiOff size={14} aria-hidden="true" />}
            {conflictCount > 0
              ? `${conflictCount} conflicto${conflictCount === 1 ? "" : "s"} de sincronización · revisá la serie`
              : pendingCount > 0
              ? `${pendingCount} serie${pendingCount === 1 ? "" : "s"} pendiente${pendingCount === 1 ? "" : "s"} de sincronizar`
              : online
                ? syncMessage ?? "Registro sincronizado"
                : "Sin conexión · los cambios quedarán pendientes"}
          </span>
          <span>{setsCompletados}/{totalSets} series</span>
        </div>
        {restante != null && (
          <div className="mb-3 border border-steel bg-blue-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-chalk">
                <Timer size={16} className="text-accent-ink" />
                <span className="font-medium">Descanso</span>
                {timerListo && (
                  <span className="text-xs font-medium text-success">
                    ¡Listo, a tirar!
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "data-number text-2xl font-bold tabular-nums",
                  timerListo ? "text-success" : "text-chalk"
                )}
              >
                {formatearTiempo(restante)}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden bg-border">
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
          disabled={!canComplete || isCompleting}
          onClick={() =>
            startTransition(async () => {
              const clientMutationId = dayCompletionOperationId(dia.id);
              setCompletionMessage("Guardando finalización...");
              try {
                const result = await completarDia(dia.id, clientMutationId);
                if (result.outcome === "applied" || result.outcome === "duplicate") {
                  setTerminado(true);
                  onCompletado?.();
                  return;
                }
                setCompletionMessage(
                  "La sesión cambió en el servidor. Recargá para reconciliar el estado antes de volver a intentar."
                );
              } catch {
                setCompletionMessage(
                  "No pudimos confirmar la finalización. Reintentá con conexión; el día conserva la misma identidad de operación."
                );
              }
            })
          }
        >
          {isCompleting
            ? "Confirmando sesión"
            : pendingCount > 0
            ? "Esperando sincronización"
            : canComplete
              ? "Completar sesión"
              : "Registrá u omití cada serie"}
        </Button>
        {completionMessage && (
          <div className="mt-2 border border-border-strong bg-background p-3 text-sm text-chalk" role="status">
            <p>{completionMessage}</p>
            {completionMessage.includes("Recargá") && (
              <Button
                className="mt-2"
                size="sm"
                variant="secondary"
                onClick={() => window.location.reload()}
              >
                Recargar sesión
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ExerciseLogger({
  ejercicio,
  completado = false,
  onGuardar,
  recorded = {},
  localLogs = {},
  nextPendingId,
  onStatus,
  onRecorded,
}: {
  ejercicio: Ejercicio;
  completado?: boolean;
  onGuardar?: (setId: string) => void;
  recorded?: Record<string, "completed" | "skipped">;
  localLogs?: Record<string, SetLog>;
  nextPendingId?: string;
  onStatus?: (setId: string, status: "completed" | "skipped") => void;
  onRecorded?: (setId: string, log: SetLog) => void;
}) {
  return (
    <section className="border-y border-chalk bg-surface p-4">
      <p className="font-display text-lg font-bold tracking-tight text-chalk">{ejercicio.nombre}</p>
      {(ejercicio.descanso || ejercicio.observaciones) && (
        <p className="mt-0.5 text-xs text-chalk-muted">
          {[formatDescansoLabel(ejercicio.descanso), ejercicio.observaciones]
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
            set={{
              ...set,
              logs: workoutLogsForSummary(set.logs, localLogs[set.id]),
            }}
            completado={completado}
            onGuardar={onGuardar}
            recordedStatus={recorded[set.id]}
            dominant={nextPendingId === set.id}
            onStatus={onStatus}
            onRecorded={onRecorded}
          />
        ))}
      </div>
    </section>
  );
}

function SetRow({
  set,
  completado = false,
  onGuardar,
  recordedStatus,
  dominant = false,
  onStatus,
  onRecorded,
}: {
  set: SetPlan;
  completado?: boolean;
  onGuardar?: (setId: string) => void;
  recordedStatus?: "completed" | "skipped";
  dominant?: boolean;
  onStatus?: (setId: string, status: "completed" | "skipped") => void;
  onRecorded?: (setId: string, log: SetLog) => void;
}) {
  const yaHecho = set.logs.length > 0;
  const [abierto, setAbierto] = useState(false);
  const [peso, setPeso] = useState(
    yaHecho
      ? String(set.logs[0].pesoKgReal ?? "")
      : String(set.resolvedWeightKg ?? "")
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
  const [status, setStatus] = useState<"completed" | "skipped" | null>(
    recordedStatus ?? set.logs[0]?.status ?? null
  );
  const [skipReason, setSkipReason] = useState(set.logs[0]?.skipReason ?? "");
  const [currentMutationId, setCurrentMutationId] = useState(
    set.logs[0]?.clientMutationId
  );
  const [guardadoOffline, setGuardadoOffline] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const pesoObjetivo = set.resolvedWeightKg != null
    ? `${set.resolvedWeightKg} kg${set.pesoTipo === "porcentaje_rm" ? ` (${set.porcentajeRm}% de ${set.sourceOneRmKg ?? "—"} kg)` : ""}`
    : set.pesoTipo === "porcentaje_rm"
      ? `${set.porcentajeRm}% 1RM · falta marca vigente`
      : "Carga libre";

  const log = set.logs[0];

  const hechoPeso = peso ? parseFloat(peso) : null;
  const hechoReps = reps ? parseInt(reps, 10) : null;
  const hechoRpe = rpe ? parseFloat(rpe) : null;
  const diff = compararConPlan(set, hechoPeso, hechoReps, hechoRpe);

  const detallePlan = diff.difiere
    ? [
        diff.peso && set.pesoKg != null ? `plan ${set.pesoKg}kg` : "",
        diff.reps ? `plan ${set.repeticionesObjetivo} reps` : "",
        diff.rpe && set.rpeObjetivo != null
          ? `plan RPE ${set.rpeObjetivo}`
          : "",
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  async function guardar(nextStatus: "completed" | "skipped" = "completed") {
    const clientMutationId = crypto.randomUUID();
    const data = {
      pesoKgReal: peso ? parseFloat(peso) : undefined,
      repeticionesReales: reps ? parseInt(reps, 10) : undefined,
      rpeReal: rpe ? parseFloat(rpe) : undefined,
      status: nextStatus,
      skipReason: nextStatus === "skipped" ? skipReason : undefined,
      clientMutationId,
      expectedMutationId: currentMutationId,
    };
    setSaveError(null);
    try {
      const result = await registrarSet(set.id, data);
      if (result.outcome === "conflict") {
        setSaveError("La serie cambió en otro dispositivo. Recargá antes de volver a guardar.");
        return;
      }
      setGuardado(true);
      setStatus(nextStatus);
      setCurrentMutationId(clientMutationId);
      setGuardadoOffline(false);
    } catch {
      // Sin señal: lo guardamos en el celular y se sube solo
      // cuando vuelva la conexión (ver offline-queue.ts).
      encolarSetOffline({ plannedSetId: set.id, data });
      setGuardado(true);
      setStatus(nextStatus);
      setGuardadoOffline(true);
    }
    const recienGuardado = !guardado;
    setAbierto(false);
    if (recienGuardado) onGuardar?.(set.id);
    onStatus?.(set.id, nextStatus);
    onRecorded?.(set.id, {
      id: clientMutationId,
      pesoKgReal: nextStatus === "completed" ? hechoPeso : null,
      repeticionesReales: nextStatus === "completed" ? hechoReps : null,
      rpeReal: nextStatus === "completed" ? hechoRpe : null,
      status: nextStatus,
      skipReason: nextStatus === "skipped" ? skipReason || null : null,
      clientMutationId,
    });
  }

  if (completado) {
    return (
      <div className="border border-border-strong bg-background px-3 py-2.5">
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
              {log.status === "skipped"
                ? `Omitida${log.skipReason ? ` · ${log.skipReason}` : ""}`
                : `${log.pesoKgReal ?? "—"} kg × ${log.repeticionesReales ?? "—"}`}
              {log.rpeReal ? ` @ RPE ${log.rpeReal}` : ""}
            </span>
            {compararConPlan(
              set,
              log.pesoKgReal,
              log.repeticionesReales,
              log.rpeReal
            ).difiere && (
              <span className="text-accent-ink"> · distinto del plan</span>
            )}
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
        "border px-3 py-3 transition-all",
        guardado
          ? diff.difiere
            ? "border-accent/30 bg-background"
            : "border-success/25 bg-background opacity-60"
          : dominant
            ? "border-steel bg-blue-50"
            : "border-border bg-background"
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => startTransition(() => guardar("completed"))}
          aria-label={
            guardado
              ? `Serie ${set.numeroSet} completada`
              : `Completar serie ${set.numeroSet}`
          }
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center border-2 transition-colors",
            guardado
              ? "border-success bg-success/15 text-success"
              : "border-border-strong text-chalk-faint hover:border-accent hover:text-accent-ink"
          )}
        >
          {guardado ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>

        <button
          className="flex min-h-11 flex-1 items-center justify-between text-left"
          onClick={() => setAbierto(!abierto)}
        >
          <span
            className={cn(
              "text-sm",
              guardado ? "text-chalk/70" : "text-chalk"
            )}
          >
            {dominant && <strong className="mr-1 text-steel">Próxima serie</strong>}
            Serie {set.numeroSet} ·{" "}
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
              className="border border-border-strong bg-surface px-2 py-2 text-center text-sm text-chalk placeholder:text-chalk-faint"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="border border-border-strong bg-surface px-2 py-2 text-center text-sm text-chalk placeholder:text-chalk-faint"
            />
            <input
              type="number"
              inputMode="decimal"
              placeholder="RPE"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              className="border border-border-strong bg-surface px-2 py-2 text-center text-sm text-chalk placeholder:text-chalk-faint"
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => startTransition(() => guardar("completed"))}
              className="min-h-11 flex-1 border border-accent bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Hecho
            </button>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="min-h-11 border border-transparent px-3 py-2.5 text-sm font-semibold text-chalk-muted hover:border-border hover:bg-surface-hover hover:text-chalk"
            >
              Cerrar
            </button>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              value={skipReason}
              onChange={(event) => setSkipReason(event.target.value)}
              placeholder="Motivo opcional"
              aria-label="Motivo para omitir la serie"
              className="border border-border-strong bg-surface px-3 py-2 text-sm text-chalk"
            />
            <button
              type="button"
              onClick={() => startTransition(() => guardar("skipped"))}
              className="min-h-11 border border-border-strong px-3 py-2 text-sm font-semibold text-chalk-muted hover:border-chalk hover:text-chalk"
            >
              Omitir serie
            </button>
          </div>
          {guardadoOffline && (
            <p className="mt-2 text-center text-xs text-chalk-muted">
              Guardado en el celular · se sincroniza cuando vuelva la señal
            </p>
          )}
          {saveError && <p role="alert" className="mt-2 text-xs font-semibold text-accent-ink">{saveError}</p>}
        </div>
      )}

      {guardado && status === "skipped" && !abierto && (
        <p className="mt-2 pl-[52px] text-xs font-semibold text-chalk-muted">
          Omitida{skipReason ? ` · ${skipReason}` : ""}
        </p>
      )}
      {guardado && status !== "skipped" && !abierto && diff.difiere && (
        <p className="mt-2 pl-[52px] text-xs">
          <span className="text-chalk-muted">Hecho: </span>
          <span className="font-medium text-accent-ink">
            {hechoPeso != null ? `${hechoPeso}kg` : "—"} ×{" "}
            {hechoReps != null ? hechoReps : "—"}
            {hechoRpe != null ? ` @ RPE ${hechoRpe}` : ""}
          </span>
          <span className="text-chalk-muted"> · {detallePlan}</span>
        </p>
      )}
    </div>
  );
}
