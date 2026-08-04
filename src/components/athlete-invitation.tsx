"use client";

import { useActionState } from "react";
import {
  revokeAthleteAccess,
  rotateAthleteAccess,
  sendAthleteInvitation,
  type AthleteCredentialState,
  type InvitationState,
} from "@/lib/actions/athlete-onboarding";
import { Button } from "@/components/ui/button";

const initialState: InvitationState = { status: "idle", message: "" };
const initialCredentialState: AthleteCredentialState = {
  status: "idle",
  message: "",
};

export function AthleteInvitation({ athleteId }: { athleteId: string }) {
  const [state, action, pending] = useActionState(
    sendAthleteInvitation.bind(null, athleteId),
    initialState
  );
  const [rotation, rotateAction, rotating] = useActionState(
    rotateAthleteAccess.bind(null, athleteId),
    initialCredentialState
  );
  const [revocation, revokeAction, revoking] = useActionState(
    revokeAthleteAccess.bind(null, athleteId),
    initialCredentialState
  );

  return (
    <div className="space-y-3">
      <form action={action} className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Enviando..." : "Enviar invitación"}
        </Button>
        <p aria-live="polite" className={state.status === "error" ? "text-sm text-accent-ink" : "text-sm text-success"}>
          {state.message}
        </p>
      </form>
      <div className="flex flex-wrap gap-2">
        <form action={rotateAction}>
          <Button type="submit" size="sm" variant="secondary" disabled={rotating}>
            {rotating ? "Rotando..." : "Rotar credencial"}
          </Button>
        </form>
        <form action={revokeAction}>
          <Button type="submit" size="sm" variant="secondary" disabled={revoking}>
            {revoking ? "Revocando..." : "Revocar acceso"}
          </Button>
        </form>
      </div>
      {(rotation.message || revocation.message) && (
        <p aria-live="polite" className="text-sm text-success">
          {rotation.message || revocation.message}
        </p>
      )}
      {rotation.accessToken && (
        <div className="border border-success bg-success-soft p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-success">
            Nueva credencial (se muestra una sola vez)
          </p>
          <code className="mt-2 block break-all text-sm text-chalk">
            {rotation.accessToken}
          </code>
        </div>
      )}
    </div>
  );
}
