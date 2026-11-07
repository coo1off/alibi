/** Логическое разрешение игрового поля (пиксельная сцена). Всё рисуется в этих координатах. */
export const FIELD_W = 240;
export const FIELD_H = 320;

/** Высота HUD в CSS-пикселях (без учёта safe-area). */
export const HUD_CSS_H = 40;

/**
 * Ширина полосы HUD в логических пикселях поля.
 * HUD рендерится в отдельном канвасе шириной hudW * scale, поэтому логически это тот же масштаб, что и у поля.
 */
export const HUD_W = FIELD_W;

/** Кирпичная сетка. */
export const BRICK_COLS = 12;
export const BRICK_ROWS = 20;
export const BRICK_H = 10;
export const BRICK_GAP = 1;
export const BOARD_TOP = 14; // отступ сетки от верхней стены
export const BOARD_SIDE = 8; // левый отступ сетки
export const BRICK_W = (FIELD_W - BOARD_SIDE * 2 - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS;

/** Ракетка. */
export const PADDLE_Y = FIELD_H - 16;
export const PADDLE_H = 4;
export const PADDLE_BASE_W = 46;
export const PADDLE_MAX_W = 92;
export const PADDLE_MIN_W = 28;

/** Мяч. */
export const BALL_R = 3.2;
export const BALL_BASE_SPEED = 98;
export const BALL_MAX_SPEED = 150;
export const BALL_SPEED_STEP = 0.012; // прирост за удар по кирпичу (доля)
export const BALL_MAX_ANGLE = (62 * Math.PI) / 180;

/** Физический шаг. */
export const PHYS_STEP = 1 / 120;

/** Игровой баланс. */
export const START_LIVES = 3;
export const MAX_LIVES = 6;
export const COMBO_STEP = 4; // удар по кирпичу без касания ракетки даёт +1 множитель
export const COMBO_MAX = 8;
export const DROP_CHANCE = 0.12;
export const MAX_DROPS = 3;
export const DROP_SPEED = 46;
export const DROP_W = 13;
export const DROP_H = 8;
export const MAX_BALLS = 6;

/** Босс. */
export const BOSS_SIZE = 46;
export const BOSS_Y = BOARD_TOP + 2 * (BRICK_H + BRICK_GAP) + 8;

/** Мобильное управление: нижняя доля экрана — «зона большого пальца». */
export const TOUCH_ZONE_START = 0.38;
