"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { actualizarAtleta, eliminarAtleta } from "@/lib/actions/athletes";
import { useRouter } from "next/navigation";

type Atleta = {
  id: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: Date | null;
  pesoCorporal: number | null;
  altura: number | null;
  categoria: string | null;
  sexo: "masculino" | "femenino" | null;
  estado: "activo" | "inactivo";
  notas: string | null;
  telefonoE164: string | null;
};

export function EditAthleteForm({ atleta }: { atleta: Atleta }) {
  const [guardado, setGuardado] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const router = useRouter();

  return (
    <form
      action={async (formData) => {
        await actualizarAtleta(atleta.id, formData);
        setGuardado(true);
        router.refresh();
        setTimeout(() => setGuardado(false), 2000);
      }}
      className="competition-sheet max-w-2xl space-y-5 border-y border-chalk p-5 sm:p-7"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" name="nombre" defaultValue={atleta.nombre} required />
        </div>
        <div>
          <Label htmlFor="apellido">Apellido</Label>
          <Input
            id="apellido"
            name="apellido"
            defaultValue={atleta.apellido}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="telefono">Teléfono para WhatsApp</Label>
        <Input
          id="telefono"
          name="telefono"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={atleta.telefonoE164 ?? ""}
          placeholder="+5491112345678"
          required
        />
        <p className="mt-1.5 text-xs text-chalk-faint">
          Formato E.164, sin espacios. Cambiarlo invalida la verificación anterior.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
          <Input
            id="fechaNacimiento"
            name="fechaNacimiento"
            type="date"
            defaultValue={
              atleta.fechaNacimiento
                ? new Date(atleta.fechaNacimiento).toISOString().slice(0, 10)
                : ""
            }
          />
        </div>
        <div>
          <Label htmlFor="categoria">Categoría</Label>
          <Input
            id="categoria"
            name="categoria"
            defaultValue={atleta.categoria ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sexo">Sexo</Label>
          <select
            id="sexo"
            name="sexo"
            defaultValue={atleta.sexo ?? ""}
            className="w-full border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-chalk outline-none focus:border-steel"
          >
            <option value="">Sin especificar</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="pesoCorporal">Peso corporal (kg)</Label>
          <Input
            id="pesoCorporal"
            name="pesoCorporal"
            type="number"
            step="0.1"
            defaultValue={atleta.pesoCorporal ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="altura">Altura (cm)</Label>
          <Input
            id="altura"
            name="altura"
            type="number"
            step="0.1"
            defaultValue={atleta.altura ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="estado">Estado</Label>
          <select
            id="estado"
            name="estado"
            defaultValue={atleta.estado}
            className="w-full border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-chalk outline-none focus:border-steel"
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="notas">Notas</Label>
        <textarea
          id="notas"
          name="notas"
          rows={3}
          defaultValue={atleta.notas ?? ""}
          className="w-full border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-chalk outline-none focus:border-steel"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit">Guardar cambios</Button>
        {guardado && (
          <span className="text-sm text-success">Guardado ✓</span>
        )}
      </div>

      <div className="border-t border-border pt-4">
        {confirmandoBorrado ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-chalk-muted">
              ¿Seguro que querés eliminar a este atleta? Se borra todo su
              historial.
            </span>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => eliminarAtleta(atleta.id)}
            >
              Sí, eliminar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmandoBorrado(false)}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setConfirmandoBorrado(true)}
          >
            Eliminar atleta
          </Button>
        )}
      </div>
    </form>
  );
}
