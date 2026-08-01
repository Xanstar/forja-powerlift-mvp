import { createHmac, timingSafeEqual } from "node:crypto";

const CREDENTIAL_TTL_SECONDS = 8 * 60 * 60;

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAthleteCredential(
  athleteId: string,
  secret: string,
  now = Date.now()
) {
  const expiresAt = Math.floor(now / 1000) + CREDENTIAL_TTL_SECONDS;
  const payload = `${athleteId}.${expiresAt}`;
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyAthleteCredential(
  credential: string | undefined,
  secret: string,
  now = Date.now()
): string | null {
  if (!credential || !secret) return null;
  const [athleteId, expiresRaw, providedSignature, extra] = credential.split(".");
  const expiresAt = Number(expiresRaw);
  if (
    extra != null ||
    !athleteId ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Math.floor(now / 1000) ||
    !providedSignature
  ) {
    return null;
  }

  const expectedSignature = signature(`${athleteId}.${expiresAt}`, secret);
  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return null;
  }
  return athleteId;
}
