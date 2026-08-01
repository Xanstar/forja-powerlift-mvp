import "server-only";

import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  athletes,
  days,
  exercises,
  plannedSets,
  programs,
  records,
  weeks,
} from "@/db/schema";
import {
  AUTHORIZATION_ERROR,
  createOwnershipAuthorizer,
  type ResourceKind,
  type ResourceOwnership,
} from "@/lib/ownership";
import {
  createAthleteCredential,
  verifyAthleteCredential,
} from "@/lib/athlete-credential";

const ATHLETE_COOKIE = "forja-athlete-access";
const ATHLETE_COOKIE_MAX_AGE = 8 * 60 * 60;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error(AUTHORIZATION_ERROR);
  return value;
}

async function loadOwnership(
  kind: ResourceKind,
  resourceId: string
): Promise<ResourceOwnership | null> {
  const selection = { athleteId: athletes.id, coachId: athletes.coachId };
  let rows: ResourceOwnership[];

  switch (kind) {
    case "athlete":
      rows = await db
        .select(selection)
        .from(athletes)
        .where(eq(athletes.id, resourceId))
        .limit(1);
      break;
    case "week":
      rows = await db
        .select(selection)
        .from(weeks)
        .innerJoin(programs, eq(weeks.programId, programs.id))
        .innerJoin(athletes, eq(programs.athleteId, athletes.id))
        .where(eq(weeks.id, resourceId))
        .limit(1);
      break;
    case "day":
      rows = await db
        .select(selection)
        .from(days)
        .innerJoin(weeks, eq(days.weekId, weeks.id))
        .innerJoin(programs, eq(weeks.programId, programs.id))
        .innerJoin(athletes, eq(programs.athleteId, athletes.id))
        .where(eq(days.id, resourceId))
        .limit(1);
      break;
    case "exercise":
      rows = await db
        .select(selection)
        .from(exercises)
        .innerJoin(days, eq(exercises.dayId, days.id))
        .innerJoin(weeks, eq(days.weekId, weeks.id))
        .innerJoin(programs, eq(weeks.programId, programs.id))
        .innerJoin(athletes, eq(programs.athleteId, athletes.id))
        .where(eq(exercises.id, resourceId))
        .limit(1);
      break;
    case "plannedSet":
      rows = await db
        .select(selection)
        .from(plannedSets)
        .innerJoin(exercises, eq(plannedSets.exerciseId, exercises.id))
        .innerJoin(days, eq(exercises.dayId, days.id))
        .innerJoin(weeks, eq(days.weekId, weeks.id))
        .innerJoin(programs, eq(weeks.programId, programs.id))
        .innerJoin(athletes, eq(programs.athleteId, athletes.id))
        .where(eq(plannedSets.id, resourceId))
        .limit(1);
      break;
    case "record":
      rows = await db
        .select(selection)
        .from(records)
        .innerJoin(athletes, eq(records.athleteId, athletes.id))
        .where(eq(records.id, resourceId))
        .limit(1);
      break;
  }
  return rows[0] ?? null;
}

const ownership = createOwnershipAuthorizer(loadOwnership);

export async function requireCoachId() {
  const session = await auth();
  const coachId = (session?.user as { id?: string } | undefined)?.id;
  if (!coachId) throw new Error(AUTHORIZATION_ERROR);
  return coachId;
}

export async function requireCoachResource(
  kind: ResourceKind,
  resourceId: string,
  expectedAthleteId?: string
) {
  const coachId = await requireCoachId();
  return requireCoachResourceAs(
    coachId,
    kind,
    resourceId,
    expectedAthleteId
  );
}

export async function requireCoachResourceAs(
  coachId: string,
  kind: ResourceKind,
  resourceId: string,
  expectedAthleteId?: string
) {
  return ownership.requireCoach(coachId, kind, resourceId, expectedAthleteId);
}

export async function establishAthleteAccess(athleteId: string) {
  (await cookies()).set(
    ATHLETE_COOKIE,
    createAthleteCredential(athleteId, secret()),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ATHLETE_COOKIE_MAX_AGE,
    }
  );
}

export async function getAthleteCredentialId() {
  const value = (await cookies()).get(ATHLETE_COOKIE)?.value;
  const configuredSecret = process.env.AUTH_SECRET;
  return configuredSecret
    ? verifyAthleteCredential(value, configuredSecret)
    : null;
}

export async function requireAthleteResource(
  kind: ResourceKind,
  resourceId: string
) {
  return ownership.requireAthlete(
    await getAthleteCredentialId(),
    kind,
    resourceId
  );
}

export async function athleteForAccessPin(pin: string) {
  const athleteId = await getAthleteCredentialId();
  if (!athleteId) return null;
  return db.query.athletes.findFirst({
    where: and(eq(athletes.id, athleteId), eq(athletes.accessPin, pin)),
  });
}

export async function requireRecordAccess(athleteId: string) {
  const session = await auth();
  const coachId = (session?.user as { id?: string } | undefined)?.id;
  if (coachId) {
    return ownership.requireCoach(coachId, "athlete", athleteId);
  }
  return ownership.requireAthlete(
    await getAthleteCredentialId(),
    "athlete",
    athleteId
  );
}
