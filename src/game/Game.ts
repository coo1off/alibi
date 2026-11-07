import {
  BALL_SPEED_STEP,
  BOARD_TOP,
  BRICK_GAP,
  BRICK_H,
  DROP_CHANCE,
  DROP_H,
  DROP_SPEED,
  DROP_W,
  FIELD_H,
  FIELD_W,
  MAX_BALLS,
  MAX_DROPS,
  MAX_LIVES,
  PADDLE_BASE_W,
  PADDLE_H,
  PADDLE_Y,
  START_LIVES,
} from "./constants";
import { BRICK_HP, BRICK_SCORE } from "../render/palette";
import { accelerate, clampAngle, cloneBall, launch, speedOf, stuckBall } from "./Ball";
import type { ActiveEffect, Ball, Brick, Drop, DropKind } from "./entities";
import { POWERUP_DEFS, rollDropKind } from "./systems/Powerups";
import { levelCells } from "./systems/levels";
import type { Level } from "./systems/levels";

export type Phase = "ready" | "playing" | "paused" | "clear" | "gameover" | "won";

export type GameEvents = {
  onHitBrick?: (brick: Brick, destroyed: boolean) => void;
  onHitPaddle?: (x: number, y: number) => void;
  onHitWall?: (x: number, y: number) => void;
  onLoseBall?: (livesLeft: number) => void;
  onGameOver?: () => void;
  onLevelClear?: (level: Level) => void;
  onPowerup?: (kind: DropKind) => void;
  onBossHurt?: (hpLeft: number) => void;
  onCombo?: (mult: number) => void;
};

export type Banner = { text: string; sub?: string; t: number; dur: number };

export type BossShot = { x: number; y: number; vx: number; vy: number };

const rand = Math.random;

function isBossLevel(level: Level): boolean {
  return !!level.boss && level.boss.hp > 0;
}

export class Game {
  level: Level;
  levelIndex: number;
  chapterIndex: number;

  paddleX: number;
  paddleW = PADDLE_BASE_W;
  private paddleTarget: number | null = null;

  balls: Ball[] = [];
  bricks: Brick[] = [];
  drops: Drop[] = [];
  effects: ActiveEffect[] = [];
  catchMode = false;
  bossShots: BossShot[] = [];

  score = 0;
  lives = START_LIVES;
  combo = 0;
  comboMult = 1;
  bestCombo = 0;

  phase: Phase = "ready";
  time = 0;
  shake = 0;
  flash = 0;
  banner: Banner | null = null;

  bossHp = 0;
  bossMaxHp = 0;
  bossHurt = 0;
  bossAttackT = 0;

  events: GameEvents;

  constructor(level: Level, chapterIndex: number, levelIndex: number, events: GameEvents = {}) {
    this.level = level;
    this.chapterIndex = chapterIndex;
    this.levelIndex = levelIndex;
    this.events = events;
    this.paddleX = FIELD_W / 2 - this.paddleW / 2;
    this.buildLevel(level);
    this.resetBalls();
  }

  // ------------------------------------------------------------------ построение

  private buildLevel(level: Level): void {
    this.bricks = [];
    for (const c of levelCells(level)) {
      this.bricks.push({
        col: c.col,
        row: c.row,
        x: 8 + c.col * ((FIELD_W - 16 - (BRICK_GAP * 11)) / 12 + BRICK_GAP),
        y: BOARD_TOP + (c.row + (level.boss ? 5 : 0)) * (BRICK_H + BRICK_GAP),
        w: (FIELD_W - 16 - BRICK_GAP * 11) / 12,
        h: BRICK_H,
        type: c.type,
        hp: c.solid ? 1 : BRICK_HP[c.type],
        solid: c.solid,
        hitFlash: 0,
        alive: true,
      });
    }
    this.bossMaxHp = level.boss?.hp ?? 0;
    this.bossHp = this.bossMaxHp;
    this.bossShots = [];
    this.bossAttackT = 4.5;
    this.drops = [];
    this.effects = [];
    this.catchMode = false;
  }

  private resetBalls(): void {
    this.balls = [stuckBall(this.paddleX, this.paddleW, PADDLE_Y)];
    this.phase = "ready";
  }

  get bossAlive(): boolean {
    return this.bossMaxHp > 0 && this.bossHp > 0;
  }

  get bricksLeft(): number {
    return this.bricks.filter((b) => b.alive && !b.solid).length;
  }

  get levelComplete(): boolean {
    if (isBossLevel(this.level)) return this.bossHp <= 0;
    return this.bricksLeft === 0;
  }

  get slowFactor(): number {
    return this.effect("slow") ? 0.55 : 1;
  }

  // ------------------------------------------------------------------ ввод

  /** Центр ракетки по X (логические координаты). */
  movePaddleTo(x: number): void {
    this.paddleTarget = x;
  }

