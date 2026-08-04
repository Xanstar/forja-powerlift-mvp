"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  cleanupAccessRateLimits,
  consumeAccessAttempt,
  resetAccessAttempts,
} from "@/lib/access-rate-limit";
import { legacyPinAccessEnabled } from "@/lib/athlete-activation";
import { authenticateAthleteAccess } from "@/lib/athlete-access-token";
import {
  ATHLETE_ACCESS_TOKEN_PATTERN,
  fingerprintAccessKey,
} from "@/lib/athlete-credential";
import { athleteClientFingerprint } from "@/lib/request-fingerprint";
import {
  clearAthleteAccess,
  establishAthleteAccess,
} from "@/lib/server-authorization";

export type AthleteAccessState = {
  status: "idle" | "error";
  message: string;
};

const GENERIC_ACCESS_ERROR =
  "No pudimos validar el acceso. Revisá la credencial o intentá más tarde.";
const CLIENT_SCOPE = "athlete-access-client";
const CREDENTIAL_SCOPE = "athlete-access-credential";

function authSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("La autenticación del servidor no está configurada.");
  return value;
}

export async function exchangeAthleteAccess(
  _previousState: AthleteAccessState,
  formData: FormData
): Promise<AthleteAccessState> {
  const credential = String(formData.get("credential") ?? "").trim();
  const secret = authSecret();
  await cleanupAccessRateLimits(db);
  const keys = [
    {
      scope: CLIENT_SCOPE,
      keyHash: await athleteClientFingerprint(secret),
      maxAttempts: 10,
    },
    {
      scope: CREDENTIAL_SCOPE,
      keyHash: fingerprintAccessKey(CREDENTIAL_SCOPE, credential, secret),
      maxAttempts: 5,
    },
  ];
  const limits = await Promise.all(
    keys.map((key) =>
      consumeAccessAttempt(db, key.scope, key.keyHash, {
        maxAttempts: key.maxAttempts,
      })
    )
  );
  if (limits.some((limit) => limit.limited)) {
    return { status: "error", message: GENERIC_ACCESS_ERROR };
  }

  const athlete = ATHLETE_ACCESS_TOKEN_PATTERN.test(credential) || legacyPinAccessEnabled()
    ? await authenticateAthleteAccess(
        db,
        credential,
        secret,
        legacyPinAccessEnabled()
      )
    : null;
  if (!athlete) {
    return { status: "error", message: GENERIC_ACCESS_ERROR };
  }

  await resetAccessAttempts(
    db,
    keys.map(({ scope, keyHash }) => ({ scope, keyHash }))
  );
  await establishAthleteAccess(athlete.athleteId, athlete.credentialVersion);
  redirect("/hoy");
}

export async function logoutAthlete() {
  await clearAthleteAccess();
  redirect("/hoy");
}
