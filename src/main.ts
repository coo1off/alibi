import "./style.css";
import { FIELD_H, FIELD_W, HUD_W } from "./game/constants";
import { Game } from "./game/Game";
import { chapters, levelAt } from "./game/systems/levels";
import { POWERUP_DEFS } from "./game/systems/Powerups";
import type { DropKind } from "./game/entities";
import { PALETTES, type Palette } from "./render/palette";
import { computeLayout, createCanvases } from "./render/canvas";
import { FieldRenderer } from "./render/field";
import { HUD_LOGICAL_H, Hud } from "./render/hud";
import {
  type Hit,
  drawClear,
  drawGameOver,
  drawHowto,
  drawPause,
  drawTitle,
  drawVictory,
} from "./render/screens";
import { Input } from "./input/Input";
import { sfx } from "./audio/Sfx";
import { loadSave, writeSave, type SaveData } from "./storage/Save";

type Mode = "title" | "howto" | "game" | "pause" | "clear" | "gameover" | "victory";

class App {
  private fieldHost = document.getElementById("game-host")!;
  private hudHost = document.getElementById("hud")!;
  private canvases = createCanvases(this.fieldHost, this.hudHost);
  private renderer = new FieldRenderer(this.canvases.fieldCtx);
  private hud = new Hud(this.canvases.hudCtx);
  private save: SaveData = loadSave();

  private mode: Mode = "title";
  private game: Game | null = null;
  private chapterIndex = 0;
  private levelIndex = 0;
  private hits: Hit[] = [];
  private t = 0;
  private comboFlash = 0;

