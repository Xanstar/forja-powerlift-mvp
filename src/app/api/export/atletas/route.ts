import { auth } from "@/lib/auth";
import { db } from "@/db";
import { athletes, records } from "@/db/schema";
import { eq } from "drizzle-orm";
import { buildAtletasExportXlsx, type FilaExportAtleta } from "@/lib/excel";
import { LIFTS, type Lift } from "@/lib/queries";
import { appName } from "@/lib/config";
import { totalDesdeRecords, puntajeWilks, puntajeIpfGl } from "@/lib/scoring";

const NOMBRES_LIFT: Record<Lift, string> = {
  sentadilla: "Sentadilla",
  banca: "Press Banca",
  peso_muerto: "Peso Muerto",
};

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }
  const coachId = (session.user as { id: string }).id;

  const misAtletas = await db.query.athletes.findMany({
    where: eq(athletes.coachId, coachId),
    orderBy: (a, { asc }) => [asc(a.nombre)],
  });

  const historialRaw = await db
    .select({
      atletaNombre: athletes.nombre,
      atletaApellido: athletes.apellido,
      lift: records.lift,
      valorKg: records.valorKg,
      tipo: records.tipo,
      fecha: records.fecha,
    })
    .from(records)
    .innerJoin(athletes, eq(records.athleteId, athletes.id))
    .where(eq(athletes.coachId, coachId))
    .orderBy(records.fecha);

  const historial = historialRaw.map((h) => ({
    atleta: `${h.atletaNombre} ${h.atletaApellido}`,
    lift: NOMBRES_LIFT[h.lift as Lift] ?? h.lift,
    valorKg: h.valorKg,
    tipo: h.tipo,
    fecha: new Date(h.fecha).toLocaleDateString("es-AR"),
  }));

  // Última marca por levantamiento, por atleta.
  const ultimas = new Map<string, Partial<Record<Lift, { valorKg: number; tipo: string }>>>();
  for (const h of historialRaw) {
    const actuales = ultimas.get(h.atletaNombre + "|" + h.atletaApellido) ?? {};
    actuales[h.lift as Lift] = { valorKg: h.valorKg, tipo: h.tipo };
    ultimas.set(h.atletaNombre + "|" + h.atletaApellido, actuales);
  }

  const filas: FilaExportAtleta[] = misAtletas.map((a) => {
    const ult = ultimas.get(a.nombre + "|" + a.apellido) ?? {};
    const total = totalDesdeRecords(
      LIFTS.map((l) => ({ lift: l, valorKg: ult[l]?.valorKg ?? 0 }))
    );
    const puedeScore =
      total > 0 && a.pesoCorporal != null && a.sexo != null;

    const fmt = (v: number | undefined) => (v != null ? `${v}` : "");
    const fmtLift = (l: Lift) => fmt(ult[l]?.valorKg);

    return {
      nombre: a.nombre,
      apellido: a.apellido,
      categoria: a.categoria ?? "",
      sexo: a.sexo === "femenino" ? "Femenino" : a.sexo === "masculino" ? "Masculino" : "",
      pesoCorporal: a.pesoCorporal != null ? `${a.pesoCorporal}` : "",
      altura: a.altura != null ? `${a.altura}` : "",
      estado: a.estado === "activo" ? "Activo" : "Inactivo",
      sentadilla: fmtLift("sentadilla"),
      banca: fmtLift("banca"),
      pesoMuerto: fmtLift("peso_muerto"),
      total: total > 0 ? `${total}` : "",
      wilks: puedeScore ? `${puntajeWilks(total, a.pesoCorporal!, a.sexo!)}` : "",
      ipf: puedeScore ? `${puntajeIpfGl(total, a.pesoCorporal!, a.sexo!)}` : "",
      notas: a.notas ?? "",
    };
  });

  const fecha = new Date().toISOString().slice(0, 10);
  const nombreArchivo = `${appName}-atletas-${fecha}.xlsx`;
  const buffer = buildAtletasExportXlsx(filas, historial);
  const body = new Uint8Array(buffer);

  return new Response(body, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"; filename*=UTF-8''${encodeURIComponent(
        nombreArchivo
      )}`,
      "Cache-Control": "no-store",
    },
  });
}
