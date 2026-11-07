import { describe, expect, it } from "vitest";
import { chapters, levelCells, totalLevels, validateLevels } from "../src/game/systems/levels";

describe("уровни", () => {
  it("все уровни валидны", () => {
    expect(validateLevels()).toEqual([]);
  });

  it("главы и уровни на месте", () => {
    expect(chapters().length).toBe(3);
    expect(totalLevels()).toBeGreaterThanOrEqual(18);
    expect(chapters().at(-1)!.levels.at(-1)!.boss?.hp).toBeGreaterThan(0);
  });

  it("кирпичи раскладываются в разумное количество", () => {
    const lv = chapters()[0].levels[0];
    expect(levelCells(lv).length).toBeGreaterThan(0);
  });
});
