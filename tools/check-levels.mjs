// Проверка уровней без TypeScript: запуск node tools/check-levels.mjs
import { readFileSync } from "node:fs";
const data = JSON.parse(readFileSync(new URL("../src/data/levels.json", import.meta.url), "utf8"));
const errors = [];
let count = 0;
for (const ch of data.chapters) {
  for (const lv of ch.levels) {
    count++;
    const legend = { "1": 1, "2": 1, "3": 1, "4": 1, "5": 1, X: 1, G: 1, ...(lv.legend ?? {}) };
    if (lv.rows.length > 20) errors.push(`${lv.id}: строк ${lv.rows.length} > 20`);
    lv.rows.forEach((row, r) => {
      if ([...row].length > 12) errors.push(`${lv.id}: строка ${r} длиннее 12`);
      for (const s of row) if (!". X".includes(s) && !legend[s]) errors.push(`${lv.id}: неизвестный символ "${s}"`);
    });
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`OK: ${count} уровней`);
