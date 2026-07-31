// Nombres de ejercicios normalizados: "SENTADILLA", "sentadilla " y
// "Sentadilla" son el mismo ejercicio. La comparación usa esta forma.
export function normalizarNombre(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

// Forma de visualización: "SENTADILLA CON PAUSA" → "Sentadilla Con Pausa".
export function capitalizarNombre(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}
