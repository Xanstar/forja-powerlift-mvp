"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ChevronDown, Copy } from "lucide-react";
import {
  crearDia,
  crearEjercicio,
  crearSet,
  eliminarEjercicio,
  eliminarDia,
  duplicarDia,
} from "@/lib/actions/planning";
import { fechaInicioSemana, rangoSemana } from "@/lib/calendario";
import {
  CATALOGO_EJERCICIOS,
  GRUPOS_CATALOGO,
  type EjercicioCatalogo,
} from "@/lib/catalogo-ejercicios";
import { cn } from "@/lib/utils";

type SetPlan = {
  id: string;
  numeroSet: number;
  repeticionesObjetivo: number;
  pesoTipo: "absoluto" | "porcentaje_rm";
  pesoKg: number | null;
  porcentajeRm: number | null;
  rpeObjetivo: number | null;
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

type Semana = {
  id: string;
  numero: number;
  days: Dia[];
};

export function PlanBuilder({
  athleteId,
  semanas,
  semanasTotal,
  fechaInicio,
  readOnly = false,
}: {
  athleteId: string;
  semanas: Semana[];
  semanasTotal: number;
  fechaInicio: Date | null;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-4">
      {semanas.map((semana) => (
        <SemanaBlock
          key={semana.id}
          athleteId={athleteId}
          semana={semana}
          semanasTotal={semanasTotal}
          fechaInicio={fechaInicio}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

function SemanaBlock({
  athleteId,
  semana,
  semanasTotal,
  fechaInicio,
  readOnly,
}: {
  athleteId: string;
  semana: Semana;
  semanasTotal: number;
  fechaInicio: Date | null;
  readOnly: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [nombreDia, setNombreDia] = useState("");
  const [, startTransition] = useTransition();

  const rango = rangoSemana(fechaInicioSemana(fechaInicio, semana.numero));

  return (
    <div className="border-y border-chalk bg-surface">
      <button
        onClick={() => setOpen(!open)}
        className="flex min-h-11 w-full items-center justify-between px-5 py-3.5"
      >
        <span className="font-display text-sm font-semibold text-chalk">
          Semana {semana.numero}{" "}
          <span className="font-normal text-chalk-muted">
            de {semanasTotal} · {rango}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "text-chalk-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-chalk p-5">
          {semana.days.map((dia) => (
            <DiaBlock key={dia.id} athleteId={athleteId} dia={dia} readOnly={readOnly} />
          ))}

          {!readOnly && <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!nombreDia.trim()) return;
              startTransition(() => {
                crearDia(semana.id, athleteId, nombreDia);
              });
              setNombreDia("");
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Nombre del día (ej. Día 1)"
              value={nombreDia}
              onChange={(e) => setNombreDia(e.target.value)}
              className="max-w-xs"
            />
            <Button type="submit" size="sm" variant="secondary">
              <Plus size={14} /> Día
            </Button>
          </form>}
        </div>
      )}
    </div>
  );
}

function DiaBlock({ athleteId, dia, readOnly }: { athleteId: string; dia: Dia; readOnly: boolean }) {
  const [, startTransition] = useTransition();
  const [agregando, setAgregando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  return (
    <div className="border border-border-strong bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-chalk">{dia.nombre}</h4>
        {!readOnly && <details className="relative">
          <summary className="flex min-h-11 cursor-pointer list-none items-center px-2 text-xs font-semibold text-chalk-muted hover:text-chalk">
            Más acciones
          </summary>
          <div className="absolute right-0 z-10 w-64 border border-chalk bg-surface p-3">
            <button
              type="button"
              onClick={() => startTransition(() => duplicarDia(dia.id, athleteId))}
              className="flex min-h-11 w-full items-center gap-2 px-2 text-left text-sm font-semibold text-chalk hover:bg-surface-hover"
            >
              <Copy size={14} /> Duplicar día
            </button>
            {confirmando ? (
              <div className="mt-2 border-t border-border pt-3">
                <p className="text-xs leading-5 text-chalk-muted">
                  Se eliminará este día del programa. Si ya tiene ejecución, Forja bloqueará la operación para conservar el historial.
                </p>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => startTransition(() => eliminarDia(dia.id, athleteId))}
                  >
                    Eliminar día
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmando(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                className="flex min-h-11 w-full items-center gap-2 px-2 text-left text-sm font-semibold text-accent-ink hover:bg-accent-soft"
              >
                <Trash2 size={14} /> Eliminar día
              </button>
            )}
          </div>
        </details>}
      </div>

      <div className="space-y-3">
        {dia.exercises.map((ex) => (
          <EjercicioBlock key={ex.id} athleteId={athleteId} ejercicio={ex} readOnly={readOnly} />
        ))}
      </div>

      {!readOnly && (agregando ? (
        <NuevoEjercicioForm
          dayId={dia.id}
          athleteId={athleteId}
          onDone={() => setAgregando(false)}
        />
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => setAgregando(true)}
        >
          <Plus size={14} /> Agregar ejercicio
        </Button>
      ))}
    </div>
  );
}

function NuevoEjercicioForm({
  dayId,
  athleteId,
  onDone,
}: {
  dayId: string;
  athleteId: string;
  onDone: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [descanso, setDescanso] = useState("");
  const [observaciones, setObservaciones] = useState("");

  function elegirDelCatalogo(ejercicio: EjercicioCatalogo) {
    setNombre(ejercicio.nombre);
    setDescanso(ejercicio.descanso);
  }

  return (
    <div className="mt-3 space-y-3 border border-border-strong bg-surface p-3">
      <div className="space-y-2">
        {GRUPOS_CATALOGO.map(({ grupo, titulo }) => (
          <div key={grupo}>
            <p className="mb-1.5 text-xs uppercase tracking-wide text-chalk-faint">
              {titulo}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CATALOGO_EJERCICIOS.filter((e) => e.grupo === grupo).map(
                (ejercicio) => (
                  <button
                    key={ejercicio.nombre}
                    type="button"
                    onClick={() => elegirDelCatalogo(ejercicio)}
                    className={cn(
                      "min-h-11 border px-3 py-1 text-xs font-semibold transition-colors",
                      nombre === ejercicio.nombre
                        ? "border-accent bg-accent text-white"
                        : "border-border-strong bg-background text-chalk-muted hover:border-accent hover:text-accent-ink"
                    )}
                  >
                    {ejercicio.nombre}
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <form
        action={async (formData) => {
          await crearEjercicio(dayId, athleteId, formData);
          onDone();
        }}
        className="space-y-2"
      >
        <Input
          name="nombre"
          placeholder="Nombre del ejercicio (o elegí uno de la lista)"
          required
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            name="descanso"
            placeholder="Descanso (ej. 3 min)"
            value={descanso}
            onChange={(e) => setDescanso(e.target.value)}
          />
          <Input
            name="observaciones"
            placeholder="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm">
            Guardar
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}

function EjercicioBlock({
  athleteId,
  ejercicio,
  readOnly,
}: {
  athleteId: string;
  ejercicio: Ejercicio;
  readOnly: boolean;
}) {
  const [, startTransition] = useTransition();
  const [agregandoSet, setAgregandoSet] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  return (
    <div className="border-t border-border-strong bg-surface p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-chalk">{ejercicio.nombre}</p>
        {!readOnly && (confirmando ? (
          <div className="flex items-center gap-2">
            <span className="max-w-52 text-xs text-chalk-muted">El historial ejecutado se conserva y puede bloquear este borrado.</span>
            <button
              type="button"
              onClick={() => startTransition(() => eliminarEjercicio(ejercicio.id, athleteId))}
              className="min-h-11 px-2 text-xs font-semibold text-accent-ink"
            >
              Confirmar
            </button>
            <button type="button" onClick={() => setConfirmando(false)} className="min-h-11 px-2 text-xs font-semibold text-chalk-muted">
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label={`Eliminar ${ejercicio.nombre}`}
            onClick={() => setConfirmando(true)}
            className="flex min-h-11 items-center gap-1 px-2 text-xs text-chalk-muted hover:text-accent-ink"
          >
            <Trash2 size={13} /> Eliminar
          </button>
        ))}
      </div>
      {(ejercicio.descanso || ejercicio.observaciones) && (
        <p className="mt-0.5 text-xs text-chalk-faint">
          {[ejercicio.descanso, ejercicio.observaciones]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}

      {ejercicio.sets.length > 0 && (
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="text-chalk-faint">
              <th className="pb-1 text-left font-normal">Set</th>
              <th className="pb-1 text-left font-normal">Reps</th>
              <th className="pb-1 text-left font-normal">Peso</th>
              <th className="pb-1 text-left font-normal">RPE</th>
            </tr>
          </thead>
          <tbody>
            {ejercicio.sets.map((s) => (
              <tr key={s.id} className="text-chalk">
                <td className="py-0.5">{s.numeroSet}</td>
                <td className="py-0.5">{s.repeticionesObjetivo}</td>
                <td className="py-0.5">
                  {s.pesoTipo === "absoluto"
                    ? s.pesoKg
                      ? `${s.pesoKg} kg`
                      : "—"
                    : `${s.porcentajeRm}% RM`}
                </td>
                <td className="py-0.5">{s.rpeObjetivo ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!readOnly && (agregandoSet ? (
        <NuevoSetForm
          exerciseId={ejercicio.id}
          athleteId={athleteId}
          onDone={() => setAgregandoSet(false)}
        />
      ) : (
        <button
          onClick={() => setAgregandoSet(true)}
          className="mt-2 inline-flex min-h-11 items-center text-xs text-chalk-muted hover:text-accent-ink"
        >
          + Agregar series
        </button>
      ))}
    </div>
  );
}

function NuevoSetForm({
  exerciseId,
  athleteId,
  onDone,
}: {
  exerciseId: string;
  athleteId: string;
  onDone: () => void;
}) {
  const [pesoTipo, setPesoTipo] = useState<"absoluto" | "porcentaje_rm">(
    "absoluto"
  );

  return (
    <form
      action={async (formData) => {
        await crearSet(exerciseId, athleteId, formData);
        onDone();
      }}
      className="mt-2 grid grid-cols-2 gap-2 border border-border-strong p-3 sm:grid-cols-5"
    >
      <Input
        name="cantidad"
        type="number"
        placeholder="Cant. sets"
        defaultValue={1}
        min={1}
      />
      <Input
        name="repeticionesObjetivo"
        type="number"
        placeholder="Reps"
        required
      />
      <select
        name="pesoTipo"
        value={pesoTipo}
        onChange={(e) =>
          setPesoTipo(e.target.value as "absoluto" | "porcentaje_rm")
        }
        className="border border-border-strong bg-surface px-2 text-sm text-chalk"
      >
        <option value="absoluto">Kg</option>
        <option value="porcentaje_rm">% RM</option>
      </select>
      {pesoTipo === "absoluto" ? (
        <Input name="pesoKg" type="number" step="0.5" placeholder="Kg" />
      ) : (
        <Input
          name="porcentajeRm"
          type="number"
          step="1"
          placeholder="% RM"
        />
      )}
      <Input
        name="rpeObjetivo"
        type="number"
        step="0.5"
        placeholder="RPE (opc.)"
      />
      <div className="col-span-2 flex gap-2 sm:col-span-5">
        <Button type="submit" size="sm">
          Guardar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
