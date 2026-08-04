import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "../src/db/schema";
import { commitAthleteActivation } from "../src/lib/athlete-activation-commit";
import {
  ACCESS_RATE_LIMIT_LOCKOUT_MS,
  ACCESS_RATE_LIMIT_RETENTION_MS,
  ACCESS_RATE_LIMIT_WINDOW_MS,
  cleanupAccessRateLimits,
  consumeAccessAttempt,
  resetAccessAttempts,
} from "../src/lib/access-rate-limit";
import {
  athleteForAccessToken,
  athleteForCredentialClaims,
  authenticateAthleteAccess,
  issueAthleteAccessToken,
  revokeAthleteAccessToken,
} from "../src/lib/athlete-access-token";
import {
  ATHLETE_ACCESS_TOKEN_PATTERN,
  ATHLETE_ACCESS_COOKIE,
  clearAthleteCredentialCookie,
  createAthleteAccessToken,
  createAthleteCredential,
  hashAthleteAccessToken,
  verifyAthleteCredential,
} from "../src/lib/athlete-credential";
import { fingerprintAccessKey } from "../src/lib/athlete-credential";
import {
  fingerprintRateLimitClient,
  resolveRateLimitClientId,
} from "../src/lib/rate-limit-client";

const SECRET = "athlete-access-test-secret";

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), "forja-athlete-access-"));
  const client = createClient({ url: `file:${join(directory, "fixture.db")}` });
  const database = drizzle(client, { schema });
  await migrate(database, { migrationsFolder: join(process.cwd(), "drizzle") });
  await migrate(database, { migrationsFolder: join(process.cwd(), "drizzle") });
  await client.batch(
    [
      "INSERT INTO coaches (id,nombre,email,password_hash) VALUES ('coach','Coach','coach@test.local','hash')",
      "INSERT INTO athletes (id,coach_id,nombre,apellido,access_pin) VALUES ('athlete-a','coach','Ana','A','123456')",
      "INSERT INTO athletes (id,coach_id,nombre,apellido,access_pin) VALUES ('athlete-b','coach','Beto','B','654321')",
    ],
    "write"
  );
  return {
    client,
    database,
    close: async () => {
      client.close();
      await rm(directory, { recursive: true, force: true });
    },
  };
}

test("athlete tokens have 256 bits of random base64url entropy and keyed hashes", () => {
  const tokens = new Set(
    Array.from({ length: 32 }, (_, index) =>
      createAthleteAccessToken((size) => Buffer.alloc(size, index + 1))
    )
  );
  assert.equal(tokens.size, 32);
  for (const token of tokens) assert.match(token, ATHLETE_ACCESS_TOKEN_PATTERN);
  const token = [...tokens][0];
  const hash = hashAthleteAccessToken(token, SECRET);
  assert.notEqual(hash, token);
  assert.notEqual(hashAthleteAccessToken(token, "other-secret"), hash);
});

test("athlete logout deletes only the local access cookie", () => {
  const deleted: string[] = [];
  clearAthleteCredentialCookie({ delete: (name) => deleted.push(name) });
  assert.deepEqual(deleted, [ATHLETE_ACCESS_COOKIE]);
});

