/** Силуэтные фигуры сцены: кресло наблюдателя и человек в шляпе. */
import type { Rgb } from "./palette";

export type ChairColors = { body: Rgb; rim: Rgb; seat: Rgb; leg: Rgb };

const put = (ctx: CanvasRenderingContext2D, c: Rgb, alpha: number, x: number, y: number, w: number, h: number) => {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
};

/** Портретное кресло «с ушами»: спинка, крылья, подлокотники, ножки. 34×32. */
export function drawChair(ctx: CanvasRenderingContext2D, x: number, y: number, colors: ChairColors, alpha = 1): void {
  const { body, rim, seat, leg } = colors;
  // спинка-таблетка
  put(ctx, body, alpha, x + 6, y + 2, 22, 22);
  put(ctx, rim, alpha, x + 6, y + 2, 22, 2);
  // «крылья» по бокам
  put(ctx, body, alpha, x + 1, y + 6, 7, 16);
  put(ctx, body, alpha, x + 26, y + 6, 7, 16);
  put(ctx, rim, alpha, x + 1, y + 6, 7, 2);
  put(ctx, rim, alpha, x + 26, y + 6, 7, 2);
  // подлокотники
  put(ctx, seat, alpha, x, y + 20, 9, 4);
  put(ctx, seat, alpha, x + 25, y + 20, 9, 4);
  // сиденье
  put(ctx, body, alpha, x + 9, y + 22, 16, 4);
  put(ctx, seat, alpha, x + 9, y + 22, 16, 1);
  // ножки
  put(ctx, leg, alpha, x + 5, y + 26, 2, 5);
  put(ctx, leg, alpha, x + 27, y + 26, 2, 5);
  put(ctx, body, alpha, x + 4, y + 29, 26, 2);
}

/** Человек в шляпе и плаще — силуэт 16×26. */
export function drawHatman(ctx: CanvasRenderingContext2D, x: number, y: number, color: Rgb, alpha = 1): void {
  // поля шляпы
  put(ctx, color, alpha, x + 0, y + 4, 16, 2);
  // тулья
  put(ctx, color, alpha, x + 5, y + 0, 6, 5);
  // голова/шея
  put(ctx, color, alpha, x + 5, y + 6, 6, 3);
  // плечи и плащ
  put(ctx, color, alpha, x + 2, y + 9, 12, 4);
  put(ctx, color, alpha, x + 1, y + 13, 14, 10);
  put(ctx, color, alpha, x + 4, y + 23, 8, 3);
  // ноги
  put(ctx, color, alpha, x + 4, y + 26, 3, 1);
  put(ctx, color, alpha, x + 9, y + 26, 3, 1);
}
