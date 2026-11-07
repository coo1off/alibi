/** Экраны: заголовок, «как играть», пауза, конец уровня, проигрыш, победа. В логике 240×320.
 *  Шрифты крупные: на телефоне масштаб 2–3, поэтому 8–14 логических px = 16–42 CSS px. */
import { FIELD_H, FIELD_W } from "../game/constants";
import type { Game } from "../game/Game";
import { POWERUP_DEFS, POWERUP_ORDER } from "../game/systems/Powerups";
import { type Palette, css } from "./palette";
import { PORTRAIT, drawGrin, drawMask } from "./sprites";
import { drawPaddle } from "./draw";
import { drawText, drawTracked, wrap } from "../ui/text";
import type { FieldRenderer } from "./field";

export type Hit = { id: string; x: number; y: number; w: number; h: number };

function centeredLines(
  ctx: CanvasRenderingContext2D,
  str: string,
  y: number,
  size: number,
  color: string,
  maxW = 190,
  lineH = 12,
): number {
  const lines = wrap(ctx, str, size, maxW);
  lines.forEach((ln, i) => drawText(ctx, ln, FIELD_W / 2, y + i * lineH, size, color, "center", "normal", true));
  return y + lines.length * lineH;
}

export function drawTitle(fr: FieldRenderer, pal: Palette, best: number, t: number): { hits: Hit[] } {
  const ctx = fr.ctx;
  fr.titleArt(pal, 0);

  const g = ctx.createLinearGradient(0, 0, 0, FIELD_H);
  g.addColorStop(0, "rgba(7,6,19,0.6)");
  g.addColorStop(0.5, "rgba(7,6,19,0.1)");
  g.addColorStop(1, "rgba(7,6,19,0.78)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);

  // фон: гигантский портрет «наблюдателя»
  drawMask(ctx, PORTRAIT, { "1": pal.dim }, 84, 6, 3, { alpha: 0.16 });

  // мяч медленно падает
  const ballY = 40 + ((t * 30) % 220);
  ctx.fillStyle = css(pal.ball);
  ctx.fillRect(FIELD_W / 2 - 3, Math.round(ballY), 6, 6);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(FIELD_W / 2 - 1, Math.round(ballY) + 1, 2, 2);

  drawTracked(ctx, "АЛИБИ", FIELD_W / 2, 78, 40, css(pal.paper), 5);
  ctx.fillStyle = css(pal.gold);
  ctx.fillRect(22, 128, FIELD_W - 44, 2);
  drawTracked(ctx, "ИСТОРИЯ ОДНОГО ХОДА", FIELD_W / 2, 136, 10, css(pal.dim), 2);
  drawText(ctx, `ЛУЧШИЙ РЕЗУЛЬТАТ  ${String(best).padStart(6, "0")}`, FIELD_W / 2, 158, 9, css(pal.goldHi), "center", "normal");

  const hits = fr.buttons(
    [
      { id: "play", label: "НАЧАТЬ ДЕЛО", primary: true },
      { id: "howto", label: "КАК ИГРАТЬ" },
    ],
    180,
    pal,
    10,
  );

  drawPaddle(ctx, pal, 84, 72);
  drawText(ctx, "неофициальный фан-проект", FIELD_W / 2, FIELD_H - 11, 7, css(pal.muted), "center", "normal", false);
  return { hits };
}

export function drawHowto(fr: FieldRenderer, pal: Palette): { hits: Hit[] } {
  const ctx = fr.ctx;
  fr.titleArt(pal, 1);
  fr.dim(0.92);
  drawTracked(ctx, "КАК ИГРАТЬ", FIELD_W / 2, 8, 16, css(pal.goldHi), 2);

  let y = 34;
  const row = (title: string, desc: string, icon: (x: number, y: number) => void) => {
    icon(16, y + 2);
    drawText(ctx, title, 38, y, 11, css(pal.paper));
    drawText(ctx, desc, 38, y + 13, 9, css(pal.paper), "left", "normal", true);
    y += 32;
  };
  row("ВЕДИ РАКЕТКУ", "пальцем по низу экрана", (x, yy) => {
    ctx.fillStyle = css(pal.paddle);
    ctx.fillRect(x, yy + 6, 18, 4);
    ctx.fillStyle = css(pal.paddleHi);
    ctx.fillRect(x, yy + 6, 18, 1);
    ctx.fillStyle = css(pal.dim);
    ctx.fillRect(x + 8, yy, 2, 4);
  });
  row("ЗАПУСТИ МЯЧ", "тап по полю или пробел", (x, yy) => {
    ctx.fillStyle = css(pal.ball);
    ctx.fillRect(x + 7, yy + 1, 4, 4);
    ctx.fillRect(x + 3, yy + 7, 12, 4);
  });
  row("ПАУЗА", "кнопка сверху, Esc или P", (x, yy) => {
    ctx.fillStyle = css(pal.paper);
    ctx.fillRect(x + 4, yy + 2, 4, 11);
    ctx.fillRect(x + 11, yy + 2, 4, 11);
  });

  drawText(ctx, "ЛОВИ ПАДАЮЩИЕ УЛИКИ! НЕ УРОНИ МЯЧ!", FIELD_W / 2, y + 1, 8, css(pal.gold), "center", "normal", true);
  y += 16;

  // легенда бонусов — 2 колонки, крупный текст
  const col = (index: number, kind: (typeof POWERUP_ORDER)[number], cx: number, cy: number) => {
    const def = POWERUP_DEFS[kind];
    const color = kind === "curse" ? pal.red : kind === "life" ? pal.goldHi : pal.paper;
    ctx.fillStyle = css(color);
    ctx.fillRect(cx, cy + 2, 8, 8);
    ctx.fillStyle = css(pal.ink);
    ctx.fillRect(cx + 1, cy + 4, 6, 2);
    drawText(ctx, def.title, cx + 12, cy - 1, 10, css(kind === "curse" ? pal.redHi : pal.paper), "left");
    drawText(ctx, def.desc, cx + 12, cy + 11, 8, css(pal.dim), "left", "normal", true);
    void index;
  };
  POWERUP_ORDER.forEach((kind, i) => {
    const c = i % 2;
    const r = Math.floor(i / 2);
    col(i, kind, c === 0 ? 14 : 126, y + r * 26);
  });
  y += 4 * 26 + 4;

  return {
    hits: fr.buttons([{ id: "back", label: "НАЗАД", primary: true }], Math.min(FIELD_H - 34, y + 12), pal),
  };
}

export function drawPause(fr: FieldRenderer, pal: Palette): { hits: Hit[] } {
  const ctx = fr.ctx;
  fr.dim(0.78);
  fr.panel(84, 150, pal);
  drawTracked(ctx, "ПАУЗА", FIELD_W / 2, 96, 22, css(pal.paper), 5);
  drawText(ctx, "дело подождёт", FIELD_W / 2, 124, 9, css(pal.dim), "center", "normal", true);
  return {
    hits: fr.buttons(
      [
        { id: "resume", label: "ПРОДОЛЖИТЬ", primary: true },
        { id: "restart", label: "ЗАНОВО" },
        { id: "menu", label: "В МЕНЮ" },
      ],
      146,
      pal,
      8,
    ),
  };
}

export function drawClear(fr: FieldRenderer, pal: Palette, game: Game): { hits: Hit[] } {
  const ctx = fr.ctx;
  fr.dim(0.72);
  fr.panel(66, 190, pal);
  drawTracked(ctx, "ХОД ЗАКРЫТ", FIELD_W / 2, 80, 20, css(pal.goldHi), 3);
  drawText(ctx, game.level.title.toUpperCase(), FIELD_W / 2, 108, 11, css(pal.dim), "center", "normal", true);
  drawText(ctx, `ОЧКИ  ${game.score}`, FIELD_W / 2, 134, 15, css(pal.paper), "center");
  drawText(ctx, `ЖИЗНИ  ${game.lives}`, FIELD_W / 2, 156, 10, css(pal.dim), "center", "normal", true);
  if (game.level.intro) {
    centeredLines(ctx, game.level.intro, 178, 9, css(pal.muted), 180, 12);
  }
  return { hits: fr.buttons([{ id: "next", label: "ДАЛЬШЕ", primary: true }], FIELD_H - 42, pal) };
}

export function drawGameOver(fr: FieldRenderer, pal: Palette, game: Game, best: number): { hits: Hit[] } {
  const ctx = fr.ctx;
  fr.dim(0.86);
  fr.panel(28, 264, pal);
  for (let i = 0; i < 12; i++) {
    const x = 18 + i * 17 + (i % 3);
    const h = 4 + ((i * 7) % 12);
    ctx.fillStyle = css(pal.blood);
    ctx.fillRect(x, 30, 2 + (i % 2), h);
  }
  drawGrin(ctx, FIELD_W / 2 - 30, 40, pal, 1.9);
  drawTracked(ctx, "ДЕЛО ЗАКРЫТО", FIELD_W / 2, 112, 18, css(pal.red), 2);
  centeredLines(ctx, "НАБЛЮДАТЕЛЬ ОКАЗАЛСЯ ПРАВ.", 138, 9, css(pal.dim), 190, 12);
  centeredLines(ctx, `СЛЕД ОБОРВАЛСЯ НА ХОДУ ${game.levelIndex + 1}`, 152, 9, css(pal.dim), 190, 12);

  ctx.fillStyle = css(pal.panel);
  ctx.fillRect(22, 172, FIELD_W - 44, 52);
  ctx.fillStyle = css(pal.goldLo);
  ctx.fillRect(22, 172, FIELD_W - 44, 2);
  drawText(ctx, "ОЧКИ", 32, 178, 9, css(pal.gold), "left", "normal", true);
  drawText(ctx, String(game.score).padStart(5, "0"), 32, 192, 18, css(pal.paper));
  drawText(ctx, "РЕКОРД", 140, 178, 9, css(pal.gold), "left", "normal", true);
  drawText(ctx, String(Math.max(best, game.score)).padStart(5, "0"), 140, 196, 12, css(pal.dim));

  return {
    hits: fr.buttons(
      [
        { id: "retry", label: "НОВОЕ ДЕЛО", primary: true },
        { id: "menu", label: "В МЕНЮ" },
      ],
      230,
      pal,
      5,
    ),
  };
}

export function drawVictory(fr: FieldRenderer, pal: Palette, game: Game, t: number): { hits: Hit[] } {
  const ctx = fr.ctx;
  fr.titleArt(pal, 2);
  fr.dim(0.7);
  fr.panel(40, 236, pal);
  const alive = Math.sin(t * 3) > 0.6;
  drawGrin(ctx, FIELD_W / 2 - 26, 50, pal, alive ? 1.6 : 1.5);
  drawTracked(ctx, "ДЕЛО РАСКРЫТО", FIELD_W / 2, 112, 18, css(pal.goldHi), 2);
  centeredLines(ctx, "Ты был прав. Но кто-то ещё улыбается в темноте.", 136, 9, css(pal.dim), 190, 12);
  drawText(ctx, `ОЧКИ  ${game.score}`, FIELD_W / 2, 172, 14, css(pal.paper), "center");
  drawText(ctx, `ВЫСШЕЕ КОМБО  ×${Math.min(game.bestCombo, 8)}`, FIELD_W / 2, 194, 10, css(pal.gold), "center", "normal", true);
  return { hits: fr.buttons([{ id: "menu", label: "В МЕНЮ", primary: true }], FIELD_H - 46, pal) };
}
