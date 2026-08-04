import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { athleteActivationChallenges, athletes } from "@/db/schema";
import { ACTIVATION_MAX_ATTEMPTS } from "@/lib/athlete-activation";
import { issueAthleteAccessToken } from "@/lib/athlete-access-token";
import { createAthleteAccessToken } from "@/lib/athlete-credential";

export async function commitAthleteActivation(
  database: typeof db,
  input: {
    athleteId: string;
    challengeId: string;
    phone: string;
    secret: string;
    now: Date;
  },
  tokenFactory: () => string = createAthleteAccessToken
) {
  return issueAthleteAccessToken(
    database,
    input.athleteId,
    input.secret,
    input.now,
    tokenFactory,
    async (tx) => {
      const consumed = await tx
        .update(athleteActivationChallenges)
        .set({ consumedAt: input.now })
        .where(
          and(
            eq(athleteActivationChallenges.id, input.challengeId),
            isNull(athleteActivationChallenges.consumedAt),
            lt(athleteActivationChallenges.attempts, ACTIVATION_MAX_ATTEMPTS),
            gt(athleteActivationChallenges.expiresAt, input.now)
          )
        )
        .returning({ id: athleteActivationChallenges.id });
      if (consumed.length !== 1) throw new Error("Activation commit rejected");

      const verified = await tx
        .update(athletes)
        .set({ telefonoVerificadoAt: input.now })
        .where(
          and(
            eq(athletes.id, input.athleteId),
            eq(athletes.telefonoE164, input.phone)
          )
        )
        .returning({ id: athletes.id });
      if (verified.length !== 1) throw new Error("Activation commit rejected");
    }
  );
}
