"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { crearPrograma } from "@/lib/actions/planning";
import { useRouter } from "next/navigation";
import { inicioDeSemana } from "@/lib/calendario";

export function NewProgramForm({ athleteId }: { athleteId: string }) {
  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState(() => {
    const lunes = inicioDeSemana(new Date());
    const mes = String(lunes.getMonth() + 1).padStart(2, "0");
    return `${lunes.getFullYear()}-${mes}-${String(lunes.getDate()).padStart(
      2,
      "0"
    )}`;
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!nombre.trim()) return;
        setLoading(true);
        await crearPrograma(
          athleteId,
          nombre,
          fechaInicio ? new Date(`${fechaInicio}T00:00:00`) : undefined
        );
        setLoading(false);
        router.refresh();
      }}
      className="mx-auto max-w-md"
    >
      <div className="flex gap-2">
        <Input
          placeholder='Nombre del programa (ej. "Bloque de fuerza")'
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Creando..." : "Iniciar programa"}
        </Button>
      </div>
      <label className="mt-3 block text-left text-xs text-chalk-muted">
        Comienza el lunes de
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="ml-2 rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-chalk"
        />
      </label>
    </form>
  );
}
