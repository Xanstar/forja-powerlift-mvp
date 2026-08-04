import type { Client } from "@libsql/client";
import { and, eq, inArray, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import type { db as applicationDb } from "@/db";
import * as schema from "@/db/schema";
import {
  dayCompletions,
  dayExecutions,
  days,
  executionSets,
  exercises,
  plannedSets,
  programs,
  weeks,
} from "@/db/schema";

export type DayCompletionResult =
  | {
      outcome: "applied" | "duplicate";
      dayExecutionId: string;
      completedAt: string;
    }
  | {
      outcome: "conflict";
      reason:
        | "day_already_completed"
        | "operation_reused"
        | "incomplete_evidence"
        | "evidence_mismatch"
        | "zero_set_day";
    };

export type DayCompletionDatabase = typeof applicationDb;

type CompleteDayInput = {
  athleteId: string;
  dayId: string;
  clientMutationId: string;
  now?: () => Date;
  createId?: () => string;
};

const VALID_MUTATION_ID = /^[A-Za-z0-9._:-]+$/;

export function assertValidDayCompletionMutationId(clientMutationId: string) {
  if (
    typeof clientMutationId !== "string" ||
    clientMutationId.length < 1 ||
    clientMutationId.length > 100 ||
    !VALID_MUTATION_ID.test(clientMutationId)
  ) {
    throw new Error("Identificador de escritura inválido.");
  }
}

function executionResult(
  outcome: "applied" | "duplicate",
  row: { id: string; completedAt: Date }
): DayCompletionResult {
  return {
    outcome,
    dayExecutionId: row.id,
    completedAt: row.completedAt.toISOString(),
  };
}

async function classifyAuthoritativeState(
  database: DayCompletionDatabase,
  dayId: string,
  clientMutationId: string
): Promise<DayCompletionResult | null> {
  const operation = await database
    .select({
      id: dayExecutions.id,
      sourceDayId: dayExecutions.sourceDayId,
      completedAt: dayExecutions.completedAt,
    })
    .from(dayExecutions)
    .where(eq(dayExecutions.clientMutationId, clientMutationId))
    .limit(1);
  if (operation[0]) {
    return operation[0].sourceDayId === dayId
      ? executionResult("duplicate", operation[0])
      : { outcome: "conflict", reason: "operation_reused" };
  }

  const setOperation = await database
    .select({ id: executionSets.id })
    .from(executionSets)
    .where(eq(executionSets.clientMutationId, clientMutationId))
    .limit(1);
  if (setOperation.length > 0) {
    return { outcome: "conflict", reason: "operation_reused" };
  }

  const existingDay = await database
    .select({ id: dayExecutions.id })
    .from(dayExecutions)
    .where(eq(dayExecutions.sourceDayId, dayId))
    .limit(1);
  if (existingDay.length > 0) {
    return { outcome: "conflict", reason: "day_already_completed" };
  }

  const existingLegacy = await database
    .select({ id: dayCompletions.id })
    .from(dayCompletions)
    .where(eq(dayCompletions.dayId, dayId))
    .limit(1);
  return existingLegacy.length > 0
    ? { outcome: "conflict", reason: "day_already_completed" }
    : null;
}

function normalizeCompletionTimestamp(value: Date) {
  const milliseconds = value.getTime();
  if (!Number.isFinite(milliseconds)) throw new Error("Invalid completion timestamp");
  return new Date(Math.floor(milliseconds / 1000) * 1000);
}

function completionErrorDetails(error: unknown) {
  const details: Array<{ code: string; message: string }> = [];
  const visited = new Set<unknown>();
  let current = error;
  while (current && !visited.has(current)) {
    visited.add(current);
    if (typeof current === "object") {
      const value = current as { code?: unknown; message?: unknown; cause?: unknown };
      details.push({
        code: typeof value.code === "string" ? value.code : "",
        message: typeof value.message === "string" ? value.message : "",
      });
      current = value.cause;
    } else {
      details.push({ code: "", message: String(current) });
      break;
    }
  }
  return details;
}

function isRecoverableCompletionRace(error: unknown) {
  return completionErrorDetails(error).some(({ code, message }) => {
    if (code === "SQLITE_BUSY" || code === "SQLITE_LOCKED") return true;
    if (/SQLITE_(?:BUSY|LOCKED)|database is locked/i.test(message)) return true;
    if (message.includes("client_mutation_id_reused")) return true;
    if (
      /UNIQUE constraint failed:/i.test(message) &&
      /day_executions\.(?:client_mutation_id|source_day_id)|day_completions\.day_id/i.test(
        message
      )
    ) {
      return true;
    }
    return /(?:transaction|stream|connection).*(?:closed|committed|rolled back)|fetch failed/i.test(
      message
    );
  });
}

async function executeNewCompletion(
  tx: DayCompletionDatabase,
  input: CompleteDayInput,
  now: () => Date,
  createId: () => string
): Promise<DayCompletionResult> {
  const source = await tx
    .select({
      programId: programs.id,
      programName: programs.nombre,
      weekNumber: weeks.numero,
      dayName: days.nombre,
    })
    .from(days)
    .innerJoin(weeks, eq(days.weekId, weeks.id))
    .innerJoin(programs, eq(weeks.programId, programs.id))
    .where(and(eq(days.id, input.dayId), eq(programs.athleteId, input.athleteId)))
    .limit(1);
  if (!source[0]) throw new Error("DAY_COMPLETION_SOURCE_CHANGED");

  const existing = await classifyAuthoritativeState(
    tx,
    input.dayId,
    input.clientMutationId
  );
  if (existing) return existing;

  const planned = await tx
    .select({ id: plannedSets.id })
    .from(plannedSets)
    .innerJoin(exercises, eq(plannedSets.exerciseId, exercises.id))
    .where(eq(exercises.dayId, input.dayId));
  if (planned.length === 0) {
    return { outcome: "conflict", reason: "zero_set_day" };
  }

  const plannedIds = planned.map((set) => set.id);
  const evidence = await tx
    .select({
      athleteId: executionSets.athleteId,
      sourceDayId: executionSets.sourceDayId,
      sourcePlannedSetId: executionSets.sourcePlannedSetId,
      status: executionSets.status,
    })
    .from(executionSets)
    .where(
      or(
        eq(executionSets.sourceDayId, input.dayId),
        inArray(executionSets.sourcePlannedSetId, plannedIds)
      )
    );

  const plannedIdSet = new Set(plannedIds);
  const seen = new Set<string>();
  const mismatch = evidence.some((row) => {
    const duplicate = seen.has(row.sourcePlannedSetId);
    seen.add(row.sourcePlannedSetId);
    return (
      duplicate ||
      row.athleteId !== input.athleteId ||
      row.sourceDayId !== input.dayId ||
      !plannedIdSet.has(row.sourcePlannedSetId) ||
      (row.status !== "completed" && row.status !== "skipped")
    );
  });
  if (mismatch) {
    return { outcome: "conflict", reason: "evidence_mismatch" };
  }
  if (seen.size !== plannedIdSet.size) {
    return { outcome: "conflict", reason: "incomplete_evidence" };
  }

  const completedAt = normalizeCompletionTimestamp(now());
  const dayExecutionId = createId();
  await tx.insert(dayExecutions).values({
    id: dayExecutionId,
    athleteId: input.athleteId,
    sourceProgramId: source[0].programId,
    sourceDayId: input.dayId,
    clientMutationId: input.clientMutationId,
    programName: source[0].programName,
    weekNumber: source[0].weekNumber,
    dayName: source[0].dayName,
    completedAt,
  });
  await tx.insert(dayCompletions).values({
    dayId: input.dayId,
    completadoEn: completedAt,
  });
  return executionResult("applied", { id: dayExecutionId, completedAt });
}

export async function completeDay(
  database: DayCompletionDatabase,
  input: CompleteDayInput
): Promise<DayCompletionResult> {
  assertValidDayCompletionMutationId(input.clientMutationId);
  const now = input.now ?? (() => new Date());
  const createId = input.createId ?? (() => crypto.randomUUID());

  try {
    const transaction = await database.$client.transaction("write");
    const tx = drizzle(transaction as unknown as Client, {
      schema,
    }) as DayCompletionDatabase;
    try {
      const result = await executeNewCompletion(tx, input, now, createId);
      await transaction.commit();
      return result;
    } catch (error) {
      try {
        await transaction.rollback();
      } catch {
        // Preserve the command/commit error; it determines whether reread is safe.
      }
      throw error;
    }
  } catch (error) {
    if (!isRecoverableCompletionRace(error)) throw error;
    for (const delayMs of [5, 15, 30, 50]) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      try {
        const authoritative = await classifyAuthoritativeState(
          database,
          input.dayId,
          input.clientMutationId
        );
        if (authoritative) return authoritative;
      } catch {
        // An ambiguous commit may take a moment to become visible on reread.
      }
    }
    throw error;
  }
}
