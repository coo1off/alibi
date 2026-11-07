import { BALL_BASE_SPEED, BALL_MAX_SPEED, BALL_R } from "./constants";
import type { Ball } from "./entities";

/** Создать мяч, прилипший к ракетке (запуск по тапу/пробелу). */
export function stuckBall(paddleX: number, paddleW: number, y: number): Ball {
  return {
    x: paddleX + paddleW / 2,
    y: y - BALL_R - 2,
    vx: 0,
    vy: 0,
    r: BALL_R,
    stuck: true,
    trail: [],
    alive: true,
  };
}

/** Запуск мяча со случайным углом из диапазона (55°…125° от горизонтали). */
export function launch(ball: Ball, rand: () => number = Math.random): void {
  if (!ball.stuck) return;
  const angle = ((55 + rand() * 70) * Math.PI) / 180;
  const dir = rand() < 0.5 ? -1 : 1;
  ball.vx = Math.cos(angle) * BALL_BASE_SPEED * dir;
  ball.vy = -Math.sin(angle) * BALL_BASE_SPEED;
  ball.stuck = false;
}

export function speedOf(ball: Ball): number {
  return Math.hypot(ball.vx, ball.vy);
}

/** Ускорить мяч на долю, но не выше потолка. */
export function accelerate(ball: Ball, fraction: number): void {
  const s = speedOf(ball);
  const target = Math.min(s * (1 + fraction), BALL_MAX_SPEED);
  if (s > 0.001) {
    const k = target / s;
    ball.vx *= k;
    ball.vy *= k;
  }
}

/** Дублировать мяч в двух направлениях (веером), сохраняя скорость. */
export function cloneBall(ball: Ball, angleDeg: number): Ball {
  const a = (angleDeg * Math.PI) / 180;
  const s = speedOf(ball);
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const vx = ball.vx * cos - ball.vy * sin;
  const vy = ball.vx * sin + ball.vy * cos;
  const len = Math.hypot(vx, vy) || 1;
  return {
    x: ball.x,
    y: ball.y,
    vx: (vx / len) * s,
    vy: (vy / len) * s,
    r: ball.r,
    stuck: false,
    trail: [],
    alive: true,
  };
}

/**
 * Нормализовать угол: мяч не должен летать почти горизонтально (застревание)
 * и должен всегда отскакивать вниз после ударa по ракетке.
 */
export function clampAngle(ball: Ball, minVertDeg = 22): void {
  const s = speedOf(ball);
  if (s < 0.001) return;
  const maxTan = Math.tan(((90 - minVertDeg) * Math.PI) / 180);
  if (Math.abs(ball.vx) > Math.abs(ball.vy) * maxTan) {
    const sign = Math.sign(ball.vx) || 1;
    ball.vx = sign * Math.abs(ball.vy) * maxTan;
    const ns = speedOf(ball);
    ball.vx *= s / ns;
    ball.vy *= s / ns;
  }
}
