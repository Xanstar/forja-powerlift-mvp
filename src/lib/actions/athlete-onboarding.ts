"use server";

import { randomUUID } from "node:crypto";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { athleteActivationChallenges, athletes } from "@/db/schema";
import {
  ACTIVATION_CODE_TTL_MS,
  ACTIVATION_MAX_ATTEMPTS,
  canSendActivation,
  createActivationCode,
  hashActivationCode,
  normalizePhoneE164,
  verifyActivationCode,
} from "@/lib/athlete-activation";
import {
  activationUrlFromEnv,
  createEvolutionClient,
  EvolutionConfigurationError,
  evolutionConfigFromEnv,
} from "@/lib/evolution-client";
import {
  establishAthleteAccess,
  requireCoachResource,
} from "@/lib/server-authorization";

export type InvitationState = {
  status: "idle" | "success" | "error";
  message: string;
};
export type ActivationState = { status: "idle" | "error"; message: string };

const GENERIC_ACTIVATION_ERROR =
  "No pudimos validar esos datos. Revisá el teléfono y el código, o pedile una nueva invitación a tu entrenador.";

function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("La autenticación del servidor no está configurada.");
  return secret;
}

export async function sendAthleteInvitation(
  athleteId: string,
  _previousState: InvitationState
): Promise<InvitationState> {
  await requireCoachResource("athlete", athleteId);
  const athlete = await db.query.athletes.findFirst({
    where: eq(athletes.id, athleteId),
  });
  if (!athlete?.telefonoE164) {
    return {
      status: "error",
      message: "Guardá un teléfono E.164 antes de enviar la invitación.",
    };
  }

  let client: ReturnType<typeof createEvolutionClient>;
  let activationUrl: string;
  try {
    client = createEvolutionClient(evolutionConfigFromEnv());
    activationUrl = activationUrlFromEnv();
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof EvolutionConfigurationError
          ? error.message
          : "No se pudo preparar el envío de WhatsApp.",
    };
  }

  const previous = await db.query.athleteActivationChallenges.findFirst({
    where: eq(athleteActivationChallenges.athleteId, athleteId),
  });
  const now = new Date();
  if (previous && !canSendActivation(previous.sentAt, now)) {
    return {
      status: "error",
      message: "Esperá un minuto antes de reenviar la invitación.",
    };
  }

  const challengeId = randomUUID();
  const code = createActivationCode();
  const codeHash = hashActivationCode(
    challengeId,
    athlete.telefonoE164,
    code,
    authSecret()
  );
  await db
    .insert(athleteActivationChallenges)
    .values({
      id: challengeId,
      athleteId,
      codeHash,
      expiresAt: new Date(now.getTime() + ACTIVATION_CODE_TTL_MS),
      attempts: 0,
      sentAt: now,
      consumedAt: null,
    })
    .onConflictDoUpdate({
      target: athleteActivationChallenges.athleteId,
      set: {
        id: challengeId,
        codeHash,
        expiresAt: new Date(now.getTime() + ACTIVATION_CODE_TTL_MS),
        attempts: 0,
        sentAt: now,
        consumedAt: null,
      },
    });

  try {
    await client.sendText(
      athlete.telefonoE164,
      `Forja: tu código de activación es ${code}. Vence en 10 minutos. Ingresalo junto con tu teléfono en ${activationUrl}. Si no esperabas este mensaje, ignoralo.`
    );
  } catch (error) {
    await db
      .delete(athleteActivationChallenges)
      .where(eq(athleteActivationChallenges.id, challengeId));
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "No se pudo enviar la invitación por WhatsApp.",
    };
  }

  await db
    .update(athletes)
    .set({ invitacionEnviadaAt: now })
    .where(eq(athletes.id, athleteId));
  revalidatePath(`/atletas/${athleteId}`);
  return { status: "success", message: "Invitación enviada por WhatsApp." };
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
