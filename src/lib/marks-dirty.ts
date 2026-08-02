import type { FilaMarca } from "@/lib/actions/marcas";

export type MarksRow = Omit<FilaMarca, "athleteId">;
export type DirtyMarks = Record<
  string,
  Partial<Record<keyof MarksRow, true>>
>;

export function buildDirtyMarksRows(
  athleteIds: string[],
  rows: Record<string, MarksRow>,
  dirty: DirtyMarks
): FilaMarca[] {
  return athleteIds.flatMap((athleteId) => {
    const row = rows[athleteId];
    const changed = dirty[athleteId];
    if (!row || !changed || !Object.keys(changed).length) return [];
    return [
      {
        athleteId,
        peso: changed.peso ? row.peso : "",
        sentadilla: changed.sentadilla ? row.sentadilla : "",
        banca: changed.banca ? row.banca : "",
        peso_muerto: changed.peso_muerto ? row.peso_muerto : "",
        tipo: row.tipo,
      },
    ];
  });
}
