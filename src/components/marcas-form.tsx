"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { guardarMarcas, type FilaMarca } from "@/lib/actions/marcas";
import { puntajeWilks, puntajeIpfGl } from "@/lib/scoring";
import { type Lift } from "@/lib/queries";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import {
  buildDirtyMarksRows,
  type DirtyMarks,
} from "@/lib/marks-dirty";

type AtletaRow = {
  id: string;
  nombre: string;
  apellido: string;
  categoria: string | null;
  sexo: "masculino" | "femenino" | null;
  pesoCorporal: number | null;
  lifts: Partial<Record<Lift, { valorKg: number; tipo: string }>>;
};

type Fila = {
  peso: string;
  sentadilla: string;
  banca: string;
  peso_muerto: string;
  tipo: "real" | "estimado";
};

const LIFT_INPUTS: { key: Lift; label: string }[] = [
  { key: "sentadilla", label: "Sentadilla" },
  { key: "banca", label: "Banca" },
  { key: "peso_muerto", label: "Peso muerto" },
];

function num(v: string): number | null {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function fmtKg(n: number): string {
  return n % 1 === 0 ? `${n}` : n.toFixed(1);
}

export function MarcasForm({ atletas }: { atletas: AtletaRow[] }) {
  const router = useRouter();
  const hoy = new Date().toISOString().slice(0, 10);

  const [fecha, setFecha] = useState(hoy);
  const [filas, setFilas] = useState<Record<string, Fila>>(() => {
    const init: Record<string, Fila> = {};
    for (const a of atletas) {
      init[a.id] = {
        peso: a.pesoCorporal != null ? `${a.pesoCorporal}` : "",
        sentadilla: a.lifts.sentadilla ? `${a.lifts.sentadilla.valorKg}` : "",
        banca: a.lifts.banca ? `${a.lifts.banca.valorKg}` : "",
        peso_muerto: a.lifts.peso_muerto ? `${a.lifts.peso_muerto.valorKg}` : "",
        tipo: "real",
      };
    }
    return init;
  });
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [dirtyFields, setDirtyFields] = useState<DirtyMarks>({});
  const dirty = Object.values(dirtyFields).some(
    (fields) => Object.keys(fields).length > 0
  );

  function setFila(id: string, patch: Partial<Fila>) {
    setResultado(null);
    setDirtyFields((current) => ({
      ...current,
      [id]: {
        ...current[id],
        ...Object.fromEntries(Object.keys(patch).map((key) => [key, true])),
      },
    }));
    setFilas((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function guardar() {
    setGuardando(true);
    const aGuardar: FilaMarca[] = buildDirtyMarksRows(
      atletas.map((athlete) => athlete.id),
      filas,
      dirtyFields
    );
    const res = await guardarMarcas(fecha, aGuardar);
    setGuardando(false);
    setResultado(
      `Guardado: ${res.guardadas} marca${res.guardadas !== 1 ? "s" : ""} en ${
        res.atletas
      } atleta${res.atletas !== 1 ? "s" : ""}.`
    );
    setDirtyFields({});
    router.refresh();
  }

  if (atletas.length === 0) {
    return (
      <div className="border border-dashed border-border-strong p-12 text-center text-sm text-chalk-muted">
        No hay atletas activos para una toma de marcas.{" "}
        <Link href="/atletas/nuevo" className="text-accent-ink hover:underline">
          Agregá atletas
        </Link>{" "}
        o{" "}
        <Link href="/atletas" className="text-accent-ink hover:underline">
          importalos desde Excel
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Label htmlFor="fecha-marcas">Fecha de la toma de marcas</Label>
          <Input
            id="fecha-marcas"
            type="date"
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
            }}
            className="w-44"
          />
        </div>
      </div>

      {resultado && (
        <div className="flex items-center gap-2 border border-success bg-success-soft px-3.5 py-2.5 text-sm font-medium text-success">
          <CheckCircle2 size={16} /> {resultado}
        </div>
      )}

      <div className="space-y-3 md:hidden">
        {atletas.map((a) => {
          const f = filas[a.id];
          const total =
            (num(f?.sentadilla ?? "") ?? 0) +
            (num(f?.banca ?? "") ?? 0) +
            (num(f?.peso_muerto ?? "") ?? 0);
          return (
            <section key={a.id} className="border-y border-chalk bg-surface p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-semibold text-chalk">{a.nombre} {a.apellido}</h2>
                <span className="data-number text-lg font-bold text-chalk">{total ? `${fmtKg(total)} kg` : "Sin total"}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-chalk-muted">
                  Peso corporal (kg)
                  <Input type="number" step="0.1" min="0" value={f?.peso ?? ""} onChange={(e) => setFila(a.id, { peso: e.target.value })} className="mt-1 text-right" />
                </label>
                <label className="text-xs font-semibold text-chalk-muted">
                  Tipo
                  <select value={f?.tipo ?? "real"} onChange={(e) => setFila(a.id, { tipo: e.target.value as "real" | "estimado" })} className="mt-1 w-full border border-border-strong bg-background px-3 text-sm text-chalk">
                    <option value="real">Real</option>
                    <option value="estimado">Estimado</option>
                  </select>
                </label>
                {LIFT_INPUTS.map((lift) => (
                  <label key={lift.key} className={lift.key === "peso_muerto" ? "col-span-2 text-xs font-semibold text-chalk-muted" : "text-xs font-semibold text-chalk-muted"}>
                    {lift.label} (kg)
                    <Input type="number" step="0.5" min="0" value={f?.[lift.key] ?? ""} onChange={(e) => setFila(a.id, { [lift.key]: e.target.value })} className="mt-1 text-right" />
                  </label>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto border-y border-chalk bg-surface md:block">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-chalk-muted">
              <th className="px-4 py-3 font-medium">Atleta</th>
              <th className="px-2 py-3 font-medium">Categoría</th>
              <th className="px-2 py-3 font-medium">Peso (kg)</th>
              {LIFT_INPUTS.map((l) => (
                <th key={l.key} className="px-2 py-3 font-medium">
                  {l.label}
                </th>
              ))}
              <th className="px-2 py-3 font-medium">Tipo</th>
              <th className="px-2 py-3 font-medium">Total</th>
              <th className="px-2 py-3 font-medium">Wilks</th>
              <th className="px-2 py-3 font-medium">IPF GL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {atletas.map((a) => {
              const f = filas[a.id];
              const s = num(f?.sentadilla ?? "") ?? 0;
              const b = num(f?.banca ?? "") ?? 0;
              const d = num(f?.peso_muerto ?? "") ?? 0;
              const total = s + b + d;
              const peso = num(f?.peso ?? "");
              const puedeScore =
                total > 0 && peso != null && a.sexo != null;
              return (
                <tr key={a.id} className="hover:bg-surface-hover">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-chalk">
                      {a.nombre} {a.apellido}
                    </p>
                  </td>
                  <td className="px-2 py-2.5 text-xs text-chalk-muted">
                    {a.categoria ?? "—"}
                  </td>
                  <td className="px-2 py-2.5">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="—"
                      value={f?.peso ?? ""}
                      onChange={(e) => setFila(a.id, { peso: e.target.value })}
                      className="w-20 px-2 py-1.5 text-right"
                    />
                  </td>
                  {LIFT_INPUTS.map((l) => (
                    <td key={l.key} className="px-2 py-2.5">
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="—"
                        value={f?.[l.key] ?? ""}
                        onChange={(e) => setFila(a.id, { [l.key]: e.target.value })}
                        className="w-20 px-2 py-1.5 text-right"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2.5">
                    <select
                      value={f?.tipo ?? "real"}
                      onChange={(e) =>
                        setFila(a.id, { tipo: e.target.value as "real" | "estimado" })
                      }
                      className="border border-border-strong bg-background px-2 py-1.5 text-xs text-chalk"
                    >
                      <option value="real">Real</option>
                      <option value="estimado">Estimado</option>
                    </select>
                  </td>
                  <td className="data-number px-2 py-2.5 text-lg font-bold text-chalk">
                    {total > 0 ? fmtKg(total) : "—"}
                  </td>
                  <td className="px-2 py-2.5 text-chalk-muted">
                    {puedeScore ? puntajeWilks(total, peso!, a.sexo!) : "—"}
                  </td>
                  <td className="px-2 py-2.5 text-chalk-muted">
                    {puedeScore ? puntajeIpfGl(total, peso!, a.sexo!) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {dirty && (
        <div className="sticky bottom-0 z-20 border-t border-chalk bg-surface p-3">
          <Button onClick={guardar} disabled={guardando} className="w-full md:ml-auto md:block md:w-auto">
            {guardando ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      )}
    </div>
  );
}
