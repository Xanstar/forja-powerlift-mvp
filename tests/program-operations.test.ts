import assert from "node:assert/strict";
import test from "node:test";
import { assertPlanDeletionAllowed } from "../src/lib/execution";

test("program deletion is allowed only without historical execution", () => {
  assert.doesNotThrow(() => assertPlanDeletionAllowed(0));
  assert.throws(() => assertPlanDeletionAllowed(1), /ejecución registrada/);
});
