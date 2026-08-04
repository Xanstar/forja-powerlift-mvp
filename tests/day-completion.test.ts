import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "../src/db/schema";
import {
  assertValidDayCompletionMutationId,
  completeDay,
  type DayCompletionDatabase,
} from "../src/lib/day-completion";

type Fixture = Awaited<ReturnType<typeof fixture>>;

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), "forja-day-completion-"));
  const file = join(directory, "fixture.db");
  const client = createClient({ url: `file:${file}` });
  const database = drizzle(client, { schema }) as DayCompletionDatabase;
  await migrate(database, { migrationsFolder: join(process.cwd(), "drizzle") });
  await client.batch(
    [
      "INSERT INTO coaches (id,nombre,email,password_hash) VALUES ('coach','Coach','coach@completion.test','hash')",
      "INSERT INTO athletes (id,coach_id,nombre,apellido,access_pin) VALUES ('athlete','coach','Ana','Uno','disabled')",
      "INSERT INTO athletes (id,coach_id,nombre,apellido,access_pin) VALUES ('other-athlete','coach','Beto','Dos','disabled')",
      "INSERT INTO programs (id,athlete_id,nombre,semanas,activo,status,version) VALUES ('program','athlete','Bloque original',1,1,'published',1)",
      "INSERT INTO weeks (id,program_id,numero) VALUES ('week','program',3)",
      "INSERT INTO days (id,week_id,nombre,orden) VALUES ('day','week','Día A',0)",
      "INSERT INTO days (id,week_id,nombre,orden) VALUES ('day-2','week','Día B',1)",
      "INSERT INTO days (id,week_id,nombre,orden) VALUES ('zero-day','week','Vacío',2)",
      "INSERT INTO exercises (id,day_id,nombre,orden) VALUES ('exercise','day','Sentadilla',0)",
      "INSERT INTO exercises (id,day_id,nombre,orden) VALUES ('exercise-2','day-2','Banca',0)",
      "INSERT INTO planned_sets (id,exercise_id,numero_set,repeticiones_objetivo,peso_tipo) VALUES ('set-1','exercise',1,5,'absoluto')",
      "INSERT INTO planned_sets (id,exercise_id,numero_set,repeticiones_objetivo,peso_tipo) VALUES ('set-2','exercise',2,5,'absoluto')",
      "INSERT INTO planned_sets (id,exercise_id,numero_set,repeticiones_objetivo,peso_tipo) VALUES ('set-3','exercise-2',1,5,'absoluto')",
    ],
    "write"
  );
  return { directory, file, client, database };
}

async function dispose(value: Fixture, extraClients: Client[] = []) {
  for (const client of extraClients) client.close();
  value.client.close();
  await rm(value.directory, { recursive: true, force: true });
}

function executionSql({
  id,
  setId,
  dayId = "day",
  athleteId = "athlete",
  operationId,
  status = "completed",
}: {
  id: string;
  setId: string;
  dayId?: string;
  athleteId?: string;
  operationId?: string;
  status?: string;
}) {
  return `INSERT INTO execution_sets (id,athlete_id,source_program_id,source_day_id,source_planned_set_id,client_mutation_id,program_name,week_number,day_name,exercise_name,set_number,target_reps,prescription_type,status) VALUES ('${id}','${athleteId}','program','${dayId}','${setId}','${operationId ?? `set-op-${id}`}','Bloque original',3,'Día A','Sentadilla',1,5,'absoluto','${status}')`;
}

async function addDayEvidence(client: Client, dayId = "day") {
  const rows =
    dayId === "day"
      ? [
          executionSql({ id: "execution-1", setId: "set-1", status: "completed" }),
          executionSql({ id: "execution-2", setId: "set-2", status: "skipped" }),
        ]
      : [
          executionSql({
            id: "execution-3",
            setId: "set-3",
            dayId: "day-2",
            operationId: "set-op-execution-3",
          }),
        ];
  await client.batch(rows, "write");
}

test("day completion validates mutation IDs without normalization", () => {
  for (const invalid of ["", " leading", "trailing ", "with/slash", "á", "x".repeat(101)]) {
    assert.throws(() => assertValidDayCompletionMutationId(invalid));
  }
  assert.doesNotThrow(() => assertValidDayCompletionMutationId("uuid.part_1:retry-2"));
});

