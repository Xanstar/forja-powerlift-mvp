"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { crearPrograma } from "@/lib/actions/planning";
import { useRouter } from "next/navigation";

export function NewProgramForm({ athleteId }: { athleteId: string }) {
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!nombre.trim()) return;
        setLoading(true);
        await crearPrograma(athleteId, nombre);
        setLoading(false);
        router.refresh();
      }}
      className="flex max-w-md gap-2"
    >
      <Input
        placeholder='Nombre del programa (ej. "Bloque de fuerza - Julio")'
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Creando..." : "Iniciar programa"}
      </Button>
    </form>
  );
}
