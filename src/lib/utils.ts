import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Calcula el 1RM estimado con la fórmula de Epley: peso * (1 + reps/30) */
export function estimarRM(pesoKg: number, reps: number): number {
  if (reps <= 1) return pesoKg;
  return Math.round(pesoKg * (1 + reps / 30) * 10) / 10;
}

/** Calcula el peso sugerido a partir de un %RM */
export function pesoDesdePorcentaje(rmKg: number, porcentaje: number): number {
  return Math.round(((rmKg * porcentaje) / 100) * 2) / 2; // redondeo a 0.5kg
}

/** Puntos IPF GL simplificados (coeficientes 2020, hombres/mujeres genérico) */
export function calcularEdad(fechaNacimiento: Date | null): number | null {
  if (!fechaNacimiento) return null;
  const diff = Date.now() - fechaNacimiento.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}
