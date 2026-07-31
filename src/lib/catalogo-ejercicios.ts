// Catálogo de ejercicios básicos de powerlifting para que el entrenador
// agregue ejercicios de un toque en vez de tipear el nombre cada vez.
// Los nombres están en la misma forma normalizada que capitalizarNombre()
// ("Sentadilla", "Press Banca") para que coincidan con el historial y el
// "última vez" del atleta.

export type GrupoEjercicio = "principal" | "auxiliar";

export type EjercicioCatalogo = {
  nombre: string;
  descanso: string;
  grupo: GrupoEjercicio;
};

export const CATALOGO_EJERCICIOS: EjercicioCatalogo[] = [
  // Principales (los básicos del powerlifting y sus variantes)
  { nombre: "Sentadilla", descanso: "3 min", grupo: "principal" },
  { nombre: "Press Banca", descanso: "3 min", grupo: "principal" },
  { nombre: "Peso Muerto", descanso: "4 min", grupo: "principal" },
  { nombre: "Press Militar", descanso: "3 min", grupo: "principal" },
  { nombre: "Remo Con Barra", descanso: "2 min", grupo: "principal" },
  { nombre: "Peso Muerto Rumano", descanso: "3 min", grupo: "principal" },
  { nombre: "Dominadas", descanso: "2 min", grupo: "principal" },
  { nombre: "Fondos", descanso: "2 min", grupo: "principal" },
  { nombre: "Hip Thrust", descanso: "2 min", grupo: "principal" },
  { nombre: "Zancadas Con Barra", descanso: "2 min", grupo: "principal" },
  { nombre: "Sentadilla Frontal", descanso: "3 min", grupo: "principal" },
  { nombre: "Peso Muerto Sumo", descanso: "3 min", grupo: "principal" },

  // Auxiliares (accesorios para complementar el trabajo)
  { nombre: "Press Inclinado", descanso: "2 min", grupo: "auxiliar" },
  { nombre: "Press Banca Agarre Cerrado", descanso: "2 min", grupo: "auxiliar" },
  { nombre: "Aperturas Con Mancuernas", descanso: "90 seg", grupo: "auxiliar" },
  { nombre: "Elevaciones Laterales", descanso: "90 seg", grupo: "auxiliar" },
  { nombre: "Curl De Bíceps", descanso: "90 seg", grupo: "auxiliar" },
  { nombre: "Extensión De Tríceps", descanso: "90 seg", grupo: "auxiliar" },
  { nombre: "Face Pull", descanso: "90 seg", grupo: "auxiliar" },
  { nombre: "Prensa De Piernas", descanso: "2 min", grupo: "auxiliar" },
  { nombre: "Curl De Isquiotibiales", descanso: "90 seg", grupo: "auxiliar" },
  { nombre: "Elevaciones De Gemelos", descanso: "90 seg", grupo: "auxiliar" },
  { nombre: "Abdominales", descanso: "60 seg", grupo: "auxiliar" },
  { nombre: "Plancha", descanso: "60 seg", grupo: "auxiliar" },
];

export const GRUPOS_CATALOGO: { grupo: GrupoEjercicio; titulo: string }[] = [
  { grupo: "principal", titulo: "Principales" },
  { grupo: "auxiliar", titulo: "Auxiliares" },
];
