/** HUD: рисуется в отдельном канвасе 240×N логических пикселей, масштабируется вместе с полем. */
import { HUD_W } from "../game/constants";
import type { Game } from "../game/Game";
import type { Palette } from "../render/palette";
import { css } from "../render/palette";
import { drawText } from "../ui/text";

export const HUD_LOGICAL_H = 36;

const fmtScore = (n: number) => String(Math.floor(n)).padStart(6, "0");

export type HudButton = { id: "pause" | "sound"; x: number; y: number; w: number; h: number };

export class Hud {
  buttons: HudButton[] = [];
  constructor(private ctx: CanvasRenderingContext2D) {}

  draw(game: Game | null, pal: Palette, soundOn: boolean, comboFlash = 0): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, HUD_W, HUD_LOGICAL_H);

    if (game) {
      // ОЧКИ
      drawText(ctx, "ОЧКИ", 6, 3, 8, css(pal.gold), "left", "normal", true);
      drawText(ctx, fmtScore(game.score), 6, 12, 15, css(pal.paper), "left", "bold", true);

      // КОМБО
      const mult = game.comboMult;
      drawText(ctx, "СЛЕД", 100, 3, 8, css(pal.gold), "left", "normal", true);
      const comboColor = mult > 1 ? css(pal.redHi) : css(pal.dim);
      drawText(ctx, `×${mult}`, 100, 12, 15, comboColor, "left", "bold", true);
      if (comboFlash > 0 && mult > 1) {
        ctx.fillStyle = css(pal.redHi, comboFlash);
        ctx.fillRect(96, 6, 60, 24);
        drawText(ctx, `×${mult}`, 100, 13, 14, css(pal.paper), "left", "bold", false);
      }

      // ЖИЗНИ
      const lives = Math.max(0, game.lives);
      drawText(ctx, "ЖИЗНИ", 166, 3, 8, css(pal.gold), "left", "normal", true);
      for (let i = 0; i < lives; i++) {
        const x = 168 + i * 10;
        ctx.fillStyle = css(pal.red);
        ctx.fillRect(x, 15, 7, 8);
        ctx.fillStyle = css(pal.redHi);
        ctx.fillRect(x + 1, 16, 2, 2);
        ctx.fillStyle = css(pal.ink);
        ctx.fillRect(x + 5, 16, 1, 1);
        ctx.fillRect(x + 1, 21, 5, 1);
      }

      // босс
      if (game.bossMaxHp > 0) {
        drawText(ctx, "ОН", 100, 20, 7, css(pal.red), "left", "normal", true);
        const hpw = 56;
        const hp = Math.max(0, game.bossHp) / game.bossMaxHp;
        ctx.fillStyle = css(pal.panel);
        ctx.fillRect(114, 22, hpw, 4);
        ctx.fillStyle = css(pal.red);
        ctx.fillRect(114, 22, Math.round(hpw * hp), 4);
      }
    } else {
      drawText(ctx, "АЛИБИ", 6, 4, 16, css(pal.paper), "left", "bold", true);
      drawText(ctx, "дело не закрыто", 6, 23, 7, css(pal.dim), "left", "normal", true);
    }

    // кнопки: звук и пауза
    this.buttons = [];
    const bsy = 4;
    ctx.fillStyle = css(pal.panel);
    ctx.fillRect(188, bsy, 26, 26);
    ctx.fillStyle = css(pal.border);
    ctx.fillRect(188, bsy, 26, 1);
    ctx.fillStyle = soundOn ? css(pal.gold) : css(pal.muted);
    // динамик
    const sy = bsy + 7;
    ctx.fillRect(194, sy + 7, 3, 5);
    ctx.fillRect(197, sy + 4, 2, 11);
    ctx.fillRect(200, sy + 2, 1, 15);
    if (soundOn) {
      ctx.fillRect(203, sy + 3, 1, 1);
      ctx.fillRect(204, sy + 5, 1, 1);
      ctx.fillRect(205, sy + 7, 1, 5);
      ctx.fillRect(204, sy + 13, 1, 1);
      ctx.fillRect(203, sy + 15, 1, 1);
    } else {
      ctx.fillRect(203, sy + 6, 1, 1);
      ctx.fillRect(204, sy + 7, 1, 1);
      ctx.fillRect(205, sy + 8, 1, 1);
      ctx.fillRect(204, sy + 9, 1, 1);
      ctx.fillRect(203, sy + 10, 1, 1);
      ctx.fillRect(207, sy + 8, 1, 8);
      ctx.fillRect(206, sy + 9, 1, 6);
      ctx.fillRect(205, sy + 10, 1, 4);
    }
    this.buttons.push({ id: "sound", x: 188, y: bsy, w: 26, h: 26 });

    ctx.fillStyle = css(pal.panel);
    ctx.fillRect(218, bsy, 26, 26);
    ctx.fillStyle = css(pal.border);
    ctx.fillRect(218, bsy, 26, 1);
    ctx.fillStyle = css(pal.paper);
    ctx.fillRect(225, bsy + 6, 4, 14);
    ctx.fillRect(233, bsy + 6, 4, 14);
    this.buttons.push({ id: "pause", x: 218, y: bsy, w: 26, h: 26 });
  }
}
