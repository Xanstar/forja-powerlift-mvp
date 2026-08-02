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
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-[-0.04em] text-chalk">
            Atletas
          </h1>
          <p className="mt-1 text-sm text-chalk-muted">
            {misAtletas.length} atleta{misAtletas.length !== 1 && "s"} en total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <details className="relative">
            <summary className="flex min-h-11 cursor-pointer list-none items-center border border-border-strong bg-surface px-4 text-sm font-semibold text-chalk">
              Más acciones
            </summary>
            <div className="fixed left-4 right-4 z-10 mt-1 w-auto border border-chalk bg-surface p-3 sm:absolute sm:left-auto sm:right-0 sm:w-60">
              <ExcelImportDialog />
              <a href="/api/export/atletas" className="mt-2 block">
                <Button variant="secondary" className="w-full justify-start">
                  <FileDown size={15} /> Exportar Excel
                </Button>
              </a>
            </div>
          </details>
          <Link href="/atletas/nuevo">
            <Button>
              <Plus size={16} /> Nuevo atleta
            </Button>
          </Link>
        </div>
      </div>

      {misAtletas.length === 0 ? (
        <div className="mt-8 border border-dashed border-border-strong bg-surface p-12 text-center">
          <p className="text-sm text-chalk-muted">
            No hay atletas cargados.
          </p>
          <Link href="/atletas/nuevo">
            <Button className="mt-4">
              <Plus size={16} /> Agregar atleta
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 divide-y divide-border-strong border-y border-chalk bg-surface">
          {misAtletas.map((a) => (
            <Link
              key={a.id}
              href={`/atletas/${a.id}`}
              className="block px-4 py-5 transition-colors hover:bg-surface-hover sm:px-5"
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
                      ? "competition-stamp border-success text-success"
                      : "competition-stamp border-chalk-faint text-chalk-faint"
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
