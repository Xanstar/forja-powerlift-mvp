import * as XLSX from "xlsx";
import { LIFTS, type Lift } from "@/lib/queries";

// ---------------------------------------------------------------------------
// Excel: importación de atletas (para migrar la planilla del gimnasio),
// plantilla descargable y exportación a Excel.
// ---------------------------------------------------------------------------

export type FilaAtletaExcel = {
  filaNum: number; // fila real en la hoja (para reportar errores)
  nombre: string;
  apellido: string;
  categoria?: string;
  sexo?: "masculino" | "femenino";
  pesoCorporal?: number;
  altura?: number;
  notas?: string;
  marcas: Partial<Record<Lift, number>>;
};

type Campo = "nombre" | "apellido" | "categoria" | "sexo" | "peso" | "altura" | "notas" | Lift;

const ALIASES: Record<Campo, string[]> = {
  nombre: [
    "nombre",
    "nombres",
    "nombre y apellido",
    "nombre completo",
    "nombre del atleta",
    "atleta",
    "nombre y apellido del atleta",
  ],
  apellido: ["apellido", "apellidos"],
  categoria: [
    "categoria",
    "categoria de peso",
    "categoria peso",
    "division",
    "div",
    "categoria ipf",
  ],
  sexo: ["sexo", "genero", "sexo del atleta"],
  peso: [
    "peso",
    "peso corporal",
    "peso corporal kg",
    "peso corporal (kg)",
    "peso kg",
    "peso actual",
    "peso actual kg",
    "peso corporal actual",
    "pc",
  ],
  altura: ["altura", "altura cm", "altura (cm)", "estatura", "estatura cm"],
  notas: ["notas", "nota", "observaciones", "comentarios", "comentario"],
  sentadilla: [
    "sentadilla",
    "sentadilla kg",
    "sentadilla rm",
    "sentadilla rm kg",
    "squat",
    "squat kg",
    "sq",
    "sq kg",
  ],
  banca: [
    "banca",
    "press banca",
    "press de banca",
    "banca kg",
    "press banca kg",
    "banca rm",
    "banca rm kg",
    "bench",
    "bench press",
    "bench kg",
  ],
  peso_muerto: [
    "peso muerto",
    "peso muerto kg",
    "peso muerto rm",
    "peso muerto rm kg",
    "deadlift",
    "deadlift kg",
    "dl",
    "dl kg",
  ],
};

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const aliasMap = new Map<string, Campo>();
for (const [campo, lista] of Object.entries(ALIASES)) {
  for (const alias of lista) aliasMap.set(normalizar(alias), campo as Campo);
}

function mapearColumnas(headers: string[]): (Campo | null)[] {
  return headers.map((h) => {
    const n = normalizar(h ?? "");
    return n ? (aliasMap.get(n) ?? null) : null;
  });
}

function parseNumero(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) && v > 0 ? v : null;
  if (v == null) return null;
  const s = String(v).replace(",", ".").replace(/[^\d.]/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseSexo(v: unknown): "masculino" | "femenino" | undefined {
  if (v == null) return undefined;
  const n = normalizar(String(v));
  if (["m", "masculino", "male", "hombre", "varon", "v"].includes(n)) return "masculino";
  if (["f", "femenino", "female", "mujer", "dama"].includes(n)) return "femenino";
  return undefined;
}

/** Lee la primera hoja del archivo y devuelve las filas de atletas. */
export function parseAtletasExcel(buf: Buffer): {
  filas: FilaAtletaExcel[];
  columnasReconocidas: number;
} {
  const wb = XLSX.read(buf, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: null,
    raw: true,
  });

  const headers = (raw[0] ?? []).map((c) => String(c ?? "").trim());
  const mapeo = mapearColumnas(headers);
  const columnasReconocidas = mapeo.filter(Boolean).length;

  const filas: FilaAtletaExcel[] = [];
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.every((c) => c == null || String(c).trim() === "")) continue;

    const celda = (campo: Campo): unknown => {
      const idx = mapeo.indexOf(campo);
      return idx >= 0 ? row[idx] : undefined;
    };

    let nombre = String(celda("nombre") ?? "").trim();
    let apellido = String(celda("apellido") ?? "").trim();

    if (!nombre && apellido) {
      nombre = apellido;
      apellido = "";
    }
    if (!apellido && nombre) {
      const partes = nombre.split(/\s+/);
      if (partes.length > 1) {
        apellido = partes.pop()!;
        nombre = partes.join(" ");
      }
    }
    if (!nombre) continue;

    const marcas: Partial<Record<Lift, number>> = {};
    for (const lift of LIFTS) {
      const kg = parseNumero(celda(lift));
      if (kg != null) marcas[lift] = kg;
    }

    filas.push({
      filaNum: i + 1,
      nombre,
      apellido,
      categoria: String(celda("categoria") ?? "").trim() || undefined,
      sexo: parseSexo(celda("sexo")),
      pesoCorporal: parseNumero(celda("peso")) ?? undefined,
      altura: parseNumero(celda("altura")) ?? undefined,
      notas: String(celda("notas") ?? "").trim() || undefined,
      marcas,
    });
  }

  return { filas, columnasReconocidas };
}

