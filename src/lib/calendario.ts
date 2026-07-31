import { format } from "date-fns";
import { es } from "date-fns/locale";

const DIAS_SEMANA = 7 * 24 * 60 * 60 * 1000;

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

// Posición de la semana dentro del mes calendario (1-5):
// la del lunes 16/3 es la semana 3 del mes, la del lunes 2/2 es la 1.
export function semanaDelMes(fecha: Date): number {
  return Math.ceil(fecha.getDate() / 7);
}

// Mes corto en español, sin punto ("mar", "abr").
export function mesCorto(fecha: Date): string {
  return format(fecha, "MMM", { locale: es }).replace(".", "");
}

export function mesLargo(fecha: Date): string {
  return format(fecha, "MMMM", { locale: es });
}

export function diaDelMes(fecha: Date): number {
  return fecha.getDate();
}

export function anio(fecha: Date): number {
  return fecha.getFullYear();
}

export function esSemanaActual(fecha: Date): boolean {
  return inicioDeSemana(fecha).getTime() === inicioDeSemana(new Date()).getTime();
}

// "Sem 2 · 16 mar" para el chip del día.
export function etiquetaChipSemana(fecha: Date): string {
  return `Sem ${semanaDelMes(fecha)} · ${diaDelMes(fecha)} ${mesCorto(fecha)}`;
}

// "Semana 2 de marzo · 16 mar" para el encabezado del entrenamiento.
export function encabezadoSemana(fecha: Date): string {
  return `Semana ${semanaDelMes(fecha)} de ${mesLargo(fecha)} · ${diaDelMes(
    fecha
  )} ${mesCorto(fecha)}`;
}