test("applied completion writes immutable snapshot and legacy marker atomically", async () => {
  const value = await fixture();
  try {
    await addDayEvidence(value.client);
    const completedAt = new Date("2026-08-04T12:34:56.987Z");
    const persistedAt = new Date("2026-08-04T12:34:56.000Z");
    const result = await completeDay(value.database, {
      athleteId: "athlete",
      dayId: "day",
      clientMutationId: "complete-day-1",
      now: () => completedAt,
      createId: () => "day-execution-id",
    });
    assert.deepEqual(result, {
      outcome: "applied",
      dayExecutionId: "day-execution-id",
      completedAt: persistedAt.toISOString(),
    });
    const rows = await value.client.execute(
      "SELECT de.id,de.client_mutation_id,de.program_name,de.week_number,de.day_name,de.completed_at,dc.completado_en FROM day_executions de JOIN day_completions dc ON dc.day_id=de.source_day_id"
    );
    assert.deepEqual(rows.rows[0], {
      id: "day-execution-id",
      client_mutation_id: "complete-day-1",
      program_name: "Bloque original",
      week_number: 3,
      day_name: "Día A",
      completed_at: Math.floor(completedAt.getTime() / 1000),
      completado_en: Math.floor(completedAt.getTime() / 1000),
    });

    await value.client.batch(
      [
        "UPDATE programs SET nombre='Bloque editado' WHERE id='program'",
        "UPDATE days SET nombre='Día editado' WHERE id='day'",
        "DELETE FROM execution_sets",
        "DELETE FROM planned_sets",
      ],
      "write"
    );
    const duplicate = await completeDay(value.database, {
      athleteId: "athlete",
      dayId: "day",
      clientMutationId: "complete-day-1",
    });
    assert.deepEqual(duplicate, { ...result, outcome: "duplicate" });
    assert.deepEqual(
      await completeDay(value.database, {
        athleteId: "athlete",
        dayId: "day",
        clientMutationId: "different-operation-after-source-change",
      }),
      { outcome: "conflict", reason: "day_already_completed" }
    );
    const snapshot = await value.client.execute(
      "SELECT program_name,day_name FROM day_executions WHERE id='day-execution-id'"
    );
    assert.deepEqual(snapshot.rows[0], {
      program_name: "Bloque original",
      day_name: "Día A",
    });
  } finally {
    await dispose(value);
  }
});

test("evidence requires exact terminal set identity, athlete, and day equality", async (t) => {
  const cases = [
    {
      name: "missing evidence",
      rows: [executionSql({ id: "one", setId: "set-1" })],
      reason: "incomplete_evidence",
    },
    {
      name: "equal count with different set ids",
      rows: [
        executionSql({ id: "one", setId: "set-1" }),
        executionSql({ id: "wrong", setId: "unplanned" }),
      ],
      reason: "evidence_mismatch",
    },
    {
      name: "extra evidence",
      rows: [
        executionSql({ id: "one", setId: "set-1" }),
        executionSql({ id: "two", setId: "set-2" }),
        executionSql({ id: "extra", setId: "unplanned" }),
      ],
      reason: "evidence_mismatch",
    },
    {
      name: "wrong athlete",
      rows: [
        executionSql({ id: "one", setId: "set-1", athleteId: "other-athlete" }),
        executionSql({ id: "two", setId: "set-2" }),
      ],
      reason: "evidence_mismatch",
    },
    {
      name: "wrong day",
      rows: [
        executionSql({ id: "one", setId: "set-1", dayId: "day-2" }),
        executionSql({ id: "two", setId: "set-2" }),
      ],
      reason: "evidence_mismatch",
    },
    {
      name: "nonterminal status",
      rows: [
        executionSql({ id: "one", setId: "set-1", status: "pending" }),
        executionSql({ id: "two", setId: "set-2" }),
      ],
      reason: "evidence_mismatch",
    },
  ] as const;

  for (const scenario of cases) {
    await t.test(scenario.name, async () => {
      const value = await fixture();
      try {
        await value.client.batch([...scenario.rows], "write");
        const result = await completeDay(value.database, {
          athleteId: "athlete",
          dayId: "day",
          clientMutationId: `complete-${scenario.name.replaceAll(" ", "-")}`,
        });
        assert.deepEqual(result, { outcome: "conflict", reason: scenario.reason });
      } finally {
        await dispose(value);
      }
    });
  }
});

