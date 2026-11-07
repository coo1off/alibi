/** Экраны: заголовок, «как играть», пауза, конец уровня, проигрыш, победа. В логике 240×320. */
import { FIELD_H, FIELD_W } from "../game/constants";
import type { Game } from "../game/Game";
import { POWERUP_DEFS, POWERUP_ORDER } from "../game/systems/Powerups";
import { css } from "./palette";
import type { Palette } from "./palette";
import { PORTRAIT, drawGrin, drawMask } from "./sprites";
import { drawPaddle } from "./draw";
import { drawText, drawTracked, wrap } from "../ui/text";
import type { FieldRenderer } from "./field";

export type Hit = { id: string; x: number; y: number; w: number; h: number };

export function drawTitle(fr: FieldRenderer, pal: Palette, best: number, t: number): { hits: Hit[] } {
  fr.titleArt(pal, 0);
  const ctx = fr.ctx;

  // затемнение сцены под заголовком
  const g = ctx.createLinearGradient(0, 0, 0, FIELD_H);
  g.addColorStop(0, "rgba(7,6,19,0.55)");
  g.addColorStop(0.55, "rgba(7,6,19,0.0)");
  g.addColorStop(1, "rgba(7,6,19,0.72)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);

  // фон: гигантский портрет «наблюдателя»
  drawMask(ctx, PORTRAIT, { "1": pal.dim }, 96, 18, 2, { alpha: 0.18 });

  // мяч медленно падает
  const ballY = 40 + ((t * 26) % 250);
  ctx.fillStyle = css(pal.ball);
  ctx.fillRect(FIELD_W / 2 - 2, Math.round(ballY), 4, 4);
  ctx.fillStyle = "#fff";
  ctx.fillRect(FIELD_W / 2 - 1, Math.round(ballY) + 1, 1, 1);

  drawTracked(ctx, "АЛИБИ", FIELD_W / 2, 92, 34, css(pal.paper), 4);
  ctx.fillStyle = css(pal.gold);
  ctx.fillRect(FIELD_W / 2 - 60, 90, 120, 1);
  ctx.fillRect(FIELD_W / 2 - 60, 130, 120, 1);
  drawTracked(ctx, "ИСТОРИЯ ОДНОГО ХОДА", FIELD_W / 2, 136, 7, css(pal.dim), 2);

  drawText(ctx, `ЛУЧШИЙ РЕЗУЛЬТАТ  ${String(best).padStart(6, "0")}`, FIELD_W / 2, 152, 7, css(pal.goldHi), "center", "normal");
  drawText(ctx, "неофициальный фан-проект", FIELD_W / 2, FIELD_H - 12, 6, css(pal.muted), "center", "normal", false);

  const hits = fr.buttons(
    [
      { id: "play", label: "НАЧАТЬ ДЕЛО", primary: true },
      { id: "howto", label: "КАК ИГРАТЬ" },
    ],
    176,
    pal,
    8,
  );

  // ракетка нагруженная внизу
  drawPaddle(ctx, pal, 90, 60);
  return { hits };
}

export function drawHowto(fr: FieldRenderer, pal: Palette): { hits: Hit[] } {
  const ctx = fr.ctx;
  fr.titleArt(pal, 1);
  fr.dim(0.9);
  drawTracked(ctx, "КАК ИГРАТЬ", FIELD_W / 2, 12, 12, css(pal.goldHi), 2);

  let y = 36;
  const row = (title: string, desc: string, icon: (x: number, y: number) => void) => {
    icon(22, y + 2);
    drawText(ctx, title, 42, y, 8, css(pal.paper));
    drawText(ctx, desc, 42, y + 10, 7, css(pal.dim), "left", "normal", false);
    y += 24;
  };
  row("ВЕДИ РАКЕТКУ", "пальцем или мышью — по низу экрана", (x, yy) => {
    ctx.fillStyle = css(pal.paddle);
    ctx.fillRect(x, yy + 5, 16, 3);
    ctx.fillStyle = css(pal.dim);
    ctx.fillRect(x + 7, yy, 1, 3);
  });
  row("ЗАПУСТИ МЯЧ", "тапом или пробелом", (x, yy) => {
    ctx.fillStyle = css(pal.ball);
    ctx.fillRect(x + 7, yy + 1, 3, 3);
    ctx.fillRect(x + 5, yy + 6, 7, 3);
  });
  row("ПАУЗА", "кнопка сверху или Esc / P", (x, yy) => {
    ctx.fillStyle = css(pal.paper);
    ctx.fillRect(x + 4, yy + 2, 3, 8);
    ctx.fillRect(x + 9, yy + 2, 3, 8);
  });

  drawText(ctx, "УЛИКИ ПАДАЮТ СВЕРХУ — ЛОВИ ИХ РАКЕТКОЙ", FIELD_W / 2, y + 2, 7, css(pal.gold), "center", "normal", false);
  y += 18;

  // легенда бонусов
  for (const kind of POWERUP_ORDER) {
    const def = POWERUP_DEFS[kind];
    ctx.fillStyle = css(kind === "curse" ? pal.red : kind === "life" ? pal.goldHi : pal.paper);
    ctx.fillRect(24, y + 1, 6, 6);
    ctx.fillStyle = css(pal.ink);
    ctx.fillRect(25, y + 3, 4, 1);
    const label = `${def.title}: ${def.desc}`;
    drawText(ctx, label, 36, y, 7, css(kind === "curse" ? pal.redHi : pal.dim), "left", "normal", false);
    y += 12;
  }

  return { hits: fr.buttons([{ id: "back", label: "НАЗАД", primary: false }], FIELD_H - 30, pal) };
}

export function drawPause(fr: FieldRenderer, pal: Palette): { hits: Hit[] } {
  const ctx = fr.ctx;
  fr.dim(0.78);
  fr.panel(104, 112, pal);
  drawTracked(ctx, "ПАУЗА", FIELD_W / 2, 116, 14, css(pal.paper), 4);
  drawText(ctx, "дело подождёт", FIELD_W / 2, 136, 7, css(pal.dim), "center", "normal", false);
  return {
    hits: fr.buttons(
      [
        { id: "resume", label: "ПРОДОЛЖИТЬ", primary: true },
        { id: "restart", label: "ЗАНОВО" },
        { id: "menu", label: "В МЕНЮ", dark: true },
      ],
      152,
      pal,
      6,
    ),
  };
}

export function drawClear(fr: FieldRenderer, pal: Palette, game: Game): { hits: Hit[] } {
  const ctx = fr.ctx;
  fr.dim(0.72);
  fr.panel(92, 136, pal);
  drawTracked(ctx, "ХОД ЗАКРЫТ", FIELD_W / 2, 104, 14, css(pal.goldHi), 3);
  drawText(ctx, game.level.title.toUpperCase(), FIELD_W / 2, 126, 8, css(pal.dim), "center", "normal", false);
  drawText(ctx, `ОЧКИ  ${game.score}`, FIELD_W / 2, 148, 10, css(pal.paper), "center");
  drawText(ctx, `ЖИЗНИ  ${game.lives}`, FIELD_W / 2, 164, 8, css(pal.dim), "center", "normal");
  if (game.level.intro) {
    const lines = wrap(ctx, game.level.intro, 7, 160);
    lines.forEach((ln, i) => drawText(ctx, ln, FIELD_W / 2, 180 + i * 9, 7, css(pal.muted), "center", "normal", false));
  }
  return { hits: fr.buttons([{ id: "next", label: "ДАЛЬШЕ", primary: true }], FIELD_H - 34, pal) };
}

export function drawGameOver(fr: FieldRenderer, pal: Palette, game: Game, best: number): { hits: Hit[] } {
  const ctx = fr.ctx;
  fr.dim(0.86);
  fr.panel(48, 224, pal);
  // кровь по верхней кромке панели
  for (let i = 0; i < 12; i++) {
    const x = 28 + i * 16 + (i % 3);
    const h = 3 + ((i * 7) % 11);
    ctx.fillStyle = css(pal.blood);
    ctx.fillRect(x, 50, 1 + (i % 2), h);
  }
  drawGrin(ctx, FIELD_W / 2 - 24, 62, pal, 1.5);
  drawTracked(ctx, "ДЕЛО ЗАКРЫТО", FIELD_W / 2, 118, 15, css(pal.red), 2);
  drawText(ctx, "НАБЛЮДАТЕЛЬ ОКАЗАЛСЯ ПРАВ.", FIELD_W / 2, 142, 6, css(pal.dim), "center", "normal", false);
  drawText(ctx, `СЛЕД ОБОРВАЛСЯ НА ХОДУ ${game.levelIndex + 1}`, FIELD_W / 2, 152, 6, css(pal.dim), "center", "normal", false);

  // итоги
  ctx.fillStyle = css(pal.panel);
  ctx.fillRect(44, 168, FIELD_W - 88, 30);
  ctx.fillStyle = css(pal.goldLo);
  ctx.fillRect(44, 168, FIELD_W - 88, 1);
  drawText(ctx, "ОЧКИ", 54, 171, 7, css(pal.gold), "left", "normal", false);
  drawText(ctx, String(game.score).padStart(5, "0"), 54, 180, 12, css(pal.paper));
  drawText(ctx, "РЕКОРД", 168, 171, 7, css(pal.gold), "left", "normal", false);
  drawText(ctx, String(Math.max(best, game.score)).padStart(5, "0"), 168, 181, 9, css(pal.dim));

  return {
    hits: fr.buttons(
      [
        { id: "retry", label: "НОВОЕ ДЕЛО", primary: true },
        { id: "menu", label: "В МЕНЮ", dark: true },
      ],
      210,
      pal,
      6,
    ),
  };
}

export function drawVictory(fr: FieldRenderer, pal: Palette, game: Game, t: number): { hits: Hit[] } {
  const ctx = fr.ctx;
  fr.titleArt(pal, 2);
  fr.dim(0.7);
  fr.panel(70, 180, pal);
  // погасшая ухмылка
  const alive = Math.sin(t * 3) > 0.6;
  drawGrin(ctx, FIELD_W / 2 - 18, 78, pal, alive ? 1.15 : 1.05);
  drawTracked(ctx, "ДЕЛО РАСКРЫТО", FIELD_W / 2, 128, 14, css(pal.goldHi), 2);
  const lines = wrap(ctx, "Ты был прав. Но кто-то ещё улыбается в темноте.", 7, 168);
  lines.forEach((ln, i) => drawText(ctx, ln, FIELD_W / 2, 150 + i * 10, 7, css(pal.dim), "center", "normal", false));
  drawText(ctx, `ОЧКИ  ${game.score}`, FIELD_W / 2, 182, 10, css(pal.paper), "center");
  drawText(ctx, `ВЫСШЕЕ КОМБО  ×${Math.min(game.bestCombo, 8)}`, FIELD_W / 2, 198, 7, css(pal.gold), "center", "normal", false);
  return { hits: fr.buttons([{ id: "menu", label: "В МЕНЮ", primary: true }], FIELD_H - 36, pal) };
}

