"use client";

import { useActionState } from "react";
import {
  submitAccessRequest,
  type AccessRequestState,
} from "@/lib/actions/access-request";

const initialState: AccessRequestState = { status: "idle", message: "" };

export function AccessRequestForm() {
  const [state, action, pending] = useActionState(submitAccessRequest, initialState);

  if (state.status === "success") {
    return (
      <div className="access-form-success" role="status">
        <span className="competition-stamp border-success text-success">Solicitud recibida</span>
        <h3>Gracias por tu interés en Forja.</h3>
        <p>{state.message}</p>
      </div>
    );
  }

  const errorId = (field: keyof NonNullable<AccessRequestState["fieldErrors"]>) =>
    state.fieldErrors?.[field] ? `${field}-error` : undefined;

  return (
    <form action={action} className="access-form" noValidate>
      <div className="access-form-grid">
        <div className="access-field">
          <label htmlFor="name">Nombre y apellido</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            minLength={2}
            maxLength={80}
            aria-describedby={errorId("name")}
            aria-invalid={Boolean(state.fieldErrors?.name)}
            required
          />
          {state.fieldErrors?.name && <p id="name-error">{state.fieldErrors.name}</p>}
        </div>
        <div className="access-field">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={254}
            aria-describedby={errorId("email")}
            aria-invalid={Boolean(state.fieldErrors?.email)}
            required
          />
          {state.fieldErrors?.email && <p id="email-error">{state.fieldErrors.email}</p>}
        </div>
        <div className="access-field">
          <label htmlFor="organization">Gimnasio o equipo <span>(opcional)</span></label>
          <input
            id="organization"
            name="organization"
            type="text"
            autoComplete="organization"
            maxLength={120}
            aria-describedby={errorId("organization")}
            aria-invalid={Boolean(state.fieldErrors?.organization)}
          />
          {state.fieldErrors?.organization && (
            <p id="organization-error">{state.fieldErrors.organization}</p>
          )}
        </div>
        <fieldset className="access-field access-profile">
          <legend>Quiero usar Forja como</legend>
          <label><input type="radio" name="profile" value="coach" required /> Coach</label>
          <label><input type="radio" name="profile" value="gym" required /> Gimnasio</label>
          {state.fieldErrors?.profile && <p id="profile-error">{state.fieldErrors.profile}</p>}
        </fieldset>
      </div>
      <div className="access-honeypot" aria-hidden="true">
        <label htmlFor="website">Sitio web</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {state.status === "error" && (
        <p className="access-form-error" role="alert">{state.message}</p>
      )}
      <div className="access-form-submit">
        <button type="submit" disabled={pending}>
          {pending ? "Enviando solicitud..." : "Solicitar acceso"}
        </button>
        <p>Usaremos estos datos únicamente para responder tu solicitud.</p>
      </div>
    </form>
  );
}