test("zero-set days and cross-resource operation reuse honor terminal precedence", async () => {
  const value = await fixture();
  try {
    assert.deepEqual(
      await completeDay(value.database, {
        athleteId: "athlete",
        dayId: "zero-day",
        clientMutationId: "zero-operation",
      }),
      { outcome: "conflict", reason: "zero_set_day" }
    );

    await value.client.execute(
      executionSql({
        id: "execution-1",
        setId: "set-1",
        operationId: "reused-set-operation",
      })
    );
    assert.deepEqual(
      await completeDay(value.database, {
        athleteId: "athlete",
        dayId: "zero-day",
        clientMutationId: "reused-set-operation",
      }),
      { outcome: "conflict", reason: "operation_reused" }
    );
  } finally {
    await dispose(value);
  }
});

test("concurrent completions classify same and different operations deterministically", async (t) => {
  await t.test("same operation", async () => {
    const value = await fixture();
    const secondClient = createClient({ url: `file:${value.file}` });
    const secondDb = drizzle(secondClient, { schema }) as DayCompletionDatabase;
    try {
      await addDayEvidence(value.client);
      const results = await Promise.all([
        completeDay(value.database, {
          athleteId: "athlete",
          dayId: "day",
          clientMutationId: "same-operation",
        }),
        completeDay(secondDb, {
          athleteId: "athlete",
          dayId: "day",
          clientMutationId: "same-operation",
        }),
      ]);
      assert.deepEqual(
        results.map((result) => result.outcome).sort(),
        ["applied", "duplicate"]
      );
      assert.equal(
        "dayExecutionId" in results[0] && "dayExecutionId" in results[1]
          ? results[0].dayExecutionId
          : null,
        "dayExecutionId" in results[1] ? results[1].dayExecutionId : null
      );
      assert.equal(
        "completedAt" in results[0] ? results[0].completedAt : null,
        "completedAt" in results[1] ? results[1].completedAt : null
      );
      assert.ok(results.every((result) => result.outcome !== "conflict"));
    } finally {
      await dispose(value, [secondClient]);
    }
  });

  await t.test("different operations", async () => {
    const value = await fixture();
    const secondClient = createClient({ url: `file:${value.file}` });
    const secondDb = drizzle(secondClient, { schema }) as DayCompletionDatabase;
    try {
      await addDayEvidence(value.client);
      const results = await Promise.all([
        completeDay(value.database, {
          athleteId: "athlete",
          dayId: "day",
          clientMutationId: "operation-a",
        }),
        completeDay(secondDb, {
          athleteId: "athlete",
          dayId: "day",
          clientMutationId: "operation-b",
        }),
      ]);
      assert.equal(results.filter((result) => result.outcome === "applied").length, 1);
      assert.ok(
        results.some(
          (result) =>
            result.outcome === "conflict" &&
            result.reason === "day_already_completed"
        )
      );
    } finally {
      await dispose(value, [secondClient]);
    }
  });
});

test("operation reuse across days conflicts and legacy insert failure rolls back", async () => {
  const value = await fixture();
  try {
    await addDayEvidence(value.client);
    await addDayEvidence(value.client, "day-2");
    const first = await completeDay(value.database, {
      athleteId: "athlete",
      dayId: "day",
      clientMutationId: "cross-day-operation",
    });
    assert.equal(first.outcome, "applied");
    assert.deepEqual(
      await completeDay(value.database, {
        athleteId: "athlete",
        dayId: "day-2",
        clientMutationId: "cross-day-operation",
      }),
      { outcome: "conflict", reason: "operation_reused" }
    );
    assert.deepEqual(
      await completeDay(value.database, {
        athleteId: "athlete",
        dayId: "zero-day",
        clientMutationId: "cross-day-operation",
      }),
      { outcome: "conflict", reason: "operation_reused" }
    );

    await value.client.execute(
      "CREATE TRIGGER fail_legacy_completion BEFORE INSERT ON day_completions BEGIN SELECT RAISE(ABORT, 'injected_failure'); END"
    );
    await assert.rejects(
      completeDay(value.database, {
        athleteId: "athlete",
        dayId: "day-2",
        clientMutationId: "rollback-operation",
      }),
      (error: unknown) => {
        const value = error as { message?: string; cause?: { message?: string } };
        return (
          value.message?.startsWith("Failed query:") === true &&
          value.cause?.message?.includes("injected_failure") === true
        );
      }
    );
    const rolledBack = await value.client.execute(
      "SELECT id FROM day_executions WHERE source_day_id='day-2'"
    );
    assert.equal(rolledBack.rows.length, 0);
  } finally {
    await dispose(value);
  }
});
