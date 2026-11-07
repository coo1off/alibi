/** Отрисовка игрового поля и оверлеев. Всё в логической сетке 240×320. */
import { FIELD_H, FIELD_W, PADDLE_Y } from "../game/constants";
import type { Game } from "../game/Game";
import { buildBackground } from "./background";
import { drawBall, drawBoss, drawBrick, drawDrop, drawEffectIcon, drawPaddle } from "./draw";
import { type Palette, css } from "./palette";
import { drawText, drawTracked } from "../ui/text";

export type Button = { id: string; label: string; primary?: boolean; dark?: boolean };

export class FieldRenderer {
  private bg: HTMLCanvasElement | null = null;
  private bgKey = "";

  constructor(public readonly ctx: CanvasRenderingContext2D) {}

  background(pal: Palette, chapterIndex: number): HTMLCanvasElement {
    const key = `${chapterIndex}-${pal.bgTop.join()}`;
    if (!this.bg || this.bgKey !== key) {
      this.bg = buildBackground(pal, chapterIndex);
      this.bgKey = key;
    }
    return this.bg;
  }

  resetBackground(): void {
    this.bg = null;
  }

  drawGame(game: Game, pal: Palette, chapterIndex: number): void {
    const ctx = this.ctx;
    const shake = game.shake > 0 ? Math.round((Math.random() * 2 - 1) * 2.5) : 0;
    ctx.save();
    ctx.translate(shake, Math.abs(shake));
    ctx.drawImage(this.background(pal, chapterIndex), 0, 0);

    if (game.bossMaxHp > 0) {
      const hpw = 104;
      const hp = Math.max(0, game.bossHp) / game.bossMaxHp;
      ctx.fillStyle = css(pal.ink2);
      ctx.fillRect(FIELD_W / 2 - hpw / 2, 36, hpw, 3);
      ctx.fillStyle = css(pal.red);
      ctx.fillRect(FIELD_W / 2 - hpw / 2, 36, Math.round(hpw * hp), 3);
      ctx.fillStyle = css(pal.redHi);
      ctx.fillRect(FIELD_W / 2 - hpw / 2, 36, Math.round(hpw * hp), 1);
      drawBoss(ctx, pal, FIELD_W / 2 - 23, 0, 46, game.bossHurt);
    }

    for (const b of game.bricks) if (b.alive) drawBrick(ctx, pal, b);

    for (const d of game.drops) drawDrop(ctx, pal, d);

    for (const s of game.bossShots) {
      ctx.fillStyle = css(pal.blood);
      ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 2, 2, 4);
      ctx.fillStyle = css(pal.redHi);
      ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 2, 1, 1);
    }

    for (const ball of game.balls) if (ball.alive) drawBall(ctx, pal, ball, ball.stuck);

    drawPaddle(ctx, pal, Math.round(game.paddleX), Math.round(game.paddleW));

    // активные эффекты
    let ex = 3;
    for (const eff of game.effects.slice(0, 5)) {
      drawEffectIcon(ctx, pal, eff, ex, PADDLE_Y - 15);
      ex += 9;
    }
    if (game.catchMode) {
      ctx.fillStyle = css(pal.goldHi);
      ctx.fillRect(3, PADDLE_Y - 15, 3, 3);
    }

    // карточка «ХОД N»
    const label = `ХОД ${game.levelIndex + 1}`;
    ctx.font = `normal 7px "Courier New", monospace`;
    const lw = Math.ceil(ctx.measureText(label).width) + 8;
    ctx.fillStyle = css(pal.ink2, 0.9);
    ctx.fillRect(4, FIELD_H - 12, lw, 10);
    ctx.fillStyle = css(pal.redLo);
    ctx.fillRect(4, FIELD_H - 12, lw, 1);
    ctx.fillRect(4, FIELD_H - 12, 1, 10);
    drawText(ctx, label, 4 + lw / 2, FIELD_H - 10, 7, css(pal.red), "center", "normal", false);

    if (game.flash > 0) {
      ctx.fillStyle = css(pal.redHi, Math.min(0.45, game.flash * 4));
      ctx.fillRect(0, 0, FIELD_W, FIELD_H);
    }
    ctx.restore();

    if (game.banner) this.drawBanner(game.banner.text, game.banner.sub, pal);
  }

  private drawBanner(textStr: string, sub: string | undefined, pal: Palette): void {
    const ctx = this.ctx;
    const y = 150;
    ctx.fillStyle = css(pal.ink, 0.85);
    ctx.fillRect(0, y, FIELD_W, sub ? 30 : 20);
    ctx.fillStyle = css(pal.redLo);
    ctx.fillRect(0, y, FIELD_W, 1);
    ctx.fillRect(0, y + (sub ? 29 : 19), FIELD_W, 1);
    drawTracked(ctx, textStr, FIELD_W / 2, y + 6, 9, css(pal.redHi), 1);
    if (sub) drawTracked(ctx, sub, FIELD_W / 2, y + 18, 7, css(pal.dim), 1);
  }

  dim(alpha = 0.82): void {
    this.ctx.fillStyle = `rgba(7,6,19,${alpha})`;
    this.ctx.fillRect(0, 0, FIELD_W, FIELD_H);
  }

  panel(y: number, h: number, pal: Palette, w = 196): void {
    const ctx = this.ctx;
    const x = Math.round((FIELD_W - w) / 2);
    ctx.fillStyle = css(pal.ink);
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = css(pal.border);
    ctx.fillRect(x, y, w, 2);
    ctx.fillRect(x, y + h - 2, w, 2);
    ctx.fillRect(x, y, 2, h);
    ctx.fillRect(x + w - 2, y, 2, h);
    ctx.fillStyle = css(pal.borderHi);
    ctx.fillRect(x + 2, y + 2, w - 4, 1);
  }

  /** Кнопки: возвращает прямоугольники для хит-теста. */
  buttons(list: Button[], startY: number, pal: Palette, gap = 6): { id: string; x: number; y: number; w: number; h: number }[] {
    const ctx = this.ctx;
    const out: { id: string; x: number; y: number; w: number; h: number }[] = [];
    let y = startY;
    for (const b of list) {
      const h = b.primary ? 20 : 16;
      const w = b.primary ? 168 : 128;
      const x = Math.round((FIELD_W - w) / 2);
      const edge = b.primary ? pal.gold : b.dark ? pal.border : pal.borderHi;
      ctx.fillStyle = css(b.primary ? pal.goldLo : pal.panel);
      ctx.fillRect(x, y, w, h);
      if (!b.primary) {
        ctx.fillStyle = css(pal.ink2);
        ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      }
      ctx.fillStyle = css(edge);
      ctx.fillRect(x, y, w, 1);
      ctx.fillRect(x, y + h - 1, w, 1);
      ctx.fillRect(x, y, 1, h);
      ctx.fillRect(x + w - 1, y, 1, h);
      drawText(
        ctx,
        b.label,
        FIELD_W / 2,
        y + (h - (b.primary ? 10 : 8)) / 2,
        b.primary ? 10 : 8,
        b.primary ? css(pal.paper) : css(pal.dim),
        "center",
      );
      out.push({ id: b.id, x, y, w, h });
      y += h + gap;
    }
    return out;
  }

  howtoRow(y: number, glyph: (ctx: CanvasRenderingContext2D, x: number, y: number) => void, title: string, desc: string, pal: Palette): void {
    const ctx = this.ctx;
    glyph(ctx, 26, y);
    drawText(ctx, title, 52, y - 1, 8, css(pal.paper));
    drawText(ctx, desc, 52, y + 9, 7, css(pal.dim), "left", "normal", false);
  }

  titleArt(pal: Palette, chapterIndex: number): void {
    this.ctx.drawImage(this.background(pal, chapterIndex), 0, 0);
  }
}
