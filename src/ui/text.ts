/** Пиксельный шрифт: рисуем в логических координатах. Санити-минимум. */
export const MONO = '"Courier New", "Nimbus Mono PS", "Noto Sans Mono", ui-monospace, monospace';

export function drawText(
  ctx: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = "left",
  weight = "bold",
  shadow = true,
): void {
  ctx.font = `${weight} ${size}px ${MONO}`;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  if (shadow) {
    ctx.fillStyle = "rgba(0,0,0,0.66)";
    ctx.fillText(str, x + 1, y + 1);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

/** Текст с разрядкой (ретро-заголовки). */
export function drawTracked(
  ctx: CanvasRenderingContext2D,
  str: string,
  cx: number,
  y: number,
  size: number,
  color: string,
  tracking = 2,
  shadow = true,
): void {
  ctx.font = `bold ${size}px ${MONO}`;
  const chars = [...str];
  let total = -tracking;
  const widths = chars.map((ch) => {
    const w = ctx.measureText(ch).width;
    total += w + tracking;
    return w;
  });
  let x = Math.round(cx - total / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  for (let i = 0; i < chars.length; i++) {
    if (shadow) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillText(chars[i], x + 1, y + 1);
    }
    ctx.fillStyle = color;
    ctx.fillText(chars[i], x, y);
    x += widths[i] + tracking;
  }
}

export function wrap(ctx: CanvasRenderingContext2D, str: string, size: number, maxW: number): string[] {
  ctx.font = `bold ${size}px ${MONO}`;
  const words = str.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}
