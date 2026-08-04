import "server-only";

import { isIP } from "node:net";
import { cookies, headers } from "next/headers";
import {
  RATE_LIMIT_CLIENT_COOKIE,
  fingerprintRateLimitClient,
  resolveRateLimitClientId,
} from "@/lib/rate-limit-client";

const CLIENT_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

function trustedProxyAddresses(headerList: Headers) {
  if (process.env.ATHLETE_TRUST_PROXY_HEADERS !== "true") return [];
  const realIp = headerList.get("x-real-ip")?.trim() ?? "";
  const forwardedIp =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  return [realIp, forwardedIp].filter(
    (value, index, values) => isIP(value) && values.indexOf(value) === index
  );
}

export async function athleteClientFingerprint(secret: string) {
  const cookieStore = await cookies();
  const client = resolveRateLimitClientId(
    cookieStore.get(RATE_LIMIT_CLIENT_COOKIE)?.value
  );
  if (client.created) {
    cookieStore.set(RATE_LIMIT_CLIENT_COOKIE, client.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: CLIENT_COOKIE_MAX_AGE,
    });
  }
  return fingerprintRateLimitClient(
    client.id,
    trustedProxyAddresses(await headers()),
    secret
  );
}
