import raw from "../../data/levels.json";
import { BRICK_TYPES, type BrickType } from "../../render/palette";

export type BossSpec = { hp: number; pattern?: string };

export type Level = {
  id: string;
  title: string;
  rows: string[];
  legend?: Record<string, BrickType>;
  dropChance?: number;
  boss?: BossSpec;
  intro?: string;
};

export type Chapter = {
  id: string;
  title: string;
  subtitle?: string;
  palette: "ep1" | "ep2" | "ep3";
  levels: Level[];
};

type LevelsFile = { meta: { version: number }; chapters: Chapter[] };
const data = raw as unknown as LevelsFile;

const DEFAULT_LEGEND: Record<string, BrickType> = {
  "1": "archive",
  "2": "stone",
  "3": "blood",
  "4": "lamp",
  "5": "gold",
};

export type Cell = { col: number; row: number; type: BrickType; solid: boolean };

export function levelCells(level: Level): Cell[] {
  const legend = { ...DEFAULT_LEGEND, ...(level.legend ?? {}) };
  const cells: Cell[] = [];
  level.rows.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch === "." || ch === " ") return;
      if (ch === "X") {
        cells.push({ col: c, row: r, type: "stone", solid: true });
        return;
      }
      const type = legend[ch];
      if (type && BRICK_TYPES.includes(type)) cells.push({ col: c, row: r, type, solid: false });
    });
  });
  return cells;
}

export function validateLevels(): string[] {
  const errors: string[] = [];
  data.chapters.forEach((ch, ci) => {
    ch.levels.forEach((lv, li) => {
      const where = `chapters[${ci}].levels[${li}] (${lv.id})`;
      if (lv.rows.length > 20) errors.push(`${where}: строк ${lv.rows.length} > 20`);
      lv.rows.forEach((row, r) => {
        if ([...row].length > 12) errors.push(`${where}: строка ${r} длиннее 12`);
        for (const sym of row) {
          if (". X".includes(sym)) continue;
          if (!({ ...DEFAULT_LEGEND, ...(lv.legend ?? {}) })[sym]) errors.push(`${where}: неизвестный символ "${sym}"`);
        }
      });
      if (!levelCells(lv).some((c) => !c.solid) && !lv.boss) errors.push(`${where}: нет разрушаемых кирпичей`);
    });
  });
  return errors;
}

export function chapters(): Chapter[] {
  return data.chapters;
}

export function levelAt(chapterIndex: number, levelIndex: number): { chapter: Chapter; level: Level } {
  const ch = data.chapters[Math.min(chapterIndex, data.chapters.length - 1)];
  const lv = ch.levels[Math.min(levelIndex, ch.levels.length - 1)];
  return { chapter: ch, level: lv };
}

export function totalLevels(): number {
  return data.chapters.reduce((s, c) => s + c.levels.length, 0);
}
