import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTHORIZATION_ERROR,
  createOwnershipAuthorizer,
  type ResourceKind,
  type ResourceOwnership,
} from "../src/lib/ownership";
import {
  createAthleteCredential,
  verifyAthleteCredential,
} from "../src/lib/athlete-credential";

const owners = new Map<string, ResourceOwnership>([
  ["athlete:athlete-a", { athleteId: "athlete-a", coachId: "coach-a" }],
  ["athlete:athlete-b", { athleteId: "athlete-b", coachId: "coach-b" }],
  ["week:week-a", { athleteId: "athlete-a", coachId: "coach-a" }],
  ["day:day-a", { athleteId: "athlete-a", coachId: "coach-a" }],
  ["day:day-b", { athleteId: "athlete-b", coachId: "coach-b" }],
  ["exercise:exercise-a", { athleteId: "athlete-a", coachId: "coach-a" }],
  ["plannedSet:set-a", { athleteId: "athlete-a", coachId: "coach-a" }],
  ["plannedSet:set-b", { athleteId: "athlete-b", coachId: "coach-b" }],
  ["record:record-a", { athleteId: "athlete-a", coachId: "coach-a" }],
  ["record:record-b", { athleteId: "athlete-b", coachId: "coach-b" }],
]);

const authorization = createOwnershipAuthorizer(
  async (kind: ResourceKind, id: string) => owners.get(`${kind}:${id}`) ?? null
);

const denied = (operation: Promise<unknown>) =>
  assert.rejects(operation, { message: AUTHORIZATION_ERROR });

test("unauthenticated coach operations fail before resource access", async () => {
  await denied(authorization.requireCoach(null, "athlete", "athlete-a"));
});

test("a coach cannot access another coach's planning or record resources", async () => {
  await denied(authorization.requireCoach("coach-a", "athlete", "athlete-b"));
  await denied(authorization.requireCoach("coach-a", "day", "day-b"));
  await denied(authorization.requireCoach("coach-a", "record", "record-b"));
});

test("a client athlete id cannot mismatch the resource ownership chain", async () => {
  await denied(
    authorization.requireCoach("coach-a", "week", "week-a", "athlete-b")
  );
});

test("an athlete credential cannot mutate another athlete's set, day, or record", async () => {
  await denied(authorization.requireAthlete("athlete-a", "plannedSet", "set-b"));
  await denied(authorization.requireAthlete("athlete-a", "day", "day-b"));
  await denied(authorization.requireAthlete("athlete-a", "record", "record-b"));
});

test("same-owner coach and athlete operations remain authorized", async () => {
  assert.equal(
    (await authorization.requireCoach("coach-a", "exercise", "exercise-a"))
      .athleteId,
    "athlete-a"
  );
  assert.equal(
    (await authorization.requireAthlete("athlete-a", "plannedSet", "set-a"))
      .coachId,
    "coach-a"
  );
  assert.equal(
    (await authorization.requireAthlete("athlete-a", "record", "record-a"))
      .athleteId,
    "athlete-a"
  );
});

test("athlete credentials are signed, expire, and reject tampering", () => {
  const now = Date.UTC(2026, 6, 31);
  const credential = createAthleteCredential("athlete-a", "test-secret", now);
  assert.equal(
    verifyAthleteCredential(credential, "test-secret", now),
    "athlete-a"
  );
  assert.equal(
    verifyAthleteCredential(
      credential.replace("athlete-a", "athlete-b"),
      "test-secret",
      now
    ),
    null
  );
  assert.equal(
    verifyAthleteCredential(credential, "test-secret", now + 9 * 60 * 60 * 1000),
    null
  );
});
