import { auth } from "@/lib/auth";
import { db } from "@/db";
import { athletes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { marcasDeCoach, type Lift } from "@/lib/queries";
import { MarcasForm } from "@/components/marcas-form";

export default async function MarcasPage() {
  const session = await auth();
  const coachId = (session!.user as { id: string }).id;

  const activos = await db.query.athletes.findMany({
    where: and(eq(athletes.coachId, coachId), eq(athletes.estado, "activo")),
    orderBy: (a, { asc }) => [asc(a.nombre)],
  });

  const marcas = await marcasDeCoach(coachId);

  const atletas = activos.map((a) => {
    const m = marcas.get(a.id) ?? {};
    const lifts: Partial<Record<Lift, { valorKg: number; tipo: string }>> = {};
    for (const [lift, marca] of Object.entries(m) as [
      Lift,
      { valorKg: number; tipo: "real" | "estimado"; fecha: Date }
    ][]) {
      lifts[lift] = { valorKg: marca.valorKg, tipo: marca.tipo };
    }
    return {
      id: a.id,
      nombre: a.nombre,
      apellido: a.apellido,
      categoria: a.categoria,
      sexo: a.sexo,
      pesoCorporal: a.pesoCorporal,
      lifts,
    };
  });

  return (
    <div className="max-w-6xl">
      <h1 className="font-display text-4xl font-bold tracking-[-0.04em] text-chalk">
        Toma de marcas
      </h1>
      <p className="mt-1 text-sm text-chalk-muted">Cargas vigentes para prescribir y comparar.</p>

      <div className="mt-6">
        <MarcasForm atletas={atletas} />
      </div>
    </div>
  );
}
