import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "@/db/schema";
import { parseAccessRequest, persistAccessRequest } from "@/lib/access-request";
import { submitAccessRequest } from "@/lib/actions/access-request";

function validForm() {
  const form = new FormData();
  form.set("name", "Ana Entrenadora");
  form.set("email", " ANA@EXAMPLE.COM ");
  form.set("organization", "Equipo Norte");
  form.set("profile", "coach");
  return form;
}

test("normalizes and validates access requests", () => {
  const parsed = parseAccessRequest(validForm());
  assert.equal(parsed.success, true);
  if (!parsed.success) return;
  assert.equal(parsed.data.email, "ana@example.com");
  assert.equal(parsed.data.name, "Ana Entrenadora");

  const invalid = new FormData();
  invalid.set("name", "A");
  invalid.set("email", "not-an-email");
  invalid.set("profile", "athlete");
  assert.equal(parseAccessRequest(invalid).success, false);
});

test("returns explicit validation and honeypot states without writing", async () => {
  const invalidState = await submitAccessRequest(
    { status: "idle", message: "" },
    new FormData()
  );
  assert.equal(invalidState.status, "error");
  assert.ok(invalidState.fieldErrors?.email);

  const botForm = validForm();
  botForm.set("website", "https://spam.invalid");
  const botState = await submitAccessRequest(
    { status: "idle", message: "" },
    botForm
  );
  assert.equal(botState.status, "success");
});

test("persists one normalized row and treats duplicate email as idempotent", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forja-access-request-"));
  const client = createClient({ url: `file:${join(directory, "fixture.db")}` });
  const database = drizzle(client, { schema });
  try {
    await migrate(database, { migrationsFolder: join(process.cwd(), "drizzle") });
    const parsed = parseAccessRequest(validForm());
    assert.equal(parsed.success, true);
    if (!parsed.success) return;

    await persistAccessRequest(database, parsed.data);
    await persistAccessRequest(database, { ...parsed.data, name: "Otro nombre" });

    const result = await client.execute(
      "SELECT name, email, organization, profile, status FROM access_requests"
    );
    assert.equal(result.rows.length, 1);
    assert.deepEqual(result.rows[0], {
      name: "Ana Entrenadora",
      email: "ana@example.com",
      organization: "Equipo Norte",
      profile: "coach",
      status: "pending",
    });
  } finally {
    client.close();
    await rm(directory, { recursive: true, force: true });
  }
});
