"use server";

import { db } from "@/db";
import { parseAccessRequest, persistAccessRequest } from "@/lib/access-request";

export type AccessRequestState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<"name" | "email" | "organization" | "profile", string>>;
};

const successState: AccessRequestState = {
  status: "success",
  message: "Recibimos tu solicitud. Nos pondremos en contacto por correo electrónico.",
};

export async function submitAccessRequest(
  _previousState: AccessRequestState,
  formData: FormData
): Promise<AccessRequestState> {
  // Bots commonly fill hidden fields. Return the normal response without storing it.
  if (String(formData.get("website") ?? "").trim()) return successState;

  const parsed = parseAccessRequest(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      message: "Revisá los campos indicados e intentá nuevamente.",
      fieldErrors: {
        name: errors.name?.[0] ? "Ingresá tu nombre (2 a 80 caracteres)." : undefined,
        email: errors.email?.[0] ? "Ingresá un correo electrónico válido." : undefined,
        organization: errors.organization?.[0]
          ? "Usá hasta 120 caracteres."
          : undefined,
        profile: errors.profile?.[0] ? "Elegí el tipo de operación." : undefined,
      },
    };
  }

  try {
    await persistAccessRequest(db, parsed.data);
    return successState;
  } catch {
    return {
      status: "error",
      message: "No pudimos guardar la solicitud. Intentá nuevamente en unos minutos.",
    };
  }
}
