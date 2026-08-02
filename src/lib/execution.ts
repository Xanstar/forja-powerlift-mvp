import { normalizarNombre } from "@/lib/nombres";

export type Lift = "sentadilla" | "banca" | "peso_muerto";

export type ExecutionResult = {
  sourceDayId: string;
  exerciseName: string;
  actualWeightKg: number | null;
  actualReps: number | null;
  status: "completed" | "skipped";
  recordedAt: Date;
};

export function liftForExercise(name: string): Lift | null {
  const normalized = normalizarNombre(name);
  if (normalized.includes("sentadilla") || normalized.includes("squat")) {
    return "sentadilla";
  }
  if (normalized.includes("banca") || normalized.includes("bench")) {
    return "banca";
  }
  if (
    normalized.includes("peso muerto") ||
    normalized.includes("deadlift") ||
    normalized.includes("despegue")
  ) {
    return "peso_muerto";
  }
  return null;
}

export function resolvePrescriptionKg(
  percentageRm: number | null,
  oneRmKg: number | null,
  incrementKg = 2.5
) {
  if (percentageRm == null || oneRmKg == null || oneRmKg <= 0) return null;
  return Math.round(((oneRmKg * percentageRm) / 100) / incrementKg) * incrementKg;
}

export function canCompleteSession(
  totalPlannedSets: number,
  recordedStatuses: Array<"completed" | "skipped">
) {
  return totalPlannedSets > 0 && recordedStatuses.length === totalPlannedSets;
}

export function assertPlanDeletionAllowed(executionCount: number) {
  if (executionCount > 0) {
    throw new Error(
      "No se puede eliminar: esta parte del programa ya tiene ejecución registrada. Conservá el historial y ajustá el trabajo pendiente."
    );
  }
}

export function aggregateSessionProgress(rows: ExecutionResult[]) {
  const sessions = new Map<
    string,
    { date: Date; exerciseName: string; topSetKg: number; estimatedOneRmKg: number }
  >();

  for (const row of rows) {
    if (
      row.status !== "completed" ||
      row.actualWeightKg == null ||
      row.actualReps == null
    ) {
      continue;
    }
    const key = `${row.sourceDayId}:${normalizarNombre(row.exerciseName)}`;
    const estimatedOneRmKg =
      row.actualWeightKg * (1 + Math.max(row.actualReps, 0) / 30);
    const current = sessions.get(key);
    if (!current) {
      sessions.set(key, {
        date: row.recordedAt,
        exerciseName: row.exerciseName,
        topSetKg: row.actualWeightKg,
        estimatedOneRmKg,
      });
      continue;
    }
    current.topSetKg = Math.max(current.topSetKg, row.actualWeightKg);
    current.estimatedOneRmKg = Math.max(
      current.estimatedOneRmKg,
      estimatedOneRmKg
    );
    if (row.recordedAt > current.date) current.date = row.recordedAt;
  }

  return [...sessions.values()]
    .map((session) => ({
      ...session,
      estimatedOneRmKg: Math.round(session.estimatedOneRmKg * 10) / 10,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
