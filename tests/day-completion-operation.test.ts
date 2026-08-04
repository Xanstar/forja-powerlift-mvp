import assert from "node:assert/strict";
import test from "node:test";
import { dayCompletionOperationId } from "../src/lib/day-completion-operation";

test("day completion identity is deterministic without browser storage", () => {
  const day = "123e4567-e89b-12d3-a456-426614174000";
  const throwingStorage = {
    getItem: () => {
      throw new DOMException("denied", "SecurityError");
    },
  };

  assert.equal(
    dayCompletionOperationId(day),
    "day-completion:123e4567-e89b-12d3-a456-426614174000"
  );
  assert.equal(dayCompletionOperationId(day), dayCompletionOperationId(day));
  assert.notEqual(dayCompletionOperationId(day), dayCompletionOperationId("other-day"));
  assert.doesNotThrow(() => dayCompletionOperationId(day));
  assert.throws(() => throwingStorage.getItem(), { name: "SecurityError" });
});

test("day completion identity rejects values outside the server ID contract", () => {
  assert.throws(() => dayCompletionOperationId("day/with/slash"));
  assert.throws(() => dayCompletionOperationId("x".repeat(100)));
});
