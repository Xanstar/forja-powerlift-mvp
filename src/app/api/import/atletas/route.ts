import { auth } from "@/lib/auth";
import { db } from "@/db";
import { athletes, records } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { parseAtletasExcel } from "@/lib/excel";
import { LIFTS } from "@/lib/queries";

const MAX_BYTES = 4_000_000;

function generarPin(pinsUsados: Set<string>): string {
  let pin: string;
  do {
    pin = Math.floor(1000 + Math.random() * 9000).toString();
  } while (pinsUsados.has(pin));
  pinsUsados.add(pin);
  return pin;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }
  const coachId = (session.user as { id: string }).id;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "El archivo es demasiado grande (máx. 4 MB)." },
      { status: 413 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const { filas, columnasReconocidas } = parseAtletasExcel(buf);

  if (columnasReconocidas === 0) {
    return Response.json(
      {
        error:
          "No se reconocieron las columnas del archivo. Descargá la plantilla y completala con el mismo formato.",
      },
      { status: 400 }
    );
  }
  if (filas.length === 0) {
    return Response.json(
      { error: "El archivo no tiene filas de datos después de la primera (encabezados)." },
      { status: 400 }
    );
  }

  const existentes = await db.query.athletes.findMany({
    where: eq(athletes.coachId, coachId),
  });
  const clavesExistentes = new Set(
    existentes.map(
      (a) => `${a.nombre.trim().toLowerCase()}|${a.apellido.trim().toLowerCase()}`
    )
  );
  const pinsUsados = new Set(existentes.map((a) => a.accessPin));

  const creados: string[] = [];
  const duplicados: string[] = [];
  const errores: string[] = [];
  const marcasAIngresar: {
    athleteId: string;
    lift: (typeof LIFTS)[number];
    valorKg: number;
  }[] = [];

  for (const f of filas) {
    if (!f.nombre || !f.apellido) {
      errores.push(`Fila ${f.filaNum}: falta nombre o apellido.`);
      continue;
    }
    const clave = `${f.nombre.trim().toLowerCase()}|${f.apellido.trim().toLowerCase()}`;
    if (clavesExistentes.has(clave)) {
      duplicados.push(`${f.nombre} ${f.apellido}`);
      continue;
    }

    const [nuevo] = await db
      .insert(athletes)
      .values({
        coachId,
        nombre: f.nombre.trim(),
        apellido: f.apellido.trim(),
        categoria: f.categoria ?? null,
        sexo: f.sexo ?? null,
        pesoCorporal: f.pesoCorporal ?? null,
        altura: f.altura ?? null,
        notas: f.notas ?? null,
        accessPin: generarPin(pinsUsados),
      })
      .returning();

    clavesExistentes.add(clave);
    creados.push(`${nuevo.nombre} ${nuevo.apellido}`);

    for (const lift of LIFTS) {
      const kg = f.marcas[lift];
      if (kg != null && kg > 0) {
        marcasAIngresar.push({ athleteId: nuevo.id, lift, valorKg: kg });
      }
    }
  }

  if (marcasAIngresar.length > 0) {
    await db.insert(records).values(
      marcasAIngresar.map((m) => ({ ...m, tipo: "real" as const }))
    );
  }

  revalidatePath("/atletas");
  revalidatePath("/dashboard");
  revalidatePath("/marcas");

  return Response.json({
    creados: creados.length,
    duplicados: duplicados.length,
    errores: errores.length,
    detalle: {
      creados,
      duplicados,
      errores: errores.slice(0, 20),
    },
  });
}
