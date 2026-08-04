import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveLandingStoryState,
  type StoryStage,
} from "../src/lib/landing-story-state";

const supportedMotion = {
  supportsIntersectionObserver: true,
  supportsTimeline: true,
  prefersReducedMotion: false,
};

test("derives initial, intermediate, and settled states for typed story stages", () => {
  const intermediateStage: StoryStage = "detect";

  assert.deepEqual(deriveLandingStoryState("program", supportedMotion), {
    stage: "program",
    phase: "initial",
  });
  assert.deepEqual(deriveLandingStoryState(intermediateStage, supportedMotion), {
    stage: "detect",
    phase: "intermediate",
  });
  assert.deepEqual(deriveLandingStoryState("adjust", supportedMotion), {
    stage: "adjust",
    phase: "settled",
  });
});

test("falls back to the complete static final record without required APIs", () => {
  assert.deepEqual(
    deriveLandingStoryState("execute", {
      ...supportedMotion,
      supportsTimeline: false,
    }),
    { stage: "adjust", phase: "static" }
  );
  assert.deepEqual(
    deriveLandingStoryState("review", {
      ...supportedMotion,
      supportsIntersectionObserver: false,
    }),
    { stage: "adjust", phase: "static" }
  );
});

test("recomputes from the supplied stage after a resize without sticking", () => {
  const beforeResize = deriveLandingStoryState("execute", supportedMotion);
  const afterResize = deriveLandingStoryState("review", supportedMotion);

  assert.deepEqual(beforeResize, { stage: "execute", phase: "intermediate" });
  assert.deepEqual(afterResize, { stage: "review", phase: "intermediate" });
});

test("uses the static final record when reduced motion is enabled or toggled", () => {
  const normalMotion = deriveLandingStoryState("review", supportedMotion);
  const reducedMotion = deriveLandingStoryState("review", {
    ...supportedMotion,
    prefersReducedMotion: true,
  });

  assert.deepEqual(normalMotion, { stage: "review", phase: "intermediate" });
  assert.deepEqual(reducedMotion, { stage: "adjust", phase: "static" });
});
