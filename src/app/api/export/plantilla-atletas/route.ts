import { auth } from "@/lib/auth";
import { buildPlantillaXlsx } from "@/lib/excel";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const nombreArchivo = "plantilla-atletas.xlsx";
  const buffer = buildPlantillaXlsx();
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
