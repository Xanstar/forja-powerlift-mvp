import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const CREDENTIAL_TTL_SECONDS = 8 * 60 * 60;
export const ATHLETE_ACCESS_COOKIE = "forja-athlete-access";

export function clearAthleteCredentialCookie(cookieStore: {
  delete(name: string): unknown;
}) {
  cookieStore.delete(ATHLETE_ACCESS_COOKIE);
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAthleteCredential(
  athleteId: string,
  credentialVersion: number,
  secret: string,
  now = Date.now()
) {
  const expiresAt = Math.floor(now / 1000) + CREDENTIAL_TTL_SECONDS;
  const payload = `${athleteId}.${credentialVersion}.${expiresAt}`;
  return `${payload}.${signature(payload, secret)}`;
}

export type AthleteCredentialClaims = {
  athleteId: string;
  credentialVersion: number;
};

export function verifyAthleteCredential(
  credential: string | undefined,
  secret: string,
  now = Date.now()
): AthleteCredentialClaims | null {
  if (!credential || !secret) return null;
  const [athleteId, versionRaw, expiresRaw, providedSignature, extra] =
    credential.split(".");
  const credentialVersion = Number(versionRaw);
  const expiresAt = Number(expiresRaw);
  if (
    extra != null ||
    !athleteId ||
    !Number.isSafeInteger(credentialVersion) ||
    credentialVersion < 0 ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Math.floor(now / 1000) ||
    !providedSignature
  ) {
    return null;
  }

  const expectedSignature = signature(
    `${athleteId}.${credentialVersion}.${expiresAt}`,
    secret
  );
  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return null;
  }
  return { athleteId, credentialVersion };
}

export const ATHLETE_ACCESS_TOKEN_BYTES = 32;
export const ATHLETE_ACCESS_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function createAthleteAccessToken(
  random: (size: number) => Buffer = randomBytes
) {
  return random(ATHLETE_ACCESS_TOKEN_BYTES).toString("base64url");
}

export function hashAthleteAccessToken(token: string, pepper: string) {
  return createHmac("sha256", pepper)
    .update(`athlete-access-token\0${token}`)
    .digest("base64url");
}

export function fingerprintAccessKey(
  scope: string,
  value: string,
  pepper: string
) {
  return createHmac("sha256", pepper)
    .update(`rate-limit\0${scope}\0${value}`)
    .digest("base64url");
}
