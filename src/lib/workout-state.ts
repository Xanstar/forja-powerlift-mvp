export type LocalWorkoutLog = {
  id: string;
  pesoKgReal: number | null;
  repeticionesReales: number | null;
  rpeReal: number | null;
  status: "completed" | "skipped";
  skipReason: string | null;
  clientMutationId: string;
};

export function recordWorkoutLog(
  current: Record<string, LocalWorkoutLog>,
  setId: string,
  log: LocalWorkoutLog
) {
  return { ...current, [setId]: log };
}

export function workoutLogsForSummary(
  serverLogs: LocalWorkoutLog[],
  localLog?: LocalWorkoutLog
) {
  return localLog ? [localLog] : serverLogs;
}
