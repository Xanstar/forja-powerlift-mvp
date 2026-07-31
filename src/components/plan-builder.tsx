"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import {
  crearDia,
  crearEjercicio,
  crearSet,
  eliminarEjercicio,
  eliminarDia,
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
}: {
  athleteId: string;
  semanas: Semana[];
  semanasTotal: number;
  fechaInicio: Date | null;
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
}: {
  athleteId: string;
  semana: Semana;
  semanasTotal: number;
  fechaInicio: Date | null;
}) {
  const [open, setOpen] = useState(true);
  const [nombreDia, setNombreDia] = useState("");
  const [, startTransition] = useTransition();

  const rango = rangoSemana(fechaInicioSemana(fechaInicio, semana.numero));

  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3.5"
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
        <div className="space-y-3 border-t border-border p-5">
          {semana.days.map((dia) => (
            <DiaBlock key={dia.id} athleteId={athleteId} dia={dia} />
          ))}

          <form
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
          </form>
        </div>
      )}
    </div>
  );
}

function DiaBlock({ athleteId, dia }: { athleteId: string; dia: Dia }) {
  const [, startTransition] = useTransition();
  const [agregando, setAgregando] = useState(false);

  return (
    <div className="rounded-lg border border-border-strong bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-chalk">{dia.nombre}</h4>
        <button
          onClick={() =>
            startTransition(() => {
              eliminarDia(dia.id, athleteId);
            })
          }
          className="text-chalk-faint hover:text-accent"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-3">
        {dia.exercises.map((ex) => (
          <EjercicioBlock key={ex.id} athleteId={athleteId} ejercicio={ex} />
        ))}
      </div>

      {agregando ? (
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
      )}
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
    <div className="mt-3 space-y-3 rounded-lg border border-border bg-surface p-3">
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
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      nombre === ejercicio.nombre
                        ? "border-accent bg-accent text-white"
                        : "border-border-strong bg-background text-chalk-muted hover:border-accent hover:text-accent"
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
}: {
  athleteId: string;
  ejercicio: Ejercicio;
}) {
  const [, startTransition] = useTransition();
  const [agregandoSet, setAgregandoSet] = useState(false);

  return (
    <div className="rounded-lg bg-surface p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-chalk">{ejercicio.nombre}</p>
        <button
          onClick={() =>
            startTransition(() => {
              eliminarEjercicio(ejercicio.id, athleteId);
            })
          }
          className="text-chalk-faint hover:text-accent"
        >
          <Trash2 size={13} />
        </button>
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

      {agregandoSet ? (
        <NuevoSetForm
          exerciseId={ejercicio.id}
          athleteId={athleteId}
          onDone={() => setAgregandoSet(false)}
        />
      ) : (
        <button
          onClick={() => setAgregandoSet(true)}
          className="mt-2 text-xs text-chalk-muted hover:text-accent"
        >
          + Agregar sets
        </button>
      )}
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
      className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-border p-3 sm:grid-cols-5"
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
        className="rounded-lg border border-border bg-surface px-2 text-sm text-chalk"
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
