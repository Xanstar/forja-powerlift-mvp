import { randomBytes } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { athleteAccessTokens, athletes } from "@/db/schema";
import {
  type AthleteCredentialClaims,
  createAthleteAccessToken,
  hashAthleteAccessToken,
} from "@/lib/athlete-credential";

const TOKEN_GENERATION_ATTEMPTS = 3;
export type AthleteAccessTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export function createDisabledAthleteAccessPin() {
  return `disabled_${randomBytes(16).toString("hex")}`;
}

function isTokenHashCollision(error: unknown) {
  let current: unknown = error;
  while (current instanceof Error) {
    if (
      /UNIQUE constraint failed: athlete_access_tokens\.token_hash/.test(
        current.message
      )
    ) {
      return true;
    }
    current = current.cause;
  }
  return false;
}

export async function issueAthleteAccessToken(
  database: typeof db,
  athleteId: string,
  pepper: string,
  now = new Date(),
  tokenFactory = createAthleteAccessToken,
  beforeIssue?: (transaction: AthleteAccessTransaction) => Promise<void>
) {
  for (let attempt = 0; attempt < TOKEN_GENERATION_ATTEMPTS; attempt += 1) {
    const token = tokenFactory();
    const tokenHash = hashAthleteAccessToken(token, pepper);
    try {
      const credentialVersion = await database.transaction(async (tx) => {
        await beforeIssue?.(tx);
        const updated = await tx
          .update(athletes)
          .set({
            credentialVersion: sql`${athletes.credentialVersion} + 1`,
            accessPin: createDisabledAthleteAccessPin(),
          })
          .where(eq(athletes.id, athleteId))
          .returning({ credentialVersion: athletes.credentialVersion });
        if (!updated[0]) throw new Error("Athlete not found");

        await tx
          .insert(athleteAccessTokens)
          .values({
            athleteId,
            tokenHash,
            credentialVersion: updated[0].credentialVersion,
            issuedAt: now,
          })
          .onConflictDoUpdate({
            target: athleteAccessTokens.athleteId,
            set: {
              tokenHash,
              credentialVersion: updated[0].credentialVersion,
              issuedAt: now,
              rotatedAt: now,
              revokedAt: null,
            },
          });
        return updated[0].credentialVersion;
      });
      return { token, credentialVersion };
    } catch (error) {
      if (!isTokenHashCollision(error) || attempt === TOKEN_GENERATION_ATTEMPTS - 1) {
        throw error;
      }
    }
  }
  throw new Error("Unable to issue athlete access token");
}

export async function athleteForCredentialClaims(
  database: typeof db,
  claims: AthleteCredentialClaims
) {
  return database.query.athletes.findFirst({
    columns: { id: true },
    where: and(
      eq(athletes.id, claims.athleteId),
      eq(athletes.credentialVersion, claims.credentialVersion),
      eq(athletes.estado, "activo")
    ),
  });
}

export async function athleteForAccessToken(
  database: typeof db,
  token: string,
  pepper: string
) {
  const rows = await database
    .select({
      athleteId: athletes.id,
      nombre: athletes.nombre,
      credentialVersion: athletes.credentialVersion,
    })
    .from(athleteAccessTokens)
    .innerJoin(athletes, eq(athleteAccessTokens.athleteId, athletes.id))
    .where(
      and(
        eq(
          athleteAccessTokens.tokenHash,
          hashAthleteAccessToken(token, pepper)
        ),
        isNull(athleteAccessTokens.revokedAt),
        eq(athleteAccessTokens.credentialVersion, athletes.credentialVersion),
        eq(athletes.estado, "activo")
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function authenticateAthleteAccess(
  database: typeof db,
  credential: string,
  pepper: string,
  legacyEnabled: boolean
) {
  const tokenAthlete = await athleteForAccessToken(
    database,
    credential,
    pepper
  );
  if (tokenAthlete) return tokenAthlete;
  if (!legacyEnabled || !/^\d{4,6}$/.test(credential)) return null;

  const athlete = await database.query.athletes.findFirst({
    columns: { id: true, nombre: true, credentialVersion: true },
    where: and(
      eq(athletes.accessPin, credential),
      eq(athletes.estado, "activo")
    ),
  });
  return athlete
    ? {
        athleteId: athlete.id,
        nombre: athlete.nombre,
        credentialVersion: athlete.credentialVersion,
      }
    : null;
}

export async function revokeAthleteAccessToken(
  database: typeof db,
  athleteId: string,
  now = new Date()
) {
  await database.transaction(async (tx) => {
    await tx
      .update(athletes)
      .set({
        credentialVersion: sql`${athletes.credentialVersion} + 1`,
        accessPin: createDisabledAthleteAccessPin(),
      })
      .where(eq(athletes.id, athleteId));
    await tx
      .update(athleteAccessTokens)
      .set({ revokedAt: now })
      .where(eq(athleteAccessTokens.athleteId, athleteId));
  });
}
