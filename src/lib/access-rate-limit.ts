import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { accessRateLimits } from "@/db/schema";

export const ACCESS_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const ACCESS_RATE_LIMIT_LOCKOUT_MS = 30 * 60 * 1000;
export const ACCESS_RATE_LIMIT_RETENTION_MS = 2 * 24 * 60 * 60 * 1000;

export type AccessRateLimitPolicy = {
  maxAttempts: number;
  windowMs?: number;
  lockoutMs?: number;
};

export async function consumeAccessAttempt(
  database: typeof db,
  scope: string,
  keyHash: string,
  policy: AccessRateLimitPolicy,
  now = Date.now()
) {
  const windowMs = policy.windowMs ?? ACCESS_RATE_LIMIT_WINDOW_MS;
  const lockoutMs = policy.lockoutMs ?? ACCESS_RATE_LIMIT_LOCKOUT_MS;
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const lockedUntilCandidate = now + lockoutMs;

  const rows = await database
    .insert(accessRateLimits)
    .values({
      scope,
      keyHash,
      windowStartMs,
      attemptCount: 1,
      lockedUntilMs: null,
      updatedAtMs: now,
    })
    .onConflictDoUpdate({
      target: [accessRateLimits.scope, accessRateLimits.keyHash],
      set: {
        windowStartMs: sql`CASE WHEN ${accessRateLimits.lockedUntilMs} > ${now} THEN ${accessRateLimits.windowStartMs} WHEN ${accessRateLimits.windowStartMs} < ${windowStartMs} OR ${accessRateLimits.lockedUntilMs} <= ${now} THEN ${windowStartMs} ELSE ${accessRateLimits.windowStartMs} END`,
        attemptCount: sql`CASE WHEN ${accessRateLimits.lockedUntilMs} > ${now} THEN ${accessRateLimits.attemptCount} WHEN ${accessRateLimits.windowStartMs} < ${windowStartMs} OR ${accessRateLimits.lockedUntilMs} <= ${now} THEN 1 ELSE ${accessRateLimits.attemptCount} + 1 END`,
        lockedUntilMs: sql`CASE WHEN ${accessRateLimits.lockedUntilMs} > ${now} THEN ${accessRateLimits.lockedUntilMs} WHEN ${accessRateLimits.windowStartMs} < ${windowStartMs} OR ${accessRateLimits.lockedUntilMs} <= ${now} THEN NULL WHEN ${accessRateLimits.attemptCount} >= ${policy.maxAttempts} THEN ${lockedUntilCandidate} ELSE NULL END`,
        updatedAtMs: now,
      },
    })
    .returning({
      attemptCount: accessRateLimits.attemptCount,
      lockedUntilMs: accessRateLimits.lockedUntilMs,
    });

  return {
    limited: rows[0].lockedUntilMs != null && rows[0].lockedUntilMs > now,
    attemptCount: rows[0].attemptCount,
    lockedUntilMs: rows[0].lockedUntilMs,
  };
}

export async function resetAccessAttempts(
  database: typeof db,
  keys: { scope: string; keyHash: string }[]
) {
  for (const key of keys) {
    await database
      .delete(accessRateLimits)
      .where(
        and(
          eq(accessRateLimits.scope, key.scope),
          eq(accessRateLimits.keyHash, key.keyHash)
        )
      );
  }
}

export async function cleanupAccessRateLimits(
  database: typeof db,
  now = Date.now()
) {
  await database
    .delete(accessRateLimits)
    .where(
      lt(
        accessRateLimits.updatedAtMs,
        now - ACCESS_RATE_LIMIT_RETENTION_MS
      )
    );
}
