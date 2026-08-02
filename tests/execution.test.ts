import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateSessionProgress,
  canCompleteSession,
  liftForExercise,
  resolvePrescriptionKg,
} from "../src/lib/execution";

test("resolves percentage prescriptions from the relevant current lift mark", () => {
  assert.equal(liftForExercise("Press banca con pausa"), "banca");
  assert.equal(liftForExercise("Peso muerto sumo"), "peso_muerto");
  assert.equal(resolvePrescriptionKg(82.5, 151), 125);
  assert.equal(resolvePrescriptionKg(80, null), null);
});

test("requires every planned series to be completed or skipped", () => {
  assert.equal(canCompleteSession(3, ["completed", "skipped"]), false);
  assert.equal(
    canCompleteSession(3, ["completed", "skipped", "completed"]),
    true
  );
  assert.equal(canCompleteSession(0, []), false);
});

test("aggregates one trustworthy top set and e1RM per session", () => {
  const rows = [
    {
      sourceDayId: "day-1",
      exerciseName: "Sentadilla",
      actualWeightKg: 120,
      actualReps: 5,
      status: "completed" as const,
      recordedAt: new Date("2026-08-01T10:00:00Z"),
    },
    {
      sourceDayId: "day-1",
      exerciseName: "SENTADILLA",
      actualWeightKg: 125,
      actualReps: 3,
      status: "completed" as const,
      recordedAt: new Date("2026-08-01T10:05:00Z"),
    },
    {
      sourceDayId: "day-1",
      exerciseName: "Sentadilla",
      actualWeightKg: null,
      actualReps: null,
      status: "skipped" as const,
      recordedAt: new Date("2026-08-01T10:10:00Z"),
    },
  ];

  assert.deepEqual(aggregateSessionProgress(rows), [
    {
      date: new Date("2026-08-01T10:05:00Z"),
      exerciseName: "Sentadilla",
      topSetKg: 125,
      estimatedOneRmKg: 140,
    },
  ]);
});
