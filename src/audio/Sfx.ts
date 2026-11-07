/** Звук: синтез через Web Audio, без файлов. Контекст создаётся по первому жесту (iOS). */
export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = true;
  volume = 0.6;

  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? this.volume * 0.35 : 0;
    this.master.connect(this.ctx.destination);
    void this.ctx.resume();
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.master) this.master.gain.value = this.enabled ? v * 0.35 : 0;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (this.master) this.master.gain.value = on ? this.volume * 0.35 : 0;
  }

  private blip(freq: number, dur: number, type: OscillatorType = "square", slideTo?: number, gain = 1): void {
    if (!this.ctx || !this.master || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5 * gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  wall(): void {
    this.blip(170, 0.05, "square", 140, 0.5);
  }
  paddle(): void {
    this.blip(320, 0.06, "square", 420, 0.7);
  }
  brick(): void {
    this.blip(520, 0.06, "square", 300, 0.8);
  }
  brickBreak(): void {
    this.blip(660, 0.09, "triangle", 240, 0.7);
  }
  powerup(): void {
    this.blip(480, 0.08, "triangle", 960, 0.7);
    setTimeout(() => this.blip(720, 0.1, "triangle", 1200, 0.6), 70);
  }
  lifeLost(): void {
    this.blip(240, 0.35, "sawtooth", 70, 0.8);
  }
  gameOver(): void {
    this.blip(180, 0.6, "triangle", 60, 1);
    setTimeout(() => this.blip(120, 0.9, "triangle", 40, 0.9), 180);
  }
  win(): void {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.blip(f, 0.16, "triangle", undefined, 0.7), i * 110));
  }
  bossHurt(): void {
    this.blip(110, 0.18, "sawtooth", 60, 1);
  }
  click(): void {
    this.blip(600, 0.04, "square", 700, 0.5);
  }
}

export const sfx = new Sfx();
