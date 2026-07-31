"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileUp, FileDown, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type Resultado = {
  creados: number;
  duplicados: number;
  errores: number;
  detalle: {
    creados: string[];
    duplicados: string[];
    errores: string[];
  };
};

export function ExcelImportDialog() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function importar() {
    if (!archivo) return;
    setCargando(true);
    setError(null);
    setResultado(null);

    const formData = new FormData();
    formData.append("file", archivo);

    try {
      const res = await fetch("/api/import/atletas", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo importar el archivo.");
      } else {
        setResultado(json);
        setArchivo(null);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      }
    } catch {
      setError("Error de conexión al importar.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen((v) => !v)}>
        <FileUp size={15} /> Importar Excel
      </Button>

      {open && (
        <div className="mt-4 rounded-xl border border-border bg-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-sm font-semibold text-chalk">
                Importar atletas desde Excel
              </h3>
              <p className="mt-0.5 text-xs text-chalk-muted">
                Subí la planilla del gimnasio (.xlsx o .xls). Se crean los
                atletas que no existan y, si trae sentadilla / banca / peso
                muerto, se cargan como marcas reales.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-chalk-faint hover:bg-surface-hover hover:text-chalk"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                setResultado(null);
                setError(null);
                setArchivo(e.target.files?.[0] ?? null);
              }}
              className="max-w-full text-sm text-chalk-muted file:mr-3 file:rounded-lg file:border file:border-border-strong file:bg-background file:px-3 file:py-1.5 file:text-sm file:text-chalk hover:file:bg-surface-hover"
            />
            <Button onClick={importar} disabled={!archivo || cargando}>
              {cargando ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Importando...
                </>
              ) : (
                "Importar"
              )}
            </Button>
            <a
              href="/api/export/plantilla-atletas"
              download
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-chalk-muted hover:text-chalk"
            >
              <FileDown size={14} /> Descargar plantilla
            </a>
          </div>

          {error && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-accent/10 px-3 py-2.5 text-sm text-accent">
              <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
            </p>
          )}

          {resultado && (
            <div className="mt-3 space-y-2 rounded-lg bg-background p-3 text-sm">
              <p className="flex items-center gap-2 font-medium text-success">
                <CheckCircle2 size={15} /> Importación completada
              </p>
              <ul className="space-y-1 text-chalk-muted">
                <li>
                  <span className="font-semibold text-chalk">
                    {resultado.creados}
                  </span>{" "}
                  atleta{resultado.creados !== 1 && "s"} creado
                  {resultado.creados !== 1 && "s"}
                </li>
                <li>
                  <span className="font-semibold text-chalk">
                    {resultado.duplicados}
                  </span>{" "}
                  omitido{resultado.duplicados !== 1 && "s"} (ya existían)
                </li>
                <li>
                  <span className="font-semibold text-chalk">
                    {resultado.errores}
                  </span>{" "}
                  fila{resultado.errores !== 1 && "s"} con error
                </li>
              </ul>
              {(resultado.detalle.duplicados.length > 0 ||
                resultado.detalle.errores.length > 0) && (
                <details className="text-xs text-chalk-faint">
                  <summary className="cursor-pointer">
                    Ver detalle
                  </summary>
                  {resultado.detalle.duplicados.length > 0 && (
                    <p className="mt-2">
                      Omitidos: {resultado.detalle.duplicados.join(", ")}
                    </p>
                  )}
                  {resultado.detalle.errores.length > 0 && (
                    <p className="mt-1">
                      Errores: {resultado.detalle.errores.join(" ")}
                    </p>
                  )}
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
