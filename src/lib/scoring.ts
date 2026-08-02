/**
 * lib/scoring.ts
 * Funciones puras, sin dependencias, para poder testearlas aisladas.
 * Wilks 2020 y Puntos IPF GL, métricas específicas de powerlifting.
 * que discutimos: con bodyweight + categoría + los 3 grandes levantamientos
 * que ya guardamos en `records`, esto sale prácticamente gratis.
 *
 * NOTA: las constantes de Puntos IPF GL son la aproximación pública de uso
 * común. Antes de usarlas en un contexto de competencia real, verificar
 * contra la publicación oficial de la IPF.
 */

export type Sexo = "masculino" | "femenino";

const WILKS_2020_MASCULINO = {
  a: 47.4617885,
  b: 8.472061,
  c: 0.07369669,
  d: -0.001395107,
  e: 0.00000707665,
  f: -0.0000000141864,
};

const WILKS_2020_FEMENINO = {
  a: -125.4255398,
  b: 13.7121941,
  c: -0.1119713,
  d: 0.0223547,
  e: -0.00016151,
  f: 0.00000042522,
};

export function coeficienteWilks(pesoCorporalKg: number, sexo: Sexo): number {
  const c = sexo === "masculino" ? WILKS_2020_MASCULINO : WILKS_2020_FEMENINO;
  const x = pesoCorporalKg;
  const denom =
    c.a + c.b * x + c.c * x ** 2 + c.d * x ** 3 + c.e * x ** 4 + c.f * x ** 5;
  return 500 / denom;
}

export function puntajeWilks(
  totalKg: number,
  pesoCorporalKg: number,
  sexo: Sexo
): number {
  return Math.round(totalKg * coeficienteWilks(pesoCorporalKg, sexo) * 100) / 100;
}

const IPF_GL_MASCULINO = { a: 1199.72839, b: 1025.18162, c: 0.00921 };
const IPF_GL_FEMENINO = { a: 610.32796, b: 1045.59282, c: 0.03048 };

export function puntajeIpfGl(
  totalKg: number,
  pesoCorporalKg: number,
  sexo: Sexo
): number {
  const c = sexo === "masculino" ? IPF_GL_MASCULINO : IPF_GL_FEMENINO;
  const denom = c.a - c.b * Math.exp(-1 * c.c * pesoCorporalKg);
  return Math.round(((totalKg * 100) / denom) * 100) / 100;
}

/** Suma sentadilla + banca + peso muerto a partir de los últimos récords del atleta. */
export function totalDesdeRecords(
  records: { lift: "sentadilla" | "banca" | "peso_muerto"; valorKg: number }[]
): number {
  const porLift = new Map(records.map((r) => [r.lift, r.valorKg]));
  return (
    (porLift.get("sentadilla") ?? 0) +
    (porLift.get("banca") ?? 0) +
    (porLift.get("peso_muerto") ?? 0)
  );
}