  nudgePaddle(dx: number): void {
    this.paddleTarget = (this.paddleTarget ?? this.paddleX + this.paddleW / 2) + dx;
  }

  /** Запустить мяч(и). Возвращает true, если что-то запущено. */
  launchBalls(): boolean {
    let launched = false;
    for (const b of this.balls) {
      if (b.alive && b.stuck) {
        launch(b, rand);
        launched = true;
      }
    }
    if (launched && this.phase === "ready") this.phase = "playing";
    return launched;
  }

  pause(): void {
    if (this.phase === "playing" || this.phase === "ready") this.phase = "paused";
  }

  resume(): void {
    if (this.phase === "paused") this.phase = "playing";
  }

  effect(kind: ActiveEffect["kind"]): ActiveEffect | undefined {
    return this.effects.find((e) => e.kind === kind);
  }

  showBanner(text: string, sub?: string, dur = 1.6): void {
    this.banner = { text, sub, t: 0, dur };
  }

  // ------------------------------------------------------------------ обновление

  update(dt: number): void {
    this.time += dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt);
    if (this.bossHurt > 0) this.bossHurt = Math.max(0, this.bossHurt - dt);
    for (const b of this.bricks) if (b.hitFlash > 0) b.hitFlash = Math.max(0, b.hitFlash - dt);
    if (this.banner) {
      this.banner.t += dt;
      if (this.banner.t > this.banner.dur) this.banner = null;
    }
    if (this.phase === "clear" || this.phase === "gameover" || this.phase === "won" || this.phase === "paused") {
      this.movePaddle(dt);
      return;
    }

    // таймеры эффектов
    for (const e of this.effects) e.timeLeft -= dt;
    const before = this.effects.length;
    this.effects = this.effects.filter((e) => e.timeLeft > 0);
    if (this.effects.length !== before) this.refreshPaddleWidth();

    this.movePaddle(dt);

    const slow = this.slowFactor;
    for (const ball of this.balls) {
      if (!ball.alive) continue;
      if (ball.stuck) {
        ball.x = this.paddleX + this.paddleW / 2;
        ball.y = PADDLE_Y - ball.r - 2;
        continue;
      }
      ball.trail.unshift({ x: ball.x, y: ball.y });
      if (ball.trail.length > 4) ball.trail.pop();
      this.stepBall(ball, dt * slow);
    }

    this.updateBossShots(dt);
    this.updateDrops(dt);

    if (this.bossAlive) this.updateBoss(dt);

    if (this.balls.every((b) => !b.alive)) {
      this.loseLife();
      return;
    }

