import {
  index,
  primaryKey,
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// USERS (coach = tenant en este MVP; el atleta no tiene login propio todavía,
// accede via link/PIN — ver nota en README de decisiones de producto)
// ---------------------------------------------------------------------------

export const coaches = sqliteTable("coaches", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  nombre: text("nombre").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const accessRequests = sqliteTable("access_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  organization: text("organization"),
  profile: text("profile", { enum: ["coach", "gym"] }).notNull(),
  status: text("status", { enum: ["pending", "contacted", "closed"] })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ---------------------------------------------------------------------------
// ATLETAS
// ---------------------------------------------------------------------------

export const athletes = sqliteTable("athletes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  coachId: text("coach_id")
    .notNull()
    .references(() => coaches.id, { onDelete: "cascade" }),
  nombre: text("nombre").notNull(),
  apellido: text("apellido").notNull(),
  fotoUrl: text("foto_url"),
  fechaNacimiento: integer("fecha_nacimiento", { mode: "timestamp" }),
  pesoCorporal: real("peso_corporal"), // kg, último registrado
  altura: real("altura"), // cm
  categoria: text("categoria"), // categoría de peso powerlifting (ej. -83kg)
  sexo: text("sexo", { enum: ["masculino", "femenino"] }),
  fechaIngreso: integer("fecha_ingreso", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  estado: text("estado", { enum: ["activo", "inactivo"] })
    .notNull()
    .default("activo"),
  notas: text("notas"),
  telefonoE164: text("telefono_e164").unique(),
  telefonoVerificadoAt: integer("telefono_verificado_at", { mode: "timestamp" }),
  invitacionEnviadaAt: integer("invitacion_enviada_at", { mode: "timestamp" }),
  accessPin: text("access_pin").notNull(), // Columna heredada; sólo contiene PIN si el flag legado está habilitado.
  credentialVersion: integer("credential_version").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const athleteActivationChallenges = sqliteTable(
  "athlete_activation_challenges",
  {
    id: text("id").primaryKey(),
    athleteId: text("athlete_id")
      .notNull()
      .unique()
      .references(() => athletes.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    sentAt: integer("sent_at", { mode: "timestamp" }).notNull(),
    consumedAt: integer("consumed_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  }
);

export const athleteAccessTokens = sqliteTable(
  "athlete_access_tokens",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    athleteId: text("athlete_id")
      .notNull()
      .unique()
      .references(() => athletes.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    credentialVersion: integer("credential_version").notNull(),
    issuedAt: integer("issued_at", { mode: "timestamp" }).notNull(),
    rotatedAt: integer("rotated_at", { mode: "timestamp" }),
    revokedAt: integer("revoked_at", { mode: "timestamp" }),
  },
  (table) => [index("athlete_access_tokens_active_idx").on(table.revokedAt)]
);

export const accessRateLimits = sqliteTable(
  "access_rate_limits",
  {
    scope: text("scope").notNull(),
    keyHash: text("key_hash").notNull(),
    windowStartMs: integer("window_start_ms").notNull(),
    attemptCount: integer("attempt_count").notNull(),
    lockedUntilMs: integer("locked_until_ms"),
    updatedAtMs: integer("updated_at_ms").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.scope, table.keyHash] }),
    index("access_rate_limits_updated_idx").on(table.updatedAtMs),
  ]
);

// Récords de fuerza (1RM real o estimado) por levantamiento.
// Es lo que permite programar en % y graficar evolución real de fuerza.
export const records = sqliteTable("records", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  athleteId: text("athlete_id")
    .notNull()
    .references(() => athletes.id, { onDelete: "cascade" }),
  lift: text("lift", { enum: ["sentadilla", "banca", "peso_muerto"] }).notNull(),
  valorKg: real("valor_kg").notNull(),
  tipo: text("tipo", { enum: ["real", "estimado"] }).notNull().default("estimado"),
  fecha: integer("fecha", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ---------------------------------------------------------------------------
// PLANIFICACIÓN: Programa -> Semana -> Día -> Ejercicio -> Set
// (agrupador "Programa" agregado a propósito para no tener que migrar
// cuando el entrenador empiece a pensar en mesociclos/bloques)
// ---------------------------------------------------------------------------

export const programs = sqliteTable("programs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  athleteId: text("athlete_id")
    .notNull()
    .references(() => athletes.id, { onDelete: "cascade" }),
  nombre: text("nombre").notNull(), // ej. "Bloque de fuerza - Julio"
  fechaInicio: integer("fecha_inicio", { mode: "timestamp" }), // lunes de la semana 1 (base del calendario del atleta)
  semanas: integer("semanas").notNull().default(4), // duración del programa (lista finita, no infinito)
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  status: text("status", { enum: ["draft", "published"] })
    .notNull()
    .default("draft"),
  version: integer("version").notNull().default(1),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const weeks = sqliteTable("weeks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  programId: text("program_id")
    .notNull()
    .references(() => programs.id, { onDelete: "cascade" }),
  numero: integer("numero").notNull(), // Semana 1, 2, 3...
  etiqueta: text("etiqueta"), // ej. "Descarga", "Pico"
});

export const days = sqliteTable("days", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  weekId: text("week_id")
    .notNull()
    .references(() => weeks.id, { onDelete: "cascade" }),
  nombre: text("nombre").notNull(), // "Día A", "Día B"...
  orden: integer("orden").notNull().default(0),
  fecha: integer("fecha", { mode: "timestamp" }), // fecha calendario opcional
});

export const exercises = sqliteTable("exercises", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  dayId: text("day_id")
    .notNull()
    .references(() => days.id, { onDelete: "cascade" }),
  nombre: text("nombre").notNull(), // "Sentadilla", "Press Banca"...
  orden: integer("orden").notNull().default(0),
  descanso: text("descanso"), // ej. "2-3 min"
  observaciones: text("observaciones"),
});

// Cada serie planificada, individual. Esto es lo que reemplaza al viejo
// modelo de "series/reps/peso" como campo único por ejercicio.
export const plannedSets = sqliteTable("planned_sets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  numeroSet: integer("numero_set").notNull(), // 1, 2, 3...
  repeticionesObjetivo: integer("repeticiones_objetivo").notNull(),
  pesoTipo: text("peso_tipo", { enum: ["absoluto", "porcentaje_rm"] })
    .notNull()
    .default("absoluto"),
  pesoKg: real("peso_kg"), // usado si pesoTipo = absoluto
  porcentajeRm: real("porcentaje_rm"), // usado si pesoTipo = porcentaje_rm
  rpeObjetivo: real("rpe_objetivo"), // opcional
});

// ---------------------------------------------------------------------------
// EJECUCIÓN: lo que el atleta realmente hizo, set por set
// ---------------------------------------------------------------------------

export const setLogs = sqliteTable("set_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  plannedSetId: text("planned_set_id")
    .notNull()
    .references(() => plannedSets.id, { onDelete: "cascade" }),
  pesoKgReal: real("peso_kg_real"),
  repeticionesReales: integer("repeticiones_reales"),
  rpeReal: real("rpe_real"),
  comentario: text("comentario"),
  completadoEn: integer("completado_en", { mode: "timestamp" }),
});

// Marca de "entrenamiento completado" a nivel día, para el dashboard
export const dayCompletions = sqliteTable("day_completions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  dayId: text("day_id")
    .notNull()
    .references(() => days.id, { onDelete: "cascade" }),
  completadoEn: integer("completado_en", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Immutable execution evidence. Source IDs are intentionally not foreign keys:
// editing or retiring a plan must never rewrite completed training history.
export const executionSets = sqliteTable("execution_sets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  athleteId: text("athlete_id").notNull(),
  sourceProgramId: text("source_program_id").notNull(),
  sourceDayId: text("source_day_id").notNull(),
  sourcePlannedSetId: text("source_planned_set_id").notNull().unique(),
  clientMutationId: text("client_mutation_id").notNull().unique(),
  programName: text("program_name").notNull(),
  weekNumber: integer("week_number").notNull(),
  dayName: text("day_name").notNull(),
  exerciseName: text("exercise_name").notNull(),
  setNumber: integer("set_number").notNull(),
  targetReps: integer("target_reps").notNull(),
  targetRpe: real("target_rpe"),
  prescriptionType: text("prescription_type", {
    enum: ["absoluto", "porcentaje_rm"],
  }).notNull(),
  prescribedWeightKg: real("prescribed_weight_kg"),
  percentageRm: real("percentage_rm"),
  sourceOneRmKg: real("source_one_rm_kg"),
  status: text("status", { enum: ["completed", "skipped"] }).notNull(),
  skipReason: text("skip_reason"),
  actualWeightKg: real("actual_weight_kg"),
  actualReps: integer("actual_reps"),
  actualRpe: real("actual_rpe"),
  comment: text("comment"),
  recordedAt: integer("recorded_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const dayExecutions = sqliteTable("day_executions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  athleteId: text("athlete_id").notNull(),
  sourceProgramId: text("source_program_id").notNull(),
  sourceDayId: text("source_day_id").notNull().unique(),
  programName: text("program_name").notNull(),
  weekNumber: integer("week_number").notNull(),
  dayName: text("day_name").notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ---------------------------------------------------------------------------
// RELATIONS (para queries anidadas con drizzle)
// ---------------------------------------------------------------------------

export const coachesRelations = relations(coaches, ({ many }) => ({
  athletes: many(athletes),
}));

export const athletesRelations = relations(athletes, ({ one, many }) => ({
  coach: one(coaches, { fields: [athletes.coachId], references: [coaches.id] }),
  programs: many(programs),
  records: many(records),
  activationChallenge: one(athleteActivationChallenges),
  accessToken: one(athleteAccessTokens),
}));

export const athleteActivationChallengesRelations = relations(
  athleteActivationChallenges,
  ({ one }) => ({
    athlete: one(athletes, {
      fields: [athleteActivationChallenges.athleteId],
      references: [athletes.id],
    }),
  })
);

export const athleteAccessTokensRelations = relations(
  athleteAccessTokens,
  ({ one }) => ({
    athlete: one(athletes, {
      fields: [athleteAccessTokens.athleteId],
      references: [athletes.id],
    }),
  })
);

export const programsRelations = relations(programs, ({ one, many }) => ({
  athlete: one(athletes, { fields: [programs.athleteId], references: [athletes.id] }),
  weeks: many(weeks),
}));

export const weeksRelations = relations(weeks, ({ one, many }) => ({
  program: one(programs, { fields: [weeks.programId], references: [programs.id] }),
  days: many(days),
}));

export const daysRelations = relations(days, ({ one, many }) => ({
  week: one(weeks, { fields: [days.weekId], references: [weeks.id] }),
  exercises: many(exercises),
  completions: many(dayCompletions),
}));

export const dayCompletionsRelations = relations(dayCompletions, ({ one }) => ({
  day: one(days, { fields: [dayCompletions.dayId], references: [days.id] }),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  day: one(days, { fields: [exercises.dayId], references: [days.id] }),
  sets: many(plannedSets),
}));

export const plannedSetsRelations = relations(plannedSets, ({ one, many }) => ({
  exercise: one(exercises, { fields: [plannedSets.exerciseId], references: [exercises.id] }),
  logs: many(setLogs),
}));

export const setLogsRelations = relations(setLogs, ({ one }) => ({
  plannedSet: one(plannedSets, { fields: [setLogs.plannedSetId], references: [plannedSets.id] }),
}));
