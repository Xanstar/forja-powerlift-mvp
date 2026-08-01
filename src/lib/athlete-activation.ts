import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const ACTIVATION_CODE_TTL_MS = 10 * 60 * 1000;
export const ACTIVATION_RESEND_COOLDOWN_MS = 60 * 1000;
export const ACTIVATION_MAX_ATTEMPTS = 5;

export function normalizePhoneE164(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const phone = value.trim();
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}

export function createActivationCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashActivationCode(
  challengeId: string,
  phone: string,
  code: string,
  secret: string
) {
  return createHmac("sha256", secret)
    .update(`${challengeId}.${phone}.${code}`)
    .digest("base64url");
}

export function verifyActivationCode(
  expectedHash: string,
  challengeId: string,
  phone: string,
  code: string,
  secret: string
) {
  const actual = Buffer.from(
    hashActivationCode(challengeId, phone, code, secret)
  );
  const expected = Buffer.from(expectedHash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function canSendActivation(sentAt: Date | null, now = new Date()) {
  return !sentAt || now.getTime() - sentAt.getTime() >= ACTIVATION_RESEND_COOLDOWN_MS;
}

export function legacyPinAccessEnabled(value = process.env.ATHLETE_LEGACY_PIN_ENABLED) {
  return value?.trim().toLowerCase() !== "false";
}
