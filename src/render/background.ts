import { FIELD_H, FIELD_W } from "../game/constants";
import { css, mix, type Palette } from "./palette";
import { PORTRAIT, PORTRAIT_AGENT, PORTRAIT_FOE, drawMask } from "./sprites";
import { drawChair, drawHatman } from "./figures";

/**
 * Фон сцены: градиент «под прожектором», сетка, подиум и декорации главы.
 * Рисуется один раз в offscreen-canvas и в кадре только drawImage.
 */
function drawSolidChair(ctx: CanvasRenderingContext2D, pal: Palette, x: number, y: number, alpha = 1): void {
  drawChair(ctx, x, y, { body: pal.muted, rim: pal.borderHi, seat: pal.border, leg: pal.border }, alpha);
}

function drawSolidHatman(ctx: CanvasRenderingContext2D, pal: Palette, x: number, y: number, alpha = 1): void {
  drawHatman(ctx, x, y, pal.ink, alpha);
}

export function buildBackground(pal: Palette, chapterIndex: number): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = FIELD_W;
  cv.height = FIELD_H;
  const ctx = cv.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  // 1. Вертикальный градиент
  const g = ctx.createLinearGradient(0, 0, 0, FIELD_H);
  g.addColorStop(0, css(pal.bgTop));
  g.addColorStop(1, css(pal.bgBottom));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);

  // 2. Прожектор: конус со ступенчатой (пиксельной) прозрачностью
  const light = mix(pal.bgBottom, pal.spotlight, 0.55);
  for (let i = 0; i < 22; i++) {
    const t = i / 22;
    const spread = 18 + t * 150;
    ctx.globalAlpha = 0.55 * (1 - t) ** 1.4;
    ctx.fillStyle = css(light);
    ctx.beginPath();
    ctx.moveTo(FIELD_W / 2 - 3, 0);
    ctx.lineTo(FIELD_W / 2 + 3, 0);
    ctx.lineTo(FIELD_W / 2 + spread, FIELD_H - 34);
    ctx.lineTo(FIELD_W / 2 - spread, FIELD_H - 34);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 3. Пиксельная сетка «бумаги в клетку»
  ctx.fillStyle = css(pal.grid);
  for (let y = 0; y < FIELD_H; y += 16) {
    for (let x = 0; x < FIELD_W; x += 16) {
      ctx.fillRect(x, y, 1, 1);
      if (y % 32 === 0 && x % 32 === 0) {
        ctx.globalAlpha = 0.6;
        ctx.fillRect(x + 1, y, 1, 1);
        ctx.fillRect(x, y + 1, 1, 1);
        ctx.globalAlpha = 1;
      }
    }
  }

  // 4. «Сцена»-подиум снизу
  const floor = FIELD_H - 34;
  ctx.fillStyle = css(pal.ink);
  ctx.fillRect(0, floor, FIELD_W, FIELD_H - floor);
  ctx.fillStyle = css(pal.border);
  ctx.fillRect(0, floor, FIELD_W, 1);
  ctx.fillStyle = css(pal.grid);
  for (let x = -20; x < FIELD_W + 20; x += 11) {
    ctx.beginPath();
    ctx.moveTo(x, floor + 2);
    ctx.lineTo(x - 18, FIELD_H - 1);
    ctx.strokeStyle = css(pal.grid);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.fillStyle = css(pal.ink2);
  ctx.fillRect(0, floor - 3, FIELD_W, 3);

  // 5. Декорации главы
  const shadow = css(pal.ink2);
  if (pal.scene === "chair") {
    // кресло наблюдателя слева + силуэт справа
    drawSolidChair(ctx, pal, 12, floor - 46);
    drawSolidHatman(ctx, pal, FIELD_W - 46, floor - 62);
    ctx.fillStyle = shadow;
    ctx.fillRect(10, floor + 6, 62, 2);
    ctx.fillRect(FIELD_W - 48, floor + 6, 32, 2);
  } else if (pal.scene === "door") {
    // «дом без окон»: тёмный проём справа, силуэт в проёме
    ctx.fillStyle = css(pal.ink);
    ctx.fillRect(FIELD_W - 60, floor - 92, 40, 92);
    ctx.fillStyle = css(pal.border);
    ctx.fillRect(FIELD_W - 60, floor - 92, 2, 92);
    ctx.fillRect(FIELD_W - 22, floor - 92, 2, 92);
    ctx.fillRect(FIELD_W - 60, floor - 92, 40, 2);
    drawSolidHatman(ctx, pal, FIELD_W - 50, floor - 70, 0.9);
    // лампа под потолком
    ctx.fillStyle = css(pal.borderHi);
    ctx.fillRect(22, 4, 1, 6);
    ctx.fillRect(18, 10, 9, 3);
    ctx.fillStyle = css(pal.muted);
    ctx.fillRect(19, 13, 7, 1);
  } else {
    // «театр»: занавес по краям сцены
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = css(mix(pal.blood, pal.redLo, i / 7));
      ctx.fillRect(0, i * 4, 14 + i * 3, 4);
      ctx.fillRect(FIELD_W - 14 - i * 3, i * 4, 14 + i * 3, 4);
    }
    for (let y = 0; y < floor - 20; y += 2) {
      ctx.fillStyle = css(pal.redLo);
      ctx.fillRect(8, y, 1, 1);
      ctx.fillRect(FIELD_W - 20, y + 1, 1, 1);
    }
    drawSolidChair(ctx, pal, 14, floor - 44, 0.9);
  }

  // 6. Фоновый «кадр» портрета по мотивам — очень прозрачный
  if (chapterIndex === 1) {
    drawMask(ctx, PORTRAIT_AGENT, { "1": pal.borderHi }, FIELD_W - 70, 8, 2, { alpha: 0.16 });
  } else if (chapterIndex === 2) {
    drawMask(ctx, PORTRAIT_FOE, { "1": pal.red }, FIELD_W - 72, 6, 2, { alpha: 0.14 });
  } else {
    drawMask(ctx, PORTRAIT, { "1": pal.dim }, FIELD_W - 72, 4, 2, { alpha: 0.1 });
  }

  return cv;
}
