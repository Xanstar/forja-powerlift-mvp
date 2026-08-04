import bcrypt from "bcryptjs";
import { db } from "./index";
import { inicioDeSemana } from "../lib/calendario";
import { createAthleteAccessPinValue, legacyPinAccessEnabled } from "../lib/athlete-activation";
import { issueAthleteAccessToken } from "../lib/athlete-access-token";
import { ATHLETE_ACCESS_TOKEN_PATTERN } from "../lib/athlete-credential";
import {
  coaches,
  athletes,
  records,
  programs,
  weeks,
  days,
  exercises,
  plannedSets,
  setLogs,
  dayCompletions,
} from "./schema";

async function main() {
  const nombreAdmin = process.env.ADMIN_NOMBRE || "Administrador";
  const emailAdmin = process.env.ADMIN_EMAIL || "admin";
  const passwordAdmin = process.env.ADMIN_PASSWORD || "admin";

  const passwordHash = await bcrypt.hash(passwordAdmin, 10);
  const [coach] = await db
    .insert(coaches)
    .values({
      nombre: nombreAdmin,
      email: emailAdmin,
      passwordHash,
    })
    .returning();

  const [martina] = await db
    .insert(athletes)
    .values({
      coachId: coach.id,
      nombre: "Martina",
      apellido: "Gomez",
      categoria: "-63kg",
      pesoCorporal: 62.4,
      altura: 165,
      sexo: "femenino",
      estado: "activo",
      notas: "Prioridad técnica en sentadilla.",
      accessPin: createAthleteAccessPinValue(),
    })
    .returning();

  await db.insert(records).values([
    { athleteId: martina.id, lift: "sentadilla", valorKg: 110, tipo: "real" },
    { athleteId: martina.id, lift: "banca", valorKg: 62.5, tipo: "real" },
    { athleteId: martina.id, lift: "peso_muerto", valorKg: 135, tipo: "real" },
  ]);

  const [program] = await db
    .insert(programs)
    .values({
      athleteId: martina.id,
      nombre: "Bloque de fuerza - Julio",
      fechaInicio: inicioDeSemana(new Date()),
      semanas: 4,
    })
    .returning();

  const semanas = await db
    .insert(weeks)
    .values(
      Array.from({ length: 4 }).map((_, i) => ({
        programId: program.id,
        numero: i + 1,
      }))
    )
    .returning();
  const week = semanas[0];

  const [day1] = await db
    .insert(days)
    .values({ weekId: week.id, nombre: "Día 1", orden: 0 })
    .returning();

  const [squat] = await db
    .insert(exercises)
    .values({ dayId: day1.id, nombre: "Sentadilla", orden: 0, descanso: "3 min" })
    .returning();

  const squatSets = await db
    .insert(plannedSets)
    .values(
      Array.from({ length: 5 }).map((_, i) => ({
        exerciseId: squat.id,
        numeroSet: i + 1,
        repeticionesObjetivo: 5,
        pesoTipo: "porcentaje_rm" as const,
        porcentajeRm: 75,
        rpeObjetivo: 8,
      }))
    )
    .returning();

  // El coach ya completó este día en el pasado, para que el historial tenga datos.
  await db.insert(setLogs).values(
    squatSets.map((s) => ({
      plannedSetId: s.id,
      pesoKgReal: 82.5,
      repeticionesReales: 5,
      rpeReal: 8,
      completadoEn: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    }))
  );
  await db.insert(dayCompletions).values({
    dayId: day1.id,
    completadoEn: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  });

  // Día 2 queda pendiente para probar la vista canónica del atleta.
  const [day2] = await db
    .insert(days)
    .values({ weekId: week.id, nombre: "Día 2", orden: 1 })
    .returning();

  const [bench] = await db
    .insert(exercises)
    .values({ dayId: day2.id, nombre: "Press Banca", orden: 0, descanso: "2 min" })
    .returning();

  await db.insert(plannedSets).values(
    Array.from({ length: 4 }).map((_, i) => ({
      exerciseId: bench.id,
      numeroSet: i + 1,
      repeticionesObjetivo: 5,
      pesoTipo: "absoluto" as const,
      pesoKg: 47,
      rpeObjetivo: 7.5,
    }))
  );

  console.log("✓ Datos de demo cargados.\n");
  console.log(`  Usuario del entrenador: ${emailAdmin}`);
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required to seed athlete access.");
  const demoToken = process.env.ATHLETE_DEMO_ACCESS_TOKEN?.trim();
  if (!demoToken || !ATHLETE_ACCESS_TOKEN_PATTERN.test(demoToken)) {
    throw new Error(
      "ATHLETE_DEMO_ACCESS_TOKEN must be a 32-byte base64url token. Generate it with crypto.randomBytes(32)."
    );
  }
  await issueAthleteAccessToken(db, martina.id, secret, new Date(), () => demoToken);
  console.log("  Acceso atleta: usá ATHLETE_DEMO_ACCESS_TOKEN en /hoy.");
  if (legacyPinAccessEnabled()) {
    console.log("  El modo PIN legado está habilitado para esta fixture.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error al cargar datos de demo:", err);
    process.exit(1);
  });
