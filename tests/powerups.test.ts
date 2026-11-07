import { describe, expect, it } from "vitest";
import { rollDropKind, POWERUP_ORDER } from "../src/game/systems/Powerups";

describe("бонусы", () => {
  it("всегда возвращает допустимый тип", () => {
    for (let i = 0; i < 500; i++) {
      expect(POWERUP_ORDER).toContain(rollDropKind(false, 0));
    }
  });
});
