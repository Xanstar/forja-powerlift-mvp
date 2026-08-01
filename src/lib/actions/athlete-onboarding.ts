"use server";

import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { athleteActivationChallenges, athletes } from "@/db/schema";
import {
  ACTIVATION_MAX_ATTEMPTS,
  normalizePhoneE164,
  verifyActivationCode,
} from "@/lib/athlete-activation";
import { establishAthleteAccess } from "@/lib/server-authorization";

export type ActivationState = { status: "idle" | "error"; message: string };

const GENERIC_ACTIVATION_ERROR =
  "No pudimos validar esos datos. Revisá el teléfono y el código, o pedile una nueva invitación a tu entrenador.";

function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("La autenticación del servidor no está configurada.");
  return secret;
}

export async function activateAthlete(
  _previousState: ActivationState,
  formData: FormData
): Promise<ActivationState> {
  const phone = normalizePhoneE164(formData.get("telefono"));
  const code = String(formData.get("codigo") ?? "").trim();
  if (!phone || !/^\d{6}$/.test(code)) {
    return { status: "error", message: GENERIC_ACTIVATION_ERROR };
  }

  const athlete = await db.query.athletes.findFirst({
    where: eq(athletes.telefonoE164, phone),
  });
  if (!athlete) {
    return { status: "error", message: GENERIC_ACTIVATION_ERROR };
  }

  const challenge = await db.query.athleteActivationChallenges.findFirst({
    where: eq(athleteActivationChallenges.athleteId, athlete.id),
  });
  const now = new Date();
  if (
    !challenge ||
    challenge.consumedAt ||
    challenge.expiresAt <= now ||
    challenge.attempts >= ACTIVATION_MAX_ATTEMPTS
  ) {
    return { status: "error", message: GENERIC_ACTIVATION_ERROR };
  }

  if (
    !verifyActivationCode(
      challenge.codeHash,
      challenge.id,
      phone,
      code,
      authSecret()
    )
  ) {
    await db
      .update(athleteActivationChallenges)
      .set({ attempts: challenge.attempts + 1 })
      .where(
        and(
          eq(athleteActivationChallenges.id, challenge.id),
          eq(athleteActivationChallenges.attempts, challenge.attempts),
          isNull(athleteActivationChallenges.consumedAt)
        )
      );
    return { status: "error", message: GENERIC_ACTIVATION_ERROR };
  }

  const consumed = await db
    .update(athleteActivationChallenges)
    .set({ consumedAt: now })
    .where(
      and(
        eq(athleteActivationChallenges.id, challenge.id),
        isNull(athleteActivationChallenges.consumedAt),
        lt(athleteActivationChallenges.attempts, ACTIVATION_MAX_ATTEMPTS),
        gt(athleteActivationChallenges.expiresAt, now)
      )
    )
    .returning({ id: athleteActivationChallenges.id });
  if (consumed.length !== 1) {
    return { status: "error", message: GENERIC_ACTIVATION_ERROR };
  }

  await db
    .update(athletes)
    .set({ telefonoVerificadoAt: now })
    .where(and(eq(athletes.id, athlete.id), eq(athletes.telefonoE164, phone)));
  await establishAthleteAccess(athlete.id);
  redirect(`/hoy/${athlete.accessPin}`);
}
