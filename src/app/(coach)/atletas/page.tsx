import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { athletes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Plus, FileDown } from "lucide-react";
import { ExcelImportDialog } from "@/components/excel-import-dialog";

export default async function AtletasPage() {
  const session = await auth();
  const coachId = (session!.user as { id: string }).id;

  const misAtletas = await db.query.athletes.findMany({
    where: eq(athletes.coachId, coachId),
    orderBy: (a, { asc }) => [asc(a.nombre)],
  });

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-chalk">
            Atletas
          </h1>
          <p className="mt-1 text-sm text-chalk-muted">
            {misAtletas.length} atleta{misAtletas.length !== 1 && "s"} en total
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExcelImportDialog />
          <a href="/api/export/atletas">
            <Button variant="secondary">
              <FileDown size={15} /> Exportar Excel
            </Button>
          </a>
          <Link href="/atletas/nuevo">
            <Button>
              <Plus size={16} /> Nuevo atleta
            </Button>
          </Link>
        </div>
      </div>

      {misAtletas.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border-strong p-12 text-center">
          <p className="text-sm text-chalk-muted">
            Todavía no cargaste ningún atleta. Empezá agregando el primero.
          </p>
          <Link href="/atletas/nuevo">
            <Button className="mt-4">
              <Plus size={16} /> Agregar atleta
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {misAtletas.map((a) => (
            <Link
              key={a.id}
              href={`/atletas/${a.id}`}
              className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-hover"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-chalk">
                    {a.nombre} {a.apellido}
                  </p>
                  <p className="mt-0.5 text-xs text-chalk-muted">
                    {a.categoria ?? "Sin categoría"} ·{" "}
                    {a.pesoCorporal ? `${a.pesoCorporal}kg` : "Sin peso registrado"}
                  </p>
                </div>
                <span
                  className={
                    a.estado === "activo"
                      ? "rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success"
                      : "rounded-full bg-chalk-faint/10 px-2 py-0.5 text-[10px] font-medium text-chalk-faint"
                  }
                >
                  {a.estado === "activo" ? "Activo" : "Inactivo"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
