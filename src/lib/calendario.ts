import { format } from "date-fns";
import { es } from "date-fns/locale";

const DIAS_SEMANA = 7 * 24 * 60 * 60 * 1000;
const UN_DIA = 24 * 60 * 60 * 1000;

// Lunes de la semana que contiene a `fecha` (0:00h).
export function inicioDeSemana(fecha: Date): Date {
  const d = new Date(fecha);
  const dia = d.getDay(); // 0 = domingo
  const diff = dia === 0 ? 6 : dia - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Fecha del lunes de la semana `numeroSemana` (1-based) del programa.
// Si el programa no tiene fecha de inicio, la semana 1 arranca esta semana
// (comportamiento de respaldo para datos cargados antes del campo).
export function fechaInicioSemana(
  fechaInicioPrograma: Date | null,
  numeroSemana: number
): Date {
  const base =
    fechaInicioPrograma ?? inicioDeSemana(new Date());
  return new Date(base.getTime() + (numeroSemana - 1) * DIAS_SEMANA);
}

// Mes corto en español, sin punto ("mar", "abr").
export function mesCorto(fecha: Date): string {
  return format(fecha, "MMM", { locale: es }).replace(".", "");
}

export function diaDelMes(fecha: Date): number {
  return fecha.getDate();
}

// Rango de la semana del programa: "27 jul – 2 ago" (lunes a domingo).
export function rangoSemana(fechaInicio: Date): string {
  const fin = new Date(fechaInicio.getTime() + 6 * UN_DIA);
  return `${diaDelMes(fechaInicio)} ${mesCorto(fechaInicio)} – ${diaDelMes(
    fin
  )} ${mesCorto(fin)}`;
}

// "Semana 2 · 3 ago – 9 ago" para encabezados y navegación del plan.
export function etiquetaSemana(numero: number, fechaInicio: Date): string {
  return `Semana ${numero} · ${rangoSemana(fechaInicio)}`;
}
