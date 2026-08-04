import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { HEADERS_EXPORT, buildAtletasExportXlsx } from "../src/lib/excel";

test("seed console output cannot interpolate demo credentials", async () => {
  const source = await readFile(
    join(process.cwd(), "src/db/seed.ts"),
    "utf8"
  );
  const outputCode = source
    .split("\n")
    .filter((line) => /console\.(log|warn|error)/.test(line))
    .join("\n");
  assert.doesNotMatch(
    outputCode,
    /passwordAdmin|demoToken|accessPin|ATHLETE_DEMO_ACCESS_TOKEN.*\$\{|issued\.token/
  );
});

test("athlete exports contain no PIN, token or token hash columns", () => {
  assert.equal(
    HEADERS_EXPORT.some((header) => /pin|token|credencial/i.test(header)),
    false
  );
  const workbook = buildAtletasExportXlsx(
    [
      {
        nombre: "Ana",
        apellido: "A",
        categoria: "",
        sexo: "Femenino",
        pesoCorporal: "60",
        altura: "165",
        estado: "Activo",
        sentadilla: "100",
        banca: "60",
        pesoMuerto: "120",
        total: "280",
        wilks: "",
        ipf: "",
        notas: "",
      },
    ],
    []
  );
  const serialized = workbook.toString("latin1").toLowerCase();
  assert.equal(serialized.includes("pin atleta"), false);
  assert.equal(serialized.includes("token_hash"), false);
});
