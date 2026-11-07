import { FIELD_H, TOUCH_ZONE_START } from "../game/constants";

export type InputHandlers = {
  /** Движение ракетки: центр по X в логических координатах. */
  onMoves(x: number): void;
  /** Тап по полю (запуск мяча / смена слайда). */
  onTap(x: number, y: number): void;
  /** Тап вне поля управления (например, по кнопке в HUD). */
  onSecondary?(): void;
};

export type Point = { x: number; y: number };

/**
 * Управление одним активным указателем. Зона управления — нижняя часть поля,
 * чтобы палец всегда был «в зоне большого пальца».
 */
export class Input {
  private activeId: number | null = null;
  lastInput: "touch" | "mouse" | "key" = "mouse";

  constructor(
    target: HTMLElement,
    private toLogical: (clientX: number, clientY: number) => Point,
    private handlers: InputHandlers,
  ) {
    const el = target;
    el.addEventListener("pointerdown", this.onDown, { passive: false });
    el.addEventListener("pointermove", this.onMove, { passive: false });
    el.addEventListener("pointerup", this.onUp, { passive: false });
    el.addEventListener("pointercancel", this.onUp, { passive: false });
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  private onDown = (e: PointerEvent): void => {
    const p = this.toLogical(e.clientX, e.clientY);
    if (e.pointerType === "touch") {
      this.lastInput = "touch";
      if (this.activeId !== null) return; // второй палец игнорируется
      this.activeId = e.pointerId;
    } else {
      this.lastInput = "mouse";
    }
    if (!this.inControlZone(p.y)) return;
    e.preventDefault();
    this.handlers.onMoves(p.x);
    this.pendingTap = { x: p.x, y: p.y, moved: false };
  };

  private pendingTap: { x: number; y: number; moved: boolean } | null = null;

  private onMove = (e: PointerEvent): void => {
    if (e.pointerType === "touch") {
      if (this.activeId !== e.pointerId) return;
    }
    const p = this.toLogical(e.clientX, e.clientY);
    if (this.pendingTap) this.pendingTap.moved = true;
    if (!this.inControlZone(p.y) && e.pointerType === "touch") return;
    this.handlers.onMoves(p.x);
  };

  private onUp = (e: PointerEvent): void => {
    if (e.pointerType === "touch") {
      if (this.activeId !== e.pointerId) return;
      this.activeId = null;
    }
    const tap = this.pendingTap;
    this.pendingTap = null;
    if (tap) {
      // ракетка мгновенно встаёт под палец на момент отпускания
      this.handlers.onMoves(tap.x);
      const p = this.toLogical(e.clientX, e.clientY);
      if (!tap.moved && Math.abs(p.x - tap.x) < 6 && Math.abs(p.y - tap.y) < 6) {
        this.handlers.onTap(p.x, p.y);
      }
    }
  };

  inControlZone(logicalY: number): boolean {
    return logicalY >= FIELD_H * TOUCH_ZONE_START;
  }

  destroy(): void {
    // обработчики живут столько же, сколько приложение
  }
}
