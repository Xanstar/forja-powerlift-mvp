import assert from "node:assert/strict";
import test from "node:test";
import { buildDirtyMarksRows } from "../src/lib/marks-dirty";
import {
  recordWorkoutLog,
  workoutLogsForSummary,
  type LocalWorkoutLog,
} from "../src/lib/workout-state";

const completedLog: LocalWorkoutLog = {
  id: "mutation-1",
  pesoKgReal: 120,
  repeticionesReales: 5,
  rpeReal: 8,
  status: "completed",
  skipReason: null,
  clientMutationId: "mutation-1",
};

test("newly recorded series is immediately available to completed summary", () => {
  const local = recordWorkoutLog({}, "set-1", completedLog);
  assert.deepEqual(workoutLogsForSummary([], local["set-1"]), [completedLog]);
});

test("marks payload includes only dirty fields", () => {
  const rows = buildDirtyMarksRows(
    ["athlete-1"],
    {
      "athlete-1": {
        peso: "83",
        sentadilla: "180",
        banca: "120",
        peso_muerto: "220",
        tipo: "real",
      },
    },
    { "athlete-1": { banca: true } }
  );
  assert.deepEqual(rows, [
    {
      athleteId: "athlete-1",
      peso: "",
      sentadilla: "",
      banca: "120",
      peso_muerto: "",
      tipo: "real",
    },
  ]);
});
