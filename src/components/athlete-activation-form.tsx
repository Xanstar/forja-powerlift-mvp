"use client";

import { useActionState } from "react";
import {
  activateAthlete,
  type ActivationState,
} from "@/lib/actions/athlete-onboarding";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const initialState: ActivationState = { status: "idle", message: "" };

export function AthleteActivationForm() {
  const [state, action, pending] = useActionState(activateAthlete, initialState);

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          name="telefono"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+5491112345678"
          required
        />
      </div>
      <div>
        <Label htmlFor="codigo">Código de 6 dígitos</Label>
        <Input
          id="codigo"
          name="codigo"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Verificando..." : "Activar acceso"}
      </Button>
      <p aria-live="polite" className="min-h-5 text-sm text-accent">
        {state.message}
      </p>
    </form>
  );
}
