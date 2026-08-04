import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTIVATION_RESEND_COOLDOWN_MS,
  canSendActivation,
  createActivationCode,
  createAthleteAccessPinValue,
  hashActivationCode,
  legacyPinAccessEnabled,
  normalizePhoneE164,
  verifyActivationCode,
} from "../src/lib/athlete-activation";
import {
  AUTHORIZATION_ERROR,
  createOwnershipAuthorizer,
} from "../src/lib/ownership";

test("normalizes only strict E.164 phone numbers", () => {
  assert.equal(normalizePhoneE164(" +5491112345678 "), "+5491112345678");
  for (const invalid of [
    "5491112345678",
    "+54 9 11 1234 5678",
    "+012345678",
    "+123",
    null,
  ]) {
    assert.equal(normalizePhoneE164(invalid), null);
  }
});

test("activation codes use six digits and are bound to challenge and phone", () => {
  const code = createActivationCode();
  assert.match(code, /^\d{6}$/);
  const hash = hashActivationCode(
    "challenge-a",
    "+5491112345678",
    code,
    "secret"
  );
  assert.equal(
    verifyActivationCode(
      hash,
      "challenge-a",
      "+5491112345678",
      code,
      "secret"
    ),
    true
  );
  assert.equal(
    verifyActivationCode(
      hash,
      "challenge-b",
      "+5491112345678",
      code,
      "secret"
    ),
    false
  );
  assert.equal(
    verifyActivationCode(
      hash,
      "challenge-a",
      "+5491187654321",
      code,
      "secret"
    ),
    false
  );
});

test("resend cooldown and legacy access policy are explicit", () => {
  const now = new Date("2026-07-31T20:00:00Z");
  assert.equal(canSendActivation(new Date(now.getTime() - 1_000), now), false);
  assert.equal(
    canSendActivation(
      new Date(now.getTime() - ACTIVATION_RESEND_COOLDOWN_MS),
      now
    ),
    true
  );
  assert.equal(legacyPinAccessEnabled(undefined), false);
  assert.equal(legacyPinAccessEnabled("true"), true);
  assert.equal(legacyPinAccessEnabled("false"), false);
  assert.match(createAthleteAccessPinValue(new Set(), false), /^disabled_[a-f0-9]{32}$/);
  assert.match(createAthleteAccessPinValue(new Set(), true), /^\d{6}$/);
});

test("only the owning coach may operate on an athlete invitation", async () => {
  const authorization = createOwnershipAuthorizer(async () => ({
    athleteId: "athlete-a",
    coachId: "coach-a",
  }));
  await assert.rejects(
    authorization.requireCoach("coach-b", "athlete", "athlete-a"),
    { message: AUTHORIZATION_ERROR }
  );
  assert.equal(
    (await authorization.requireCoach("coach-a", "athlete", "athlete-a"))
      .athleteId,
    "athlete-a"
  );
});
