/**
 * HUD: два ряда в логических пикселях шириной 240.
 * Крупные цифры и кнопки 40×40 — читается на телефоне даже при масштабе 2.
 */
import { HUD_W } from "../game/constants";
import type { Game } from "../game/Game";
import { type Palette, css } from "../render/palette";
import { drawText } from "../ui/text";

export const HUD_LOGICAL_H = 64;
const ROW = 32;

const fmtScore = (n: number) => String(Math.floor(n)).padStart(6, "0");

export type HudButton = { id: "pause" | "sound"; x: number; y: number; w: number; h: number };

export class Hud {
  buttons: HudButton[] = [];
  constructor(private ctx: CanvasRenderingContext2D) {}

  draw(game: Game | null, pal: Palette, soundOn: boolean, comboFlash = 0): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, HUD_W, HUD_LOGICAL_H);

    const label = (str: string, x: number, y: number, color = pal.gold) =>
      drawText(ctx, str, x, y, 10, css(color), "left", "normal", true);

    if (game) {
      // ── ряд 1: очки, след, жизни
      label("ОЧКИ", 6, 2);
      drawText(ctx, fmtScore(game.score), 6, 11, 18, css(pal.paper), "left", "bold", true);

      const mult = game.comboMult;
      label("СЛЕД", 92, 2);
      const comboColor = mult > 1 ? css(pal.redHi) : css(pal.dim);
      drawText(ctx, `×${mult}`, 92, 13, 19, comboColor, "left", "bold", true);
      if (comboFlash > 0 && mult > 1) {
        ctx.fillStyle = css(pal.redHi, Math.min(1, comboFlash));
        ctx.fillRect(86, 12, 52, 20);
        drawText(ctx, `×${mult}`, 92, 13, 19, css(pal.paper), "left", "bold", false);
      }

      label("ЖИЗНИ", 150, 2);
      const lives = Math.max(0, game.lives);
      for (let i = 0; i < lives; i++) {
        const x = 150 + i * 13;
        ctx.fillStyle = css(pal.red);
        ctx.fillRect(x, 16, 10, 11);
        ctx.fillStyle = css(pal.redHi);
        ctx.fillRect(x + 1, 17, 3, 3);
        ctx.fillStyle = css(pal.ink);
        ctx.fillRect(x + 7, 17, 2, 2);
        ctx.fillRect(x + 2, 24, 6, 1);
      }

      // ── ряд 2: босс
      if (game.bossMaxHp > 0) {
        label("ОН", 6, ROW + 5, pal.red);
        const hpw = 170;
        const hp = Math.max(0, game.bossHp) / game.bossMaxHp;
        ctx.fillStyle = css(pal.panel);
        ctx.fillRect(24, ROW + 10, hpw, 10);
        ctx.fillStyle = css(pal.border);
        ctx.fillRect(24, ROW + 10, hpw, 1);
        ctx.fillStyle = css(pal.red);
        ctx.fillRect(25, ROW + 11, Math.round((hpw - 2) * hp), 8);
        ctx.fillStyle = css(pal.redHi);
        ctx.fillRect(25, ROW + 11, Math.round((hpw - 2) * hp), 2);
        drawText(
          ctx,
          `${Math.max(0, game.bossHp)}`,
          HUD_W - 6,
          ROW + 4,
          12,
          css(pal.redHi),
          "right",
          "bold",
          true,
        );
      }
    } else {
      drawText(ctx, "АЛИБИ", 6, 6, 22, css(pal.paper), "left", "bold", true);
      drawText(ctx, "дело не закрыто", 6, 33, 10, css(pal.dim), "left", "normal", true);
    }

    // ── кнопки 40×40 справа (по 2 на ряд)
    this.buttons = [];
    const bw = 40;
    const x0 = HUD_W - bw - 4;

    ctx.fillStyle = css(pal.panel);
    ctx.fillRect(x0, 2, bw, ROW - 4);
    ctx.fillStyle = css(pal.border);
    ctx.fillRect(x0, 2, bw, 1);
    ctx.fillStyle = soundOn ? css(pal.goldHi) : css(pal.muted);
    // динамик
    const cx = x0 + 12;
    const cy = 14; // верх айкона
    ctx.fillRect(cx, cy + 5, 4, 5);
    ctx.fillRect(cx + 4, cy + 2, 2, 11);
    ctx.fillRect(cx + 6, cy, 1, 15);
    if (soundOn) {
      ctx.fillRect(cx + 10, cy + 4, 1, 1);
      ctx.fillRect(cx + 11, cy + 5, 1, 1);
      ctx.fillRect(cx + 12, cy + 6, 1, 3);
      ctx.fillRect(cx + 11, cy + 9, 1, 1);
      ctx.fillRect(cx + 10, cy + 10, 1, 1);
    } else {
      ctx.fillRect(cx + 9, cy + 5, 1, 1);
      ctx.fillRect(cx + 10, cy + 6, 1, 1);
      ctx.fillRect(cx + 11, cy + 7, 1, 1);
      ctx.fillRect(cx + 10, cy + 8, 1, 1);
      ctx.fillRect(cx + 9, cy + 9, 1, 1);
      ctx.fillRect(cx + 13, cy + 5, 1, 1);
      ctx.fillRect(cx + 14, cy + 6, 1, 1);
      ctx.fillRect(cx + 15, cy + 7, 1, 1);
      ctx.fillRect(cx + 14, cy + 8, 1, 1);
      ctx.fillRect(cx + 13, cy + 9, 1, 1);
    }
    this.buttons.push({ id: "sound", x: x0, y: 2, w: bw, h: ROW - 4 });

    ctx.fillStyle = css(pal.panel);
    ctx.fillRect(x0, ROW + 2, bw, ROW - 4);
    ctx.fillStyle = css(pal.border);
    ctx.fillRect(x0, ROW + 2, bw, 1);
    ctx.fillStyle = css(pal.paper);
    ctx.fillRect(x0 + 13, ROW + 8, 5, 16);
    ctx.fillRect(x0 + 23, ROW + 8, 5, 16);
    this.buttons.push({ id: "pause", x: x0, y: ROW + 2, w: bw, h: ROW - 4 });
  }
}