  constructor() {
    sfx.setEnabled(this.save.settings.sound);
    sfx.setVolume(this.save.settings.volume);
    this.resize();
    window.addEventListener("resize", () => this.resize());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.mode === "game" && this.game) this.openPause();
    });

    this.attachInput();
    this.attachKeys();
    this.mode = this.save.seenHowto ? "title" : "howto";

    // dev-хук: ?level=3-1 (глава-уровень, 1-based) или ?level=boss — для проверки поздних глав
    const jump = new URLSearchParams(location.search).get("level");
    if (jump) {
      const chs = chapters();
      let ci = 0;
      let li = 0;
      const m = /^(\d+)-(\d+)$/.exec(jump);
      if (jump === "boss") {
        ci = chs.length - 1;
        li = chs[ci].levels.length - 1;
      } else if (m) {
        ci = Math.min(chs.length - 1, Math.max(0, Number(m[1]) - 1));
        li = Math.min(chs[ci].levels.length - 1, Math.max(0, Number(m[2]) - 1));
      }
      this.chapterIndex = ci;
      this.levelIndex = li;
      this.loadLevel();
    }

    requestAnimationFrame(this.frame);
  }

  // ------------------------------------------------------------------ размеры

  private resize(): void {
    const app = document.getElementById("app")!;
    const cs = getComputedStyle(app);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const availW = Math.max(120, window.innerWidth - padX);
    const availH = Math.max(160, window.innerHeight - padY);
    const layout = computeLayout(availW, availH, HUD_LOGICAL_H);

    const f = this.canvases.field;
    f.style.width = `${layout.fieldW}px`;
    f.style.height = `${layout.fieldH}px`;
    const h = this.canvases.hud;
    h.width = HUD_W;
    h.height = HUD_LOGICAL_H;
    this.canvases.hudCtx.imageSmoothingEnabled = false;
    h.style.width = `${layout.hudW}px`;
    h.style.height = `${layout.hudH}px`;

    const rotate = document.getElementById("rotate-overlay")!;
    rotate.hidden = !layout.landscape;
  }

  private palette(): Palette {
    return PALETTES[chapters()[Math.min(this.chapterIndex, chapters().length - 1)].palette];
  }

  // ------------------------------------------------------------------ ввод

  private toLogical = (clientX: number, clientY: number) => {
    const r = this.canvases.field.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / Math.max(1, r.width)) * FIELD_W,
      y: ((clientY - r.top) / Math.max(1, r.height)) * FIELD_H,
    };
  };

  private attachInput(): void {
    new Input(
      this.canvases.field,
      this.toLogical,
      {
        onMoves: (x) => {
          sfx.unlock();
          if ((this.mode === "game" || this.mode === "pause") && this.game) this.game.movePaddleTo(x);
        },
        onTap: (x, y) => this.tapField(x, y),
      },
    );

    this.canvases.field.addEventListener("pointerdown", () => sfx.unlock(), { passive: true });

    this.canvases.hud.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      sfx.unlock();
      const r = this.canvases.hud.getBoundingClientRect();
      const lx = ((e.clientX - r.left) / Math.max(1, r.width)) * HUD_W;
      const ly = ((e.clientY - r.top) / Math.max(1, r.height)) * HUD_LOGICAL_H;
      if (this.hud.buttons.some((b) => b.id === "pause" && lx >= b.x && ly >= b.y - 4 && ly <= b.y + b.h + 4)) this.togglePause();
      else if (this.hud.buttons.some((b) => b.id === "sound" && lx >= b.x && ly >= b.y - 4 && ly <= b.y + b.h + 4)) this.toggleSound();
    });
  }

  private attachKeys(): void {
    window.addEventListener("keydown", (e) => {
      sfx.unlock();
      const g = this.game;
      switch (e.code) {
        case "Space":
        case "Enter":
          e.preventDefault();
          if (this.mode === "game" && g) g.launchBalls();
          else if (this.mode === "title" || this.mode === "howto") this.startRun();
          else if (this.mode === "pause") this.resume();
          else if (this.mode === "clear") this.nextLevel();
          else if (this.mode === "gameover") this.restartLevel();
          break;
        case "Escape":
        case "KeyP":
          if (this.mode === "game") this.openPause();
          else if (this.mode === "pause") this.resume();
          break;
        case "ArrowLeft":
        case "KeyA":
          if (g && this.mode === "game") g.nudgePaddle(-12);
          break;
        case "ArrowRight":
        case "KeyD":
          if (g && this.mode === "game") g.nudgePaddle(12);
          break;
        case "KeyM":
          this.toggleSound();
          break;
        default:
          break;
      }
    });
  }

  private tapField(x: number, y: number): void {
    if (y > FIELD_H) return;
    switch (this.mode) {
      case "title":
        this.hitButton(x, y) ?? this.startRun();
        break;
      case "howto":
        this.hitButton(x, y);
        break;
      case "game":
        this.game?.launchBalls();
        break;
      case "pause": {
        const id = this.hitButton(x, y);
        if (id === "resume") this.resume();
        else if (id === "restart") this.restartLevel();
        else if (id === "menu") this.toMenu();
        break;
      }
      case "clear": {
        const id = this.hitButton(x, y);
        if (id === "next" || !id) this.nextLevel();
        break;
      }
      case "gameover": {
        const id = this.hitButton(x, y);
        if (id === "menu") this.toMenu();
        else if (id === "retry" || !id) this.restartLevel();
        break;
      }
      case "victory": {
        this.hitButton(x, y);
        this.toMenu();
        break;
      }
      default:
        break;
    }
  }

  private hitButton(x: number, y: number): string | null {
    for (const h of this.hits) {
      if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
        sfx.click();
        this.onButton(h.id);
        return h.id;
      }
    }
    return null;
  }

  private onButton(id: string): void {
    switch (id) {
      case "play":
        this.startRun();
        break;
      case "howto":
        this.mode = "howto";
        break;
      case "back":
        this.mode = this.save.seenHowto ? "title" : "title";
        this.save.seenHowto = true;
        writeSave(this.save);
        break;
      default:
        break;
    }
  }

  // ------------------------------------------------------------------ состояния

  private startRun(): void {
    this.save.seenHowto = true;
    writeSave(this.save);
    this.chapterIndex = 0;
    this.levelIndex = 0;
    this.loadLevel();
  }

  private loadLevel(): void {
    const { level } = levelAt(this.chapterIndex, this.levelIndex);
    this.renderer.resetBackground();
    this.game = new Game(level, this.chapterIndex, this.levelIndex, this.events());
    this.game.showBanner(level.title.toUpperCase(), level.intro, 2.4);
    this.mode = "game";
  }

  private events() {
    return {
      onHitBrick: (_b: unknown, destroyed: boolean) => (destroyed ? sfx.brickBreak() : sfx.brick()),
      onHitPaddle: () => sfx.paddle(),
      onHitWall: () => sfx.wall(),
      onLoseBall: (lives: number) => {
        sfx.lifeLost();
        this.save.bestCombo = Math.max(this.save.bestCombo, this.game?.bestCombo ?? 0);
        if (lives > 0) this.vibrate(40);
      },
      onPowerup: (kind: DropKind) => {
        sfx.powerup();
        this.vibrate(12);
        const title = POWERUP_DEFS[kind].title;
        this.game?.showBanner(title.toUpperCase(), undefined, 0.9);
      },
      onCombo: (m: number) => {
        this.comboFlash = 0.35;
        void m;
      },
      onBossHurt: () => sfx.bossHurt(),
      onGameOver: () => {
        sfx.gameOver();
        if (this.game) {
          this.save.bestScore = Math.max(this.save.bestScore, this.game.score);
        }
        writeSave(this.save);
        this.mode = "gameover";
      },
      onLevelClear: () => {
        sfx.win();
        if (this.game) this.save.bestScore = Math.max(this.save.bestScore, this.game.score);
        writeSave(this.save);
        setTimeout(() => {
          if (this.mode === "game" || this.mode === "clear") this.mode = "clear";
        }, 900);
      },
    };
  }

  private nextLevel(): void {
    const ch = chapters()[this.chapterIndex];
    if (this.levelIndex + 1 < ch.levels.length) {
      this.levelIndex += 1;
      this.loadLevel();
    } else if (this.chapterIndex + 1 < chapters().length) {
      this.chapterIndex += 1;
      this.levelIndex = 0;
      this.loadLevel();
    } else {
      this.mode = "victory";
    }
  }

  private restartLevel(): void {
    // на проигрыше начинаем главу заново (progression по документам)
    this.loadLevel();
  }

  private toMenu(): void {
    this.mode = "title";
    this.game = null;
  }

  private openPause(): void {
    if (!this.game) return;
    this.game.pause();
    this.mode = "pause";
  }

  private resume(): void {
    this.game?.resume();
    this.mode = "game";
  }

  private togglePause(): void {
    if (this.mode === "game") this.openPause();
    else if (this.mode === "pause") this.resume();
    else if (this.mode === "title") this.startRun();
  }

  private toggleSound(): void {
    this.save.settings.sound = !this.save.settings.sound;
    sfx.setEnabled(this.save.settings.sound);
    writeSave(this.save);
  }

  private vibrate(ms: number): void {
    try {
      navigator.vibrate?.(ms);
    } catch {
      /* не критично */
    }
  }

  // ------------------------------------------------------------------ цикл

  private last = performance.now();
  private acc = 0;

  private frame = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;
    this.update(dt);
    this.render();
    requestAnimationFrame(this.frame);
  };

  private update(dt: number): void {
    if (this.comboFlash > 0) this.comboFlash = Math.max(0, this.comboFlash - dt);
    if ((this.mode === "game" || this.mode === "clear") && this.game) {
      this.acc += dt;
      while (this.acc >= 1 / 120) {
        this.game.update(1 / 120);
        this.acc -= 1 / 120;
      }
    }
  }

  private render(): void {
    const pal = this.palette();
    const fr = this.renderer;
    const ctx = this.canvases.fieldCtx;
    let hits: Hit[] = [];

    if (this.mode === "title") {
      hits = drawTitle(fr, pal, this.save.bestScore, this.t).hits;
      this.hud.draw(null, pal, this.save.settings.sound);
    } else if (this.mode === "howto") {
      hits = drawHowto(fr, pal).hits;
      this.hud.draw(null, pal, this.save.settings.sound);
    } else if (this.game) {
      fr.drawGame(this.game, pal, this.chapterIndex);
      this.hud.draw(this.game, pal, this.save.settings.sound, this.comboFlash);
      if (this.mode === "pause") hits = drawPause(fr, pal).hits;
      else if (this.mode === "clear") hits = drawClear(fr, pal, this.game).hits;
      else if (this.mode === "gameover") hits = drawGameOver(fr, pal, this.game, this.save.bestScore).hits;
      else if (this.mode === "victory") hits = drawVictory(fr, pal, this.game, this.t).hits;
      if (this.mode === "game" && this.game.phase === "ready") {
        ctx.fillStyle = "rgba(232,224,208,0.75)";
        ctx.font = 'normal 7px "Courier New", monospace';
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("ТАП — ЗАПУСТИТЬ МЯЧ", FIELD_W / 2, FIELD_H * 0.62);
      }
    }
    this.hits = hits;
  }
}

new App();