test("issue, exchange, rotation and revocation persist no raw token and invalidate versions", async () => {
  const { client, database, close } = await fixture();
  try {
    assert.equal(
      (await authenticateAthleteAccess(database, "123456", SECRET, true))
        ?.athleteId,
      "athlete-a"
    );
    const first = await issueAthleteAccessToken(database, "athlete-a", SECRET);
    assert.equal(
      await authenticateAthleteAccess(database, "123456", SECRET, true),
      null
    );
    const stored = await client.execute(
      "SELECT token_hash, credential_version FROM athlete_access_tokens WHERE athlete_id='athlete-a'"
    );
    assert.equal(stored.rows[0].token_hash, hashAthleteAccessToken(first.token, SECRET));
    assert.equal(JSON.stringify(stored.rows).includes(first.token), false);
    assert.equal((await athleteForAccessToken(database, first.token, SECRET))?.athleteId, "athlete-a");
    assert.equal(await athleteForAccessToken(database, "malformed", SECRET), null);

    const oldCookie = createAthleteCredential(
      "athlete-a",
      first.credentialVersion,
      SECRET,
      1_000
    );
    const oldClaims = verifyAthleteCredential(oldCookie, SECRET, 1_000)!;
    assert.equal(
      (await athleteForCredentialClaims(database, oldClaims))?.id,
      "athlete-a"
    );
    await client.execute(
      "UPDATE athletes SET access_pin='222222' WHERE id='athlete-a'"
    );
    const second = await issueAthleteAccessToken(database, "athlete-a", SECRET);
    assert.equal(
      await authenticateAthleteAccess(database, "222222", SECRET, true),
      null
    );
    assert.equal(await athleteForAccessToken(database, first.token, SECRET), null);
    assert.equal((await athleteForAccessToken(database, second.token, SECRET))?.athleteId, "athlete-a");
    assert.notEqual(second.credentialVersion, first.credentialVersion);
    assert.equal(
      verifyAthleteCredential(oldCookie, SECRET, 1_000)?.credentialVersion ===
        second.credentialVersion,
      false
    );
    assert.equal(await athleteForCredentialClaims(database, oldClaims), undefined);
    assert.equal(
      await athleteForCredentialClaims(database, {
        athleteId: "athlete-b",
        credentialVersion: second.credentialVersion,
      }),
      undefined
    );

    const secondCookie = createAthleteCredential(
      "athlete-a",
      second.credentialVersion,
      SECRET,
      1_000
    );
    const secondClaims = verifyAthleteCredential(secondCookie, SECRET, 1_000)!;
    await client.execute(
      "UPDATE athletes SET access_pin='333333' WHERE id='athlete-a'"
    );
    await revokeAthleteAccessToken(database, "athlete-a");
    assert.equal(await athleteForAccessToken(database, second.token, SECRET), null);
    assert.equal(
      await authenticateAthleteAccess(database, "333333", SECRET, true),
      null
    );
    assert.equal(await athleteForCredentialClaims(database, secondClaims), undefined);
  } finally {
    await close();
  }
});

test("client cookies isolate browser buckets while credential limits survive resets", async () => {
  const { id: clientA } = resolveRateLimitClientId(undefined, () => "A".repeat(32));
  const { id: clientB } = resolveRateLimitClientId(undefined, () => "B".repeat(32));
  const { id: resetA } = resolveRateLimitClientId(undefined, () => "C".repeat(32));
  const keyA = fingerprintRateLimitClient(clientA, [], SECRET);
  const keyB = fingerprintRateLimitClient(clientB, [], SECRET);
  const resetKeyA = fingerprintRateLimitClient(resetA, [], SECRET);
  assert.notEqual(keyA, keyB);
  assert.notEqual(keyA, resetKeyA);
  assert.equal(
    fingerprintRateLimitClient(clientA, [], SECRET),
    keyA,
    "UA and language are not fingerprint inputs"
  );

  const credential = "credential-under-attack";
  const credentialKeyBefore = fingerprintAccessKey(
    "athlete-access-credential",
    credential,
    SECRET
  );
  const credentialKeyAfter = fingerprintAccessKey(
    "athlete-access-credential",
    credential,
    SECRET
  );
  assert.equal(credentialKeyBefore, credentialKeyAfter);

  const { client, database, close } = await fixture();
  try {
    const now = Date.UTC(2026, 7, 4, 11);
    for (let attempt = 0; attempt < 10; attempt += 1) {
      assert.equal(
        (
          await consumeAccessAttempt(
            database,
            "athlete-access-client",
            keyA,
            { maxAttempts: 10 },
            now
          )
        ).limited,
        false
      );
    }
    assert.equal(
      (
        await consumeAccessAttempt(
          database,
          "athlete-access-client",
          keyA,
          { maxAttempts: 10 },
          now
        )
      ).limited,
      true
    );
    const rawInputs = {
      phone: "+5491112345678",
      pin: "123456",
      token: "F".repeat(43),
      ip: "203.0.113.10",
    };
    await Promise.all([
      consumeAccessAttempt(
        database,
        "athlete-activation-credential",
        fingerprintAccessKey(
          "athlete-activation-credential",
          rawInputs.phone,
          SECRET
        ),
        { maxAttempts: 5 },
        now
      ),
      consumeAccessAttempt(
        database,
        "legacy-pin-credential",
        fingerprintAccessKey("legacy-pin-credential", rawInputs.pin, SECRET),
        { maxAttempts: 5 },
        now
      ),
      consumeAccessAttempt(
        database,
        "token-credential",
        fingerprintAccessKey("token-credential", rawInputs.token, SECRET),
        { maxAttempts: 5 },
        now
      ),
      consumeAccessAttempt(
        database,
        "trusted-client",
        fingerprintRateLimitClient(clientA, [rawInputs.ip], SECRET),
        { maxAttempts: 10 },
        now
      ),
    ]);
    const persisted = JSON.stringify(
      (await client.execute("SELECT scope,key_hash FROM access_rate_limits")).rows
    );
    for (const rawValue of [
      clientA,
      clientB,
      resetA,
      credential,
      rawInputs.phone,
      rawInputs.pin,
      rawInputs.token,
      rawInputs.ip,
    ]) {
      assert.equal(persisted.includes(rawValue), false);
    }
    assert.equal(
      (
        await consumeAccessAttempt(
          database,
          "athlete-access-client",
          keyB,
          { maxAttempts: 10 },
          now
        )
      ).limited,
      false
    );
    for (let attempt = 0; attempt < 5; attempt += 1) {
      assert.equal(
        (
          await consumeAccessAttempt(
            database,
            "athlete-access-credential",
            credentialKeyBefore,
            { maxAttempts: 5 },
            now
          )
        ).limited,
        false
      );
    }
    assert.equal(
      (
        await consumeAccessAttempt(
          database,
          "athlete-access-credential",
          credentialKeyAfter,
          { maxAttempts: 5 },
          now
        )
      ).limited,
      true
    );
  } finally {
    await close();
  }
});

