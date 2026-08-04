import { randomBytes } from "node:crypto";
import { fingerprintAccessKey } from "@/lib/athlete-credential";

export const RATE_LIMIT_CLIENT_COOKIE = "forja-rate-limit-client";
export const RATE_LIMIT_CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{32}$/;

export function createRateLimitClientId(
  random: (size: number) => Buffer = randomBytes
) {
  return random(24).toString("base64url");
}

export function resolveRateLimitClientId(
  existing: string | undefined,
  create = createRateLimitClientId
) {
  return RATE_LIMIT_CLIENT_ID_PATTERN.test(existing ?? "")
    ? { id: existing!, created: false }
    : { id: create(), created: true };
}

export function fingerprintRateLimitClient(
  clientId: string,
  trustedAddresses: string[],
  secret: string
) {
  return fingerprintAccessKey(
    "client",
    [clientId, ...trustedAddresses].join("\0"),
    secret
  );
}
