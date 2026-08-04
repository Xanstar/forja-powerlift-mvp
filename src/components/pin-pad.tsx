"use client";

import { useActionState } from "react";
import {
  exchangeAthleteAccess,
  type AthleteAccessState,
} from "@/lib/actions/athlete-access";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const initialState: AthleteAccessState = { status: "idle", message: "" };

export function PinPad({ legacyEnabled }: { legacyEnabled: boolean }) {
  const [state, action, pending] = useActionState(
    exchangeAthleteAccess,
    initialState
  );

  return (
    <form action={action} className="mt-8 w-full max-w-sm space-y-4">
      <div>
        <Label htmlFor="athlete-credential">Credencial de acceso</Label>
        <Input
          id="athlete-credential"
          name="credential"
          type="password"
          autoComplete="current-password"
          maxLength={128}
          required
        />
        <p className="mt-2 text-sm text-chalk-muted">
          {legacyEnabled
            ? "Durante la transición también podés usar tu PIN legado."
            : "Usá la credencial entregada al activar o rotar tu acceso."}
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Validando..." : "Entrar"}
      </Button>
      <p aria-live="polite" className="min-h-5 text-sm text-accent-ink">
        {state.message}
      </p>
    </form>
  );
}
