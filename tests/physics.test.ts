import { describe, expect, it } from "vitest";
import { clampAngle, launch, speedOf, stuckBall, cloneBall, accelerate } from "../src/game/Ball";
import { BALL_MAX_SPEED } from "../src/game/constants";

describe("мяч", () => {
  it("стартует прилипшим к ракетке и после запуска летит вверх", () => {
    const b = stuckBall(100, 46, 300);
    expect(b.stuck).toBe(true);
    launch(b, () => 0.5);
    expect(b.stuck).toBe(false);
    expect(b.vy).toBeLessThan(0);
  });

  it("не летает почти горизонтально после clampAngle", () => {
    const b = stuckBall(100, 46, 300);
    b.stuck = false;
    b.vx = 100;
    b.vy = 0.01;
    clampAngle(b);
    const angle = Math.atan2(Math.abs(b.vy), Math.abs(b.vx));
    expect(angle).toBeGreaterThan((20 * Math.PI) / 180);
  });

  it("ускорение не превышает потолок", () => {
    const b = stuckBall(100, 46, 300);
    b.vx = BALL_MAX_SPEED;
    b.vy = 0;
    accelerate(b, 0.5);
    expect(speedOf(b)).toBeLessThanOrEqual(BALL_MAX_SPEED + 0.001);
  });

  it("копия мяча сохраняет скорость и остаётся в пределах", () => {
    const b = stuckBall(100, 46, 300);
    b.stuck = false;
    b.vx = 40;
    b.vy = -60;
    const before = speedOf(b);
    const c = cloneBall(b, 35);
    expect(speedOf(c)).toBeCloseTo(before, 5);
    expect(c.vx).not.toBeCloseTo(b.vx, 2);
  });
});
