"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { crearRecord } from "@/lib/actions/records";
import { Plus } from "lucide-react";

export function RecordForm({ athleteId }: { athleteId: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} /> Cargar RM
      </Button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await crearRecord(athleteId, formData);
        setOpen(false);
      }}
      className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-surface p-3 sm:grid-cols-4"
    >
      <select
        name="lift"
        required
        className="rounded-lg border border-border bg-background px-2 text-sm text-chalk"
      >
        <option value="sentadilla">Sentadilla</option>
        <option value="banca">Press Banca</option>
        <option value="peso_muerto">Peso Muerto</option>
      </select>
      <Input name="valorKg" type="number" step="0.5" placeholder="Kg" required />
      <select
        name="tipo"
        className="rounded-lg border border-border bg-background px-2 text-sm text-chalk"
      >
        <option value="estimado">Estimado</option>
        <option value="real">Real (competencia)</option>
      </select>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Guardar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          X
        </Button>
      </div>
    </form>
  );
}
