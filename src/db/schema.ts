import {
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
  accessPin: text("access_pin").notNull(), // PIN de 4-6 dígitos para que el atleta entre desde su celular sin cuenta propia
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

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
}));

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