test("activation token failure rolls back OTP, phone, PIN and credential state", async () => {
  const { client, database, close } = await fixture();
  const now = new Date("2026-08-04T12:00:00Z");
  const collisionToken = "D".repeat(43);
  try {
    await client.batch(
      [
        "UPDATE athletes SET telefono_e164='+5491112345678' WHERE id='athlete-a'",
        `INSERT INTO athlete_activation_challenges (id,athlete_id,code_hash,expires_at,attempts,sent_at) VALUES ('challenge-a','athlete-a','hash',${Math.floor((now.getTime() + 600_000) / 1000)},0,${Math.floor(now.getTime() / 1000)})`,
      ],
      "write"
    );
    await issueAthleteAccessToken(
      database,
      "athlete-b",
      SECRET,
      now,
      () => collisionToken
    );

    await assert.rejects(
      commitAthleteActivation(
        database,
        {
          athleteId: "athlete-a",
          challengeId: "challenge-a",
          phone: "+5491112345678",
          secret: SECRET,
          now,
        },
        () => collisionToken
      )
    );
    const failed = await client.execute(
      "SELECT a.telefono_verificado_at, a.credential_version, a.access_pin, c.consumed_at FROM athletes a JOIN athlete_activation_challenges c ON c.athlete_id=a.id WHERE a.id='athlete-a'"
    );
    assert.deepEqual(failed.rows[0], {
      telefono_verificado_at: null,
      credential_version: 0,
      access_pin: "123456",
      consumed_at: null,
    });
    assert.equal(
      (
        await client.execute(
          "SELECT token_hash FROM athlete_access_tokens WHERE athlete_id='athlete-a'"
        )
      ).rows.length,
      0
    );

    const issued = await commitAthleteActivation(
      database,
      {
        athleteId: "athlete-a",
        challengeId: "challenge-a",
        phone: "+5491112345678",
        secret: SECRET,
        now,
      },
      () => "E".repeat(43)
    );
    assert.equal(
      (await athleteForAccessToken(database, issued.token, SECRET))?.athleteId,
      "athlete-a"
    );
    const succeeded = await client.execute(
      "SELECT a.telefono_verificado_at, a.credential_version, a.access_pin, c.consumed_at FROM athletes a JOIN athlete_activation_challenges c ON c.athlete_id=a.id WHERE a.id='athlete-a'"
    );
    assert.notEqual(succeeded.rows[0].telefono_verificado_at, null);
    assert.notEqual(succeeded.rows[0].consumed_at, null);
    assert.equal(succeeded.rows[0].credential_version, 1);
    assert.match(String(succeeded.rows[0].access_pin), /^disabled_[a-f0-9]{32}$/);
  } finally {
    await close();
  }
});

