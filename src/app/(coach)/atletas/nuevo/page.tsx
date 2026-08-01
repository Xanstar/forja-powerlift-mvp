import { crearAtleta } from "@/lib/actions/athletes";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NuevoAtletaPage() {
  return (
    <div className="max-w-2xl">
      <Link
        href="/atletas"
        className="mb-4 flex items-center gap-1 text-sm text-chalk-muted hover:text-chalk"
      >
        <ArrowLeft size={14} /> Atletas
      </Link>
      <h1 className="font-display text-4xl font-bold tracking-[-0.04em] text-chalk">
        Nuevo atleta
      </h1>

      <form action={crearAtleta} className="competition-sheet mt-8 space-y-5 border-y border-chalk p-5 sm:p-7">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" required />
          </div>
          <div>
            <Label htmlFor="apellido">Apellido</Label>
            <Input id="apellido" name="apellido" required />
          </div>
        </div>

        <div>
          <Label htmlFor="telefono">Teléfono para invitación por WhatsApp</Label>
          <Input
            id="telefono"
            name="telefono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+5491112345678"
            required
            aria-describedby="telefono-ayuda"
          />
          <p id="telefono-ayuda" className="mt-1.5 text-xs text-chalk-faint">
            Formato E.164: signo +, código de país y número, sin espacios.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
            <Input id="fechaNacimiento" name="fechaNacimiento" type="date" />
          </div>
          <div>
            <Label htmlFor="categoria">Categoría</Label>
            <Input
              id="categoria"
              name="categoria"
              placeholder="Ej. -83kg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sexo">Sexo</Label>
            <select
              id="sexo"
              name="sexo"
              className="w-full border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-chalk outline-none focus:border-steel"
              defaultValue=""
            >
              <option value="">Sin especificar</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
            </select>
          </div>
          <div />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pesoCorporal">Peso corporal (kg)</Label>
            <Input
              id="pesoCorporal"
              name="pesoCorporal"
              type="number"
              step="0.1"
            />
          </div>
          <div>
            <Label htmlFor="altura">Altura (cm)</Label>
            <Input id="altura" name="altura" type="number" step="0.1" />
          </div>
        </div>

        <div>
          <Label htmlFor="notas">Notas</Label>
          <textarea
            id="notas"
            name="notas"
            rows={3}
            className="w-full border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-chalk placeholder:text-chalk-faint outline-none transition-colors focus:border-steel"
            placeholder="Lesiones, objetivos, contexto general..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit">Crear atleta</Button>
          <Link href="/atletas">
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
