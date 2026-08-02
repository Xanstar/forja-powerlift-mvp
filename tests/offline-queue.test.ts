import assert from "node:assert/strict";
import test from "node:test";
import { syncPendingQueue, type PendingLog } from "../src/lib/offline-queue";

const pending = (id: string): PendingLog => ({
  plannedSetId: `set-${id}`,
  data: { clientMutationId: id, repeticionesReales: 5 },
  timestamp: 1,
});

test("offline sync removes only confirmed idempotent writes", async () => {
  const received: string[] = [];
  const result = await syncPendingQueue(
    [pending("a"), pending("b"), pending("c")],
    async (_setId, data) => {
      received.push(data.clientMutationId);
      if (data.clientMutationId === "b") throw new Error("offline");
    }
  );
  assert.deepEqual(received, ["a", "b"]);
  assert.equal(result.synced, 1);
  assert.deepEqual(result.conflicts, []);
  assert.deepEqual(
    result.remaining.map((item) => item.data.clientMutationId),
    ["b", "c"]
  );
});

test("offline sync separates confirmed conflicts from retryable writes", async () => {
  const result = await syncPendingQueue([pending("a")], async () => ({
    outcome: "conflict" as const,
  }));
  assert.equal(result.remaining.length, 0);
  assert.equal(result.synced, 0);
  assert.equal(result.conflicts.length, 1);
});
