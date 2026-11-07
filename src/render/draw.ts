import { BALL_R, PADDLE_H, PADDLE_Y } from "../game/constants";
import type { ActiveEffect, Ball, Brick, Drop } from "../game/entities";
import { type Palette, type Rgb, BRICK_HP, BRICK_LABEL, css, mix } from "./palette";
import { drawFolder, drawGrin } from "./sprites";

const rgbCss = (c: Rgb, a = 1) => css(c, a);

export function drawBrick(ctx: CanvasRenderingContext2D, pal: Palette, b: Brick): void {
  const { hi, base, lo } = pal.brick[b.type];
  const flash = b.hitFlash > 0;
  const body = flash ? mix(base, pal.paper, 0.55) : base;
  ctx.fillStyle = rgbCss(body);
  ctx.fillRect(b.x, b.y, b.w, b.h);
  // пиксельная рамка
  ctx.fillStyle = rgbCss(flash ? pal.paper : hi);
  ctx.fillRect(b.x, b.y, b.w, 1);
  ctx.fillRect(b.x, b.y, 1, b.h);
  ctx.fillStyle = rgbCss(lo);
  ctx.fillRect(b.x, b.y + b.h - 1, b.w, 1);
  ctx.fillRect(b.x + b.w - 1, b.y, 1, b.h);
  // заклёпки + склон
  ctx.fillStyle = rgbCss(hi);
  ctx.fillRect(b.x + 2, b.y + 2, 1, 1);
  ctx.fillRect(b.x + b.w - 3, b.y + 2, 1, 1);
  // трещины по мере урона
  const damage = BRICK_HP[b.type] - b.hp;
  if (damage > 0) {
    ctx.fillStyle = rgbCss(lo);
    ctx.fillRect(b.x + Math.round(b.w / 2), b.y + 3, 1, b.h - 5);
    ctx.fillRect(b.x + Math.round(b.w / 2) - 2, b.y + 5, 2, 1);
    if (damage > 1) {
      ctx.fillRect(b.x + Math.round(b.w / 2) + 3, b.y + 4, 1, 2);
      ctx.fillRect(b.x + 5, b.y + 4, 2, 1);
    }
  }
  if (b.solid) {
    // «железо»: косые штрихи
    ctx.fillStyle = rgbCss(mix(lo, pal.paper, 0.25), 0.7);
    for (let i = 3; i < b.w - 3; i += 4) ctx.fillRect(b.x + i, b.y + 3, 1, 4);
  }
  if (flash) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = css(pal.paper);
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.globalAlpha = 1;
  }
}

export function drawPaddle(ctx: CanvasRenderingContext2D, pal: Palette, x: number, w: number): void {
  const y = PADDLE_Y;
  ctx.fillStyle = rgbCss(pal.paddle);
  ctx.fillRect(x, y, w, PADDLE_H);
  ctx.fillStyle = rgbCss(pal.paddleHi);
  ctx.fillRect(x, y, w, 1);
  ctx.fillStyle = rgbCss(pal.paddleLo);
  ctx.fillRect(x, y + PADDLE_H - 1, w, 1);
  ctx.fillStyle = rgbCss(pal.ink);
  ctx.fillRect(x, y + PADDLE_H, w, 1);
  // золотые «кнопки»
  const b1 = x + 7;
  const b2 = x + w - 11;
  ctx.fillStyle = rgbCss(pal.gold);
  ctx.fillRect(b1, y + 1, 3, 2);
  ctx.fillRect(b2, y + 1, 3, 2);
  ctx.fillStyle = rgbCss(pal.goldHi);
  ctx.fillRect(b1, y + 1, 1, 1);
  ctx.fillRect(b2, y + 1, 1, 1);
  // ручка в центре
  ctx.fillStyle = rgbCss(pal.paddleLo);
  const cw = Math.max(2, Math.min(10, Math.round(w / 4)));
  ctx.fillRect(x + w / 2 - cw / 2, y + 1, cw, 1);
}

export function drawBall(ctx: CanvasRenderingContext2D, pal: Palette, b: Ball, ghost = false): void {
  const r = Math.round(b.r);
  if (!ghost) {
    ctx.fillStyle = rgbCss(pal.ballLo, 0.5);
    for (let i = 0; i < b.trail.length; i++) {
      const t = b.trail[i];
      ctx.fillRect(Math.round(t.x) - 1, Math.round(t.y) - 1, 2, 2);
    }
  }
  ctx.fillStyle = rgbCss(pal.ball, ghost ? 0.45 : 1);
  ctx.fillRect(Math.round(b.x) - r, Math.round(b.y) - r, r * 2 + 1, r * 2 + 1);
  ctx.fillRect(Math.round(b.x) - r + 1, Math.round(b.y) - r - 1, r * 2 - 1, 1);
  ctx.fillRect(Math.round(b.x) - r + 1, Math.round(b.y) + r + 1, r * 2 - 1, 1);
  if (!ghost) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2);
  }
}

export function drawDrop(ctx: CanvasRenderingContext2D, pal: Palette, d: Drop): void {
  const kind = d.kind === "curse" ? "evil" : d.kind === "life" ? "gold" : "folder";
  drawFolder(ctx, pal, Math.round(d.x), Math.round(d.y), kind);
  // пульс для «злого»
  if (d.kind === "curse") {
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = css(pal.red);
    ctx.fillRect(Math.round(d.x) - 1, Math.round(d.y) - 1, 15, 10);
    ctx.globalAlpha = 1;
  }
}

export function drawBoss(ctx: CanvasRenderingContext2D, pal: Palette, x: number, y: number, size: number, hurtT: number): void {
  if (hurtT > 0) {
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = css(pal.paper);
    ctx.fillRect(x - 2, y - 2, size + 4, size + 4);
    ctx.globalAlpha = 1;
  }
  drawGrin(ctx, x, y, pal, size / 32);
}

/** Иконка бонуса в строке активных эффектов (простая пиксельная). */
export function drawEffectIcon(ctx: CanvasRenderingContext2D, pal: Palette, eff: ActiveEffect, x: number, y: number): void {
  const col =
    eff.kind === "widen"
      ? pal.brick.stone.base
      : eff.kind === "guard"
        ? pal.brick.lamp.base
        : eff.kind === "slow"
          ? pal.gold
          : pal.redLo;
  ctx.fillStyle = rgbCss(col);
  ctx.fillRect(x, y, 7, 7);
  ctx.fillStyle = rgbCss(pal.ink);
  if (eff.kind === "widen") ctx.fillRect(x + 2, y + 2, 3, 3);
  if (eff.kind === "guard") ctx.fillRect(x + 1, y + 4, 5, 1);
  if (eff.kind === "slow") ctx.fillRect(x + 6, y + 1, 1, 1);
  if (eff.kind === "curse") ctx.fillRect(x + 1, y + 1, 1, 1);
  // полоска таймера
  const t = Math.max(0, eff.duration > 0 ? eff.timeLeft / eff.duration : 0);
  ctx.fillStyle = rgbCss(pal.goldHi);
  ctx.fillRect(x, y + 9, Math.max(0, Math.round(7 * t)), 1);
}

export const BRICK_LABELS = BRICK_LABEL;

export { BALL_R };
