import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

test("execution snapshots survive planning changes and reject duplicate mutations", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forja-execution-"));
  const client = createClient({ url: `file:${join(directory, "fixture.db")}` });
  const database = drizzle(client);
  try {
    await migrate(database, { migrationsFolder: join(process.cwd(), "drizzle") });
    await client.batch(
      [
        "INSERT INTO coaches (id,nombre,email,password_hash) VALUES ('coach','Coach','coach@test.local','hash')",
        "INSERT INTO athletes (id,coach_id,nombre,apellido,access_pin) VALUES ('athlete','coach','Ana','Prueba','1234')",
        "INSERT INTO programs (id,athlete_id,nombre,semanas,activo,status,version) VALUES ('program','athlete','Bloque original',1,1,'published',1)",
        "INSERT INTO weeks (id,program_id,numero) VALUES ('week','program',1)",
        "INSERT INTO days (id,week_id,nombre,orden) VALUES ('day','week','Día A',0)",
        "INSERT INTO exercises (id,day_id,nombre,orden) VALUES ('exercise','day','Sentadilla',0)",
        "INSERT INTO planned_sets (id,exercise_id,numero_set,repeticiones_objetivo,peso_tipo,peso_kg) VALUES ('set','exercise',1,5,'absoluto',120)",
        "INSERT INTO execution_sets (id,athlete_id,source_program_id,source_day_id,source_planned_set_id,client_mutation_id,program_name,week_number,day_name,exercise_name,set_number,target_reps,prescription_type,prescribed_weight_kg,status,actual_weight_kg,actual_reps) VALUES ('execution','athlete','program','day','set','mutation-1','Bloque original',1,'Día A','Sentadilla',1,5,'absoluto',120,'completed',117.5,5)",
        "UPDATE planned_sets SET peso_kg=130,repeticiones_objetivo=3 WHERE id='set'",
        "DELETE FROM days WHERE id='day'",
      ],
      "write"
    );

    const snapshot = await client.execute(
      "SELECT program_name, day_name, exercise_name, target_reps, prescribed_weight_kg, actual_weight_kg FROM execution_sets WHERE id='execution'"
    );
    assert.deepEqual(snapshot.rows[0], {
      program_name: "Bloque original",
      day_name: "Día A",
      exercise_name: "Sentadilla",
      target_reps: 5,
      prescribed_weight_kg: 120,
      actual_weight_kg: 117.5,
    });
    await assert.rejects(
      client.execute(
        "INSERT INTO execution_sets (id,athlete_id,source_program_id,source_day_id,source_planned_set_id,client_mutation_id,program_name,week_number,day_name,exercise_name,set_number,target_reps,prescription_type,status) VALUES ('duplicate','athlete','program','day','other-set','mutation-1','Bloque',1,'Día','Sentadilla',2,5,'absoluto','skipped')"
      ),
      /UNIQUE/
    );
  } finally {
    client.close();
    await rm(directory, { recursive: true, force: true });
  }
});
