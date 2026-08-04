export type StoryStage = "program" | "execute" | "detect" | "review" | "adjust";

export type StoryPhase = "static" | "initial" | "intermediate" | "settled";

export type LandingStoryMotionSupport = {
  supportsIntersectionObserver: boolean;
  supportsTimeline: boolean;
  prefersReducedMotion: boolean;
};

export type LandingStoryState = {
  stage: StoryStage;
  phase: StoryPhase;
};

const STATIC_FINAL_STATE: LandingStoryState = {
  stage: "adjust",
  phase: "static",
};

export function deriveLandingStoryState(
  stage: StoryStage,
  support: LandingStoryMotionSupport
): LandingStoryState {
  if (
    support.prefersReducedMotion ||
    !support.supportsIntersectionObserver ||
    !support.supportsTimeline
  ) {
    return STATIC_FINAL_STATE;
  }

  if (stage === "program") return { stage, phase: "initial" };
  if (stage === "adjust") return { stage, phase: "settled" };

  return { stage, phase: "intermediate" };
}