test("token hash collisions retry without crossing athlete ownership", async () => {
  const { database, close } = await fixture();
  try {
    const collisionToken = "A".repeat(43);
    await issueAthleteAccessToken(database, "athlete-a", SECRET, new Date(), () => collisionToken);
    const candidates = [collisionToken, "B".repeat(43)];
    const issued = await issueAthleteAccessToken(
      database,
      "athlete-b",
      SECRET,
      new Date(),
      () => candidates.shift()!
    );
    assert.equal(issued.token, "B".repeat(43));
    assert.equal(
      (await authenticateAthleteAccess(database, issued.token, SECRET, false))?.athleteId,
      "athlete-b"
    );
    assert.equal(
      (await authenticateAthleteAccess(database, "123456", SECRET, false)),
      null
    );
    assert.equal(
      await authenticateAthleteAccess(database, "123456", SECRET, true),
      null
    );
  } finally {
    await close();
  }
});

test("persistent rate limits are atomic, scoped, resettable and bounded by windows", async () => {
  const { database, close } = await fixture();
  try {
    const now = Date.UTC(2026, 7, 4, 12);
    const attempts = await Promise.all(
      Array.from({ length: 5 }, () =>
        consumeAccessAttempt(
          database,
          "token-client",
          "hashed-client",
          { maxAttempts: 3 },
          now
        )
      )
    );
    assert.equal(Math.max(...attempts.map((attempt) => attempt.attemptCount)), 4);
    assert.equal(attempts.some((attempt) => attempt.limited), true);
    const separate = await consumeAccessAttempt(
      database,
      "activation-client",
      "hashed-client",
      { maxAttempts: 3 },
      now
    );
    assert.equal(separate.limited, false);

    const lockStart = now + 2 * ACCESS_RATE_LIMIT_WINDOW_MS - 100;
    const first = await consumeAccessAttempt(
      database,
      "rollover-lock",
      "hashed-rollover",
      { maxAttempts: 1 },
      lockStart
    );
    assert.equal(first.limited, false);
    const locked = await consumeAccessAttempt(
      database,
      "rollover-lock",
      "hashed-rollover",
      { maxAttempts: 1 },
      lockStart + 1
    );
    assert.equal(locked.limited, true);
    const acrossWindow = await consumeAccessAttempt(
      database,
      "rollover-lock",
      "hashed-rollover",
      { maxAttempts: 1 },
      lockStart + 101
    );
    assert.equal(acrossWindow.limited, true);
    assert.equal(acrossWindow.lockedUntilMs, locked.lockedUntilMs);
    const expired = await consumeAccessAttempt(
      database,
      "rollover-lock",
      "hashed-rollover",
      { maxAttempts: 1 },
      locked.lockedUntilMs!
    );
    assert.equal(expired.limited, false);
    assert.equal(expired.attemptCount, 1);

    await resetAccessAttempts(database, [
      { scope: "token-client", keyHash: "hashed-client" },
    ]);
    const reset = await consumeAccessAttempt(
      database,
      "token-client",
      "hashed-client",
      { maxAttempts: 3 },
      now
    );
    assert.equal(reset.attemptCount, 1);
    assert.equal(reset.limited, false);

    const afterLockout = await consumeAccessAttempt(
      database,
      "activation-client",
      "hashed-client",
      { maxAttempts: 3 },
      now + ACCESS_RATE_LIMIT_LOCKOUT_MS + 1
    );
    assert.equal(afterLockout.attemptCount, 1);
    assert.equal(afterLockout.limited, false);

    await consumeAccessAttempt(
      database,
      "window-boundary",
      "hashed-boundary",
      { maxAttempts: 3 },
      now
    );
    const nextWindow = await consumeAccessAttempt(
      database,
      "window-boundary",
      "hashed-boundary",
      { maxAttempts: 3 },
      now + ACCESS_RATE_LIMIT_WINDOW_MS
    );
    assert.equal(nextWindow.attemptCount, 1);
    assert.equal(nextWindow.limited, false);

    await consumeAccessAttempt(
      database,
      "stale",
      "hashed-stale",
      { maxAttempts: 3 },
      now - ACCESS_RATE_LIMIT_RETENTION_MS - 1
    );
    await cleanupAccessRateLimits(database, now);
    const stale = await database.query.accessRateLimits.findFirst({
      where: (row, { eq }) => eq(row.scope, "stale"),
    });
    assert.equal(stale, undefined);
  } finally {
    await close();
  }
});
