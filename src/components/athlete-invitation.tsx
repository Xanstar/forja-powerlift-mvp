"use client";

import { useActionState } from "react";
import {
  sendAthleteInvitation,
  type InvitationState,
} from "@/lib/actions/athlete-onboarding";
import { Button } from "@/components/ui/button";

const initialState: InvitationState = { status: "idle", message: "" };

export function AthleteInvitation({ athleteId }: { athleteId: string }) {
  const [state, action, pending] = useActionState(
    sendAthleteInvitation.bind(null, athleteId),
    initialState
  );

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Enviando..." : "Enviar invitación"}
      </Button>
      <p
        aria-live="polite"
        className={
          state.status === "error"
            ? "text-sm text-accent"
            : "text-sm text-success"
        }
      >
        {state.message}
      </p>
    </form>
  );
}