    if (this.phase === "playing" && this.levelComplete) {
      this.phase = "clear";
      this.events.onLevelClear?.(this.level);
    }
  }

  /** Прямая установка ракетки (мышь/палец): без сглаживания на отпускании. */
  setPaddleCenter(x: number, snap = false): void {
    const wanted = Math.min(FIELD_W - this.paddleW, Math.max(0, x - this.paddleW / 2));
    if (snap) this.paddleX = wanted;
    this.paddleTarget = wanted + this.paddleW / 2;
  }

  private movePaddle(dt: number): void {
    if (this.paddleTarget === null) return;
    const wanted = this.paddleTarget - this.paddleW / 2;
    const clamped = Math.min(FIELD_W - this.paddleW, Math.max(0, wanted));
    // лёгкое сглаживание, чтобы палец не «дрожал» ракеткой
    this.paddleX += (clamped - this.paddleX) * Math.min(1, dt * 30);
    if (Math.abs(clamped - this.paddleX) < 0.2) this.paddleX = clamped;
  }

  private refreshPaddleWidth(): void {
    let w = PADDLE_BASE_W;
    if (this.effect("widen")) w *= 1.6;
    if (this.effect("guard")) w = Math.max(w, PADDLE_BASE_W * 1.4);
    if (this.effect("curse")) w *= 0.72;
    w = Math.min(92, Math.max(28, w));
    const center = this.paddleX + this.paddleW / 2;
    this.paddleW = w;
    this.paddleX = Math.min(FIELD_W - w, Math.max(0, center - w / 2));
  }

  private stepBall(ball: Ball, dt: number): void {
    const steps = Math.max(1, Math.ceil((speedOf(ball) * dt) / 1.2));
    const sdt = dt / steps;
    for (let i = 0; i < steps && ball.alive; i++) this.substep(ball, sdt);
  }

  private substep(ball: Ball, dt: number): void {
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x - ball.r < 0) {
      ball.x = ball.r;
      ball.vx = Math.abs(ball.vx);
      this.events.onHitWall?.(ball.x, ball.y);
    } else if (ball.x + ball.r > FIELD_W) {
      ball.x = FIELD_W - ball.r;
      ball.vx = -Math.abs(ball.vx);
      this.events.onHitWall?.(ball.x, ball.y);
    }
    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.vy = Math.abs(ball.vy);
      this.events.onHitWall?.(ball.x, ball.y);
      this.hitBoss(ball);
    }

    this.collidePaddle(ball);
    this.collideBricks(ball);

    if (ball.y - ball.r > FIELD_H) ball.alive = false;
  }

  private collidePaddle(ball: Ball): void {
    if (ball.vy <= 0) return;
    const nearX = ball.x >= this.paddleX - ball.r && ball.x <= this.paddleX + this.paddleW + ball.r;
    const nearY = ball.y + ball.r >= PADDLE_Y && ball.y - ball.r <= PADDLE_Y + PADDLE_H + 2;
    if (!nearX || !nearY) return;

    ball.y = PADDLE_Y - ball.r;
    if (this.catchMode) {
      ball.vx = 0;
      ball.vy = 0;
      ball.stuck = true;
      this.catchMode = false;
      this.events.onHitPaddle?.(ball.x, PADDLE_Y);
      return;
    }
    // точка попадания → управляемый угол (±62°)
    const t = Math.max(-1, Math.min(1, ((ball.x - this.paddleX) / this.paddleW) * 2 - 1));
    const speed = Math.max(speedOf(ball), 66) * (1 + BALL_SPEED_STEP * 0.35);
    const angle = t * ((62 * Math.PI) / 180);
    ball.vx = Math.sin(angle) * speed;
    ball.vy = -Math.cos(angle) * speed;
    clampAngle(ball);
    this.combo = 0;
    this.comboMult = 1;
    this.events.onHitPaddle?.(ball.x, PADDLE_Y);
  }

  private collideBricks(ball: Ball): void {
    for (const b of this.bricks) {
      if (!b.alive) continue;
      const nx = Math.max(b.x, Math.min(ball.x, b.x + b.w));
      const ny = Math.max(b.y, Math.min(ball.y, b.y + b.h));
      const dx = ball.x - nx;
      const dy = ball.y - ny;
      if (dx * dx + dy * dy > ball.r * ball.r) continue;

      if (dx === 0 && dy === 0) {
        // мяч внутри кирпича — выбрасываем по меньшей оси
        const cx = ball.x - (b.x + b.w / 2);
        const cy = ball.y - (b.y + b.h / 2);
        if (Math.abs(cx) / b.w > Math.abs(cy) / b.h) {
          ball.x = b.x + b.w / 2 + Math.sign(cx || 1) * (b.w / 2 + ball.r);
          ball.vx = Math.sign(cx || 1) * Math.abs(ball.vx);
        } else {
          ball.y = b.y + b.h / 2 + Math.sign(cy || 1) * (b.h / 2 + ball.r);
          ball.vy = Math.sign(cy || 1) * Math.abs(ball.vy);
        }
      } else {
        const overlapX = ball.r - Math.abs(dx);
        const overlapY = ball.r - Math.abs(dy);
        if (overlapX < overlapY) {
          ball.x = nx + Math.sign(dx || 1) * ball.r;
          ball.vx = Math.sign(dx || 1) * Math.abs(ball.vx);
        } else {
          ball.y = ny + Math.sign(dy || 1) * ball.r;
          ball.vy = Math.sign(dy || 1) * Math.abs(ball.vy);
        }
      }
      clampAngle(ball);
      this.hitBrick(b);
      return;
    }
  }

  private hitBrick(b: Brick): void {
    b.hitFlash = 0.12;
    if (b.solid) {
      this.events.onHitBrick?.(b, false);
      return;
    }
    b.hp -= 1;
    const destroyed = b.hp <= 0;
    if (destroyed) b.alive = false;

    this.combo += 1;
    const mult = Math.min(8, 1 + Math.floor(this.combo / 4));
    if (mult > this.comboMult) {
      this.comboMult = mult;
      this.events.onCombo?.(mult);
    }
    this.bestCombo = Math.max(this.bestCombo, this.comboMult);

    if (destroyed) {
      this.score += BRICK_SCORE[b.type] * this.comboMult;
      const chance = this.level.dropChance ?? DROP_CHANCE;
      if (rand() < chance && this.drops.length < MAX_DROPS) this.spawnDrop(b);
    }
    // мяч понемногу ускоряется
    for (const ball of this.balls) if (ball.alive && !ball.stuck) accelerate(ball, BALL_SPEED_STEP * 0.5);
    this.events.onHitBrick?.(b, destroyed);
  }

  private spawnDrop(b: Brick): void {
    this.drops.push({
      x: b.x + b.w / 2 - DROP_W / 2,
      y: b.y,
      kind: rollDropKind(this.bossAlive, this.chapterIndex),
      alive: true,
    });
  }

  private updateDrops(dt: number): void {
    for (const d of this.drops) {
      d.y += DROP_SPEED * dt;
      const onPaddle =
        d.y + DROP_H >= PADDLE_Y && d.y <= PADDLE_Y + PADDLE_H && d.x + DROP_W >= this.paddleX && d.x <= this.paddleX + this.paddleW;
      if (onPaddle) {
        d.alive = false;
        this.applyDrop(d.kind);
      } else if (d.y > FIELD_H) {
        d.alive = false;
      }
    }
    this.drops = this.drops.filter((d) => d.alive);
  }

  private applyDrop(kind: DropKind): void {
    const def = POWERUP_DEFS[kind];
    this.events.onPowerup?.(kind);
    switch (kind) {
      case "multiball": {
        const src = this.balls.find((b) => b.alive && !b.stuck) ?? this.balls.find((b) => b.alive);
        if (!src) {
          this.effects.push({ kind: "widen", timeLeft: def.duration, duration: def.duration });
          break;
        }
        const add = Math.max(1, Math.min(2, MAX_BALLS - this.balls.filter((b) => b.alive).length));
        for (let i = 0; i < add; i++) this.balls.push(cloneBall(src, i === 0 ? 32 : -32));
        break;
      }
      case "widen":
      case "guard":
      case "slow":
      case "curse":
        this.addEffect(kind, def.duration);
        break;
      case "cut":
        for (const b of this.bricks) {
          if (b.alive && !b.solid && b.hp > 1) {
            b.hp -= 1;
            b.hitFlash = 0.1;
          }
        }
        this.shake = 0.1;
        break;
      case "life":
        this.lives = Math.min(MAX_LIVES, this.lives + 1);
        break;
      case "catch":
        this.catchMode = true;
        break;
    }
    this.refreshPaddleWidth();
  }

  private addEffect(kind: ActiveEffect["kind"], duration: number): void {
    const existing = this.effects.find((e) => e.kind === kind);
    if (existing) existing.timeLeft = Math.min(duration * 2, existing.timeLeft + duration);
    else this.effects.push({ kind, timeLeft: duration, duration });
  }

  private loseLife(): void {
    this.lives -= 1;
    this.combo = 0;
    this.comboMult = 1;
    this.catchMode = false;
    this.effects = [];
    this.refreshPaddleWidth();
    this.events.onLoseBall?.(this.lives);
    if (this.lives <= 0) {
      this.phase = "gameover";
      this.events.onGameOver?.();
      return;
    }
    this.resetBalls();
  }

  // ------------------------------------------------------------------ босс

  private updateBoss(dt: number): void {
    this.bossAttackT -= dt;
    if (this.bossAttackT <= 0) {
      this.bossAttackT = 4 + rand() * 2.5;
      this.spawnBossSalvo();
    }
  }

  private spawnBossSalvo(): void {
    const n = 3 + Math.floor(rand() * 3);
    const y0 = BOARD_TOP + 6 * (BRICK_H + BRICK_GAP) + 10;
    for (let i = 0; i < n; i++) {
      const a = ((90 + (i - (n - 1) / 2) * 18) * Math.PI) / 180;
      this.bossShots.push({ x: FIELD_W / 2, y: y0, vx: Math.cos(a) * 58, vy: Math.sin(a) * 58 });
    }
    this.showBanner("ОН УЛЫБАЕТСЯ", undefined, 1.1);
  }

  private updateBossShots(dt: number): void {
    const hitPaddle = (s: BossShot) =>
      s.y >= PADDLE_Y - 2 && s.y <= PADDLE_Y + PADDLE_H && s.x >= this.paddleX && s.x <= this.paddleX + this.paddleW;
    const nearBall = (s: BossShot) =>
      this.balls.some((b) => b.alive && !b.stuck && Math.hypot(b.x - s.x, b.y - s.y) < b.r + 2.5);

    this.bossShots = this.bossShots.filter((s) => {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y > FIELD_H + 2) return false;
      if (nearBall(s)) return false;
      if (hitPaddle(s)) {
        this.score = Math.max(0, this.score - 30);
        this.shake = 0.12;
        return false;
      }
      return true;
    });
  }

  /** Удар мячом по лицу — когда отскакивает от верхней стены в зоне лица. */
  private hitBoss(ball: Ball): void {
    if (!this.bossAlive) return;
    const cx = FIELD_W / 2;
    if (Math.abs(ball.x - cx) <= 22) {
      this.bossHp -= 1;
      this.bossHurt = 0.15;
      this.shake = 0.1;
      this.flash = 0.1;
      this.events.onBossHurt?.(this.bossHp);
      if (this.bossHp <= 0) this.bossShots = [];
    }
  }
}