export const HEADERS_EXPORT = [
  "Nombre",
  "Apellido",
  "Categoría",
  "Sexo",
  "Peso corporal (kg)",
  "Altura (cm)",
  "Estado",
  "Sentadilla (kg)",
  "Banca (kg)",
  "Peso muerto (kg)",
  "Total (kg)",
  "Wilks",
  "IPF GL",
  "Notas",
];

export type FilaExportAtleta = {
  nombre: string;
  apellido: string;
  categoria: string;
  sexo: string;
  pesoCorporal: string;
  altura: string;
  estado: string;
  sentadilla: string;
  banca: string;
  pesoMuerto: string;
  total: string;
  wilks: string;
  ipf: string;
  notas: string;
};

export function buildPlantillaXlsx(): Buffer {
  const ejemplo: (string | number)[] = [
    "Martina",
    "Gomez",
    "-63kg",
    "Femenino",
    62.4,
    165,
    "Activo",
    110,
    62.5,
    135,
    "",
    "",
    "",
    "Fila de ejemplo: borrala o completala.",
  ];

  const ws = XLSX.utils.aoa_to_sheet([HEADERS_EXPORT, ejemplo]);
  ws["!cols"] = HEADERS_EXPORT.map((h) => ({ wch: Math.max(h.length + 2, 14) }));

  const instrucciones = XLSX.utils.aoa_to_sheet([
    ["Cómo usar esta plantilla"],
    [],
    ["Completá una fila por atleta."],
    ["Obligatorias: Nombre y Apellido."],
    ["Opcionales: Categoría, Sexo, Peso corporal (kg), Altura (cm), Estado, Notas."],
    ["Marcas (opcionales, en kg): Sentadilla, Banca, Peso muerto."],
    ["Si solo cargás el nombre completo en 'Nombre', el apellido se separa automáticamente."],
    ["Los atletas ya existentes (mismo nombre y apellido) se omiten."],
    ["Sexo: Masculino / Femenino (o M / F)."],
  ]);
  instrucciones["!cols"] = [{ wch: 95 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Atletas");
  XLSX.utils.book_append_sheet(wb, instrucciones, "Instrucciones");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

export function buildAtletasExportXlsx(
  atletas: FilaExportAtleta[],
  historial: {
    atleta: string;
    lift: string;
    valorKg: number;
    tipo: string;
    fecha: string;
  }[]
): Buffer {
  const ws = XLSX.utils.aoa_to_sheet([
    HEADERS_EXPORT,
    ...atletas.map((a) => [
      a.nombre,
      a.apellido,
      a.categoria,
      a.sexo,
      a.pesoCorporal,
      a.altura,
      a.estado,
      a.sentadilla,
      a.banca,
      a.pesoMuerto,
      a.total,
      a.wilks,
      a.ipf,
      a.notas,
    ]),
  ]);
  ws["!cols"] = HEADERS_EXPORT.map((h) => ({ wch: Math.max(h.length + 2, 14) }));

  const wsHistorial = XLSX.utils.aoa_to_sheet([
    ["Atleta", "Levantamiento", "Kg", "Tipo", "Fecha"],
    ...historial.map((h) => [h.atleta, h.lift, h.valorKg, h.tipo, h.fecha]),
  ]);
  wsHistorial["!cols"] = [{ wch: 24 }, { wch: 18 }, { wch: 8 }, { wch: 12 }, { wch: 12 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Atletas");
  XLSX.utils.book_append_sheet(wb, wsHistorial, "Historial de marcas");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
