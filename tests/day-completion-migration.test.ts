import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

async function baselineFolder(directory: string) {
  const folder = join(directory, "baseline");
  await cp(join(process.cwd(), "drizzle"), folder, { recursive: true });
  const journalPath = join(folder, "meta", "_journal.json");
  const journal = JSON.parse(await readFile(journalPath, "utf8"));
  journal.entries = journal.entries.filter((entry: { idx: number }) => entry.idx < 8);
  await writeFile(journalPath, JSON.stringify(journal));
  return folder;
}

test("0008 archives every redundant legacy completion and enforces operation invariants", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forja-day-migration-"));
  const client = createClient({ url: `file:${join(directory, "fixture.db")}` });
  const database = drizzle(client);
  try {
    await migrate(database, { migrationsFolder: await baselineFolder(directory) });
    await client.batch(
      [
        "CREATE TABLE day_completions_nullable (id text PRIMARY KEY NOT NULL,day_id text NOT NULL REFERENCES days(id) ON DELETE cascade,completado_en integer DEFAULT (unixepoch()))",
        "DROP TABLE day_completions",
        "ALTER TABLE day_completions_nullable RENAME TO day_completions",
      ],
      "write"
    );
    const originals = [
      ["legacy-old", "day", 100],
      ["legacy-match", "day", 200],
      ["legacy-new", "day", 300],
      ["fallback-old", "fallback-day", 100],
      ["fallback-a", "fallback-day", 500],
      ["fallback-z", "fallback-day", 500],
      ["fallback-null", "fallback-day", null],
      ["millis-match", "millis-day", 2000],
      ["millis-latest", "millis-day", 9999],
      ["millis-null", "millis-day", null],
      ["seconds-match", "seconds-day", 3],
      ["seconds-latest", "seconds-day", 4000],
      ["null-a", "null-day", null],
      ["null-z", "null-day", null],
    ] as const;
    await client.batch(
      [
        "INSERT INTO coaches (id,nombre,email,password_hash) VALUES ('coach','Coach','coach@migration.test','hash')",
        "INSERT INTO athletes (id,coach_id,nombre,apellido,access_pin) VALUES ('athlete','coach','Ana','Test','disabled')",
        "INSERT INTO programs (id,athlete_id,nombre,semanas,activo,status,version) VALUES ('program','athlete','Bloque',1,1,'published',1)",
        "INSERT INTO weeks (id,program_id,numero) VALUES ('week','program',1)",
        "INSERT INTO days (id,week_id,nombre,orden) VALUES ('day','week','Día A',0)",
        "INSERT INTO days (id,week_id,nombre,orden) VALUES ('fallback-day','week','Día B',1)",
        "INSERT INTO days (id,week_id,nombre,orden) VALUES ('millis-day','week','Milisegundos',2)",
        "INSERT INTO days (id,week_id,nombre,orden) VALUES ('seconds-day','week','Segundos',3)",
        "INSERT INTO days (id,week_id,nombre,orden) VALUES ('null-day','week','Sin fecha',4)",
        "INSERT INTO exercises (id,day_id,nombre,orden) VALUES ('exercise','day','Sentadilla',0)",
        "INSERT INTO planned_sets (id,exercise_id,numero_set,repeticiones_objetivo,peso_tipo) VALUES ('set','exercise',1,5,'absoluto')",
        "INSERT INTO day_executions (id,athlete_id,source_program_id,source_day_id,program_name,week_number,day_name,completed_at) VALUES ('execution-day','athlete','program','day','Bloque',1,'Día A',200)",
        "INSERT INTO day_executions (id,athlete_id,source_program_id,source_day_id,program_name,week_number,day_name,completed_at) VALUES ('execution-millis','athlete','program','millis-day','Bloque',1,'Milisegundos',2)",
        "INSERT INTO day_executions (id,athlete_id,source_program_id,source_day_id,program_name,week_number,day_name,completed_at) VALUES ('execution-seconds','athlete','program','seconds-day','Bloque',1,'Segundos',3000)",
        ...originals.map(
          ([id, dayId, timestamp]) =>
            `INSERT INTO day_completions (id,day_id,completado_en) VALUES ('${id}','${dayId}',${timestamp ?? "NULL"})`
        ),
      ],
      "write"
    );

    await migrate(database, { migrationsFolder: join(process.cwd(), "drizzle") });
    await migrate(database, { migrationsFolder: join(process.cwd(), "drizzle") });

    const canonical = await client.execute(
      "SELECT id,day_id,completado_en FROM day_completions"
    );
    assert.deepEqual(
      [...canonical.rows].sort((a, b) => String(a.id).localeCompare(String(b.id))),
      [
        { id: "fallback-z", day_id: "fallback-day", completado_en: 500 },
        { id: "legacy-match", day_id: "day", completado_en: 200 },
        { id: "millis-match", day_id: "millis-day", completado_en: 2000 },
        { id: "null-z", day_id: "null-day", completado_en: null },
        { id: "seconds-match", day_id: "seconds-day", completado_en: 3 },
      ]
    );
    const archived = await client.execute(
      "SELECT original_id,day_id,completado_en,canonical_id,reason FROM day_completion_legacy_duplicates ORDER BY original_id"
    );
    assert.equal(
      archived.rows.every(
        (row) => row.reason === "duplicate_day_completion_before_unique_index"
      ),
      true
    );
    const reconstructed = [
      ...canonical.rows.map((row) => [row.id, row.day_id, row.completado_en]),
      ...archived.rows.map((row) => [
        row.original_id,
        row.day_id,
        row.completado_en,
      ]),
    ].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    assert.deepEqual(
      reconstructed,
      originals
        .map((row) => [...row])
        .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    );
    assert.equal(canonical.rows.length + archived.rows.length, originals.length);
    const completionColumns = await client.execute("PRAGMA table_info(day_completions)");
    assert.equal(
      completionColumns.rows.find((column) => column.name === "completado_en")
        ?.notnull,
      0
    );
    const archiveColumns = await client.execute(
      "PRAGMA table_info(day_completion_legacy_duplicates)"
    );
    assert.equal(
      archiveColumns.rows.find((column) => column.name === "completado_en")
        ?.notnull,
      0
    );

    await assert.rejects(
      client.execute(
        "INSERT INTO day_completions (id,day_id,completado_en) VALUES ('legacy-duplicate','day',400)"
      ),
      /UNIQUE/
    );
    await client.execute(
      "UPDATE day_executions SET client_mutation_id='day-operation' WHERE id='execution-day'"
    );
    await assert.rejects(
      client.execute(
        "INSERT INTO day_executions (id,athlete_id,source_program_id,source_day_id,client_mutation_id,program_name,week_number,day_name) VALUES ('other','athlete','program','other-day','day-operation','Bloque',1,'Otro')"
      ),
      /UNIQUE/
    );

    await client.execute(
      "INSERT INTO execution_sets (id,athlete_id,source_program_id,source_day_id,source_planned_set_id,client_mutation_id,program_name,week_number,day_name,exercise_name,set_number,target_reps,prescription_type,status) VALUES ('set-execution','athlete','program','day','set','set-operation','Bloque',1,'Día A','Sentadilla',1,5,'absoluto','completed')"
    );
    await assert.rejects(
      client.execute(
        "UPDATE day_executions SET client_mutation_id='set-operation' WHERE id='execution-day'"
      ),
      /client_mutation_id_reused/
    );
    await assert.rejects(
      client.execute(
        "INSERT INTO day_executions (id,athlete_id,source_program_id,source_day_id,client_mutation_id,program_name,week_number,day_name) VALUES ('cross-day','athlete','program','cross-day','set-operation','Bloque',1,'Otro')"
      ),
      /client_mutation_id_reused/
    );
    await assert.rejects(
      client.execute(
        "UPDATE execution_sets SET client_mutation_id='day-operation' WHERE id='set-execution'"
      ),
      /client_mutation_id_reused/
    );
    await assert.rejects(
      client.execute(
        "INSERT INTO execution_sets (id,athlete_id,source_program_id,source_day_id,source_planned_set_id,client_mutation_id,program_name,week_number,day_name,exercise_name,set_number,target_reps,prescription_type,status) VALUES ('cross-set','athlete','program','day','other-set','day-operation','Bloque',1,'Día A','Banca',2,5,'absoluto','skipped')"
      ),
      /client_mutation_id_reused/
    );

    await client.execute(
      "INSERT INTO day_executions (id,athlete_id,source_program_id,source_day_id,client_mutation_id,program_name,week_number,day_name) VALUES ('historical','athlete','program','historical-day',NULL,'Bloque',1,'Histórico')"
    );
    const integrity = await client.execute("PRAGMA integrity_check");
    assert.equal(integrity.rows[0].integrity_check, "ok");
    const foreignKeys = await client.execute("PRAGMA foreign_key_check");
    assert.equal(foreignKeys.rows.length, 0);
    const indexes = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='index' AND name IN ('day_completions_day_id_unique','day_executions_client_mutation_id_unique') ORDER BY name"
    );
    assert.equal(indexes.rows.length, 2);
    const triggers = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE '%operation_not_used_by_%'"
    );
    assert.equal(triggers.rows.length, 4);
  } finally {
    client.close();
    await rm(directory, { recursive: true, force: true });
  }
});
