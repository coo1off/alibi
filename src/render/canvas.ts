/** Выбор DOM-канвасов и целочисленный масштаб поля. */
import { FIELD_H, FIELD_W, HUD_W } from "../game/constants";

export type CanvasSet = {
  field: HTMLCanvasElement;
  fieldCtx: CanvasRenderingContext2D;
  hud: HTMLCanvasElement;
  hudCtx: CanvasRenderingContext2D;
};

export type Layout = {
  /** CSS-пикселей на логический пиксель (целое число ≥ 1). */
  scale: number;
  fieldW: number;
  fieldH: number;
  hudW: number;
  hudH: number;
  landscape: boolean;
};

function ctx2d(c: HTMLCanvasElement, alpha = false): CanvasRenderingContext2D {
  const ctx = c.getContext("2d", { alpha });
  if (!ctx) throw new Error("Canvas 2D недоступен");
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

export function createCanvases(fieldHost: HTMLElement, hudHost: HTMLElement): CanvasSet {
  const field = document.createElement("canvas");
  field.width = FIELD_W;
  field.height = FIELD_H;
  field.setAttribute("role", "img");
  field.setAttribute("aria-label", "Игровое поле");
  const hud = document.createElement("canvas");
  hud.width = HUD_W;
  hud.height = 1;
  fieldHost.appendChild(field);
  hudHost.appendChild(hud);
  return { field, fieldCtx: ctx2d(field), hud, hudCtx: ctx2d(hud, true) };
}

export function computeLayout(availW: number, availH: number, hudLogicalH: number): Layout {
  const landscape = availW > availH * 1.15;
  const maxHudScale = Math.max(1, Math.min(4, Math.floor(availH / 120)));
  let hudScale = maxHudScale;
  // HUD должен помещаться по ширине (текст рисуется в логических пикселях)
  hudScale = Math.min(hudScale, Math.max(1, Math.floor(availW / HUD_W)));
  const hudCss = hudLogicalH * hudScale;
  const scale = Math.max(1, Math.min(6, Math.floor(Math.min(availW / FIELD_W, (availH - hudCss) / FIELD_H))));
  return {
    scale,
    fieldW: FIELD_W * scale,
    fieldH: FIELD_H * scale,
    hudW: HUD_W * hudScale,
    hudH: hudCss,
    landscape,
  };
}
