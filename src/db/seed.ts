import bcrypt from "bcryptjs";
import { db } from "./index";
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
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const [coach] = await db
    .insert(coaches)
    .values({
      nombre: "Entrenador Demo",
      email: "demo@forja.app",
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
      accessPin: "4821",
    })
    .returning();

  await db.insert(records).values([
    { athleteId: martina.id, lift: "sentadilla", valorKg: 110, tipo: "real" },
    { athleteId: martina.id, lift: "banca", valorKg: 62.5, tipo: "real" },
    { athleteId: martina.id, lift: "peso_muerto", valorKg: 135, tipo: "real" },
  ]);

  const [program] = await db
    .insert(programs)
    .values({ athleteId: martina.id, nombre: "Bloque de fuerza - Julio" })
    .returning();

  const [week] = await db
    .insert(weeks)
    .values({ programId: program.id, numero: 1 })
    .returning();

  const [dayA] = await db
    .insert(days)
    .values({ weekId: week.id, nombre: "Día A", orden: 0 })
    .returning();

  const [squat] = await db
    .insert(exercises)
    .values({ dayId: dayA.id, nombre: "Sentadilla", orden: 0, descanso: "3 min" })
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
    dayId: dayA.id,
    completadoEn: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  });

  // Día B queda pendiente, para probar la vista del atleta por PIN.
  const [dayB] = await db
    .insert(days)
    .values({ weekId: week.id, nombre: "Día B", orden: 1 })
    .returning();

  const [bench] = await db
    .insert(exercises)
    .values({ dayId: dayB.id, nombre: "Press Banca", orden: 0, descanso: "2 min" })
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
  console.log("  Login del entrenador: demo@forja.app / demo1234");
  console.log(`  PIN del atleta (Martina Gomez): ${martina.accessPin}`);
  console.log("  → Entrá a /hoy/4821 desde el celular para ver el Día B pendiente.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error al cargar datos de demo:", err);
    process.exit(1);
  });
