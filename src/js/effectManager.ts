import type { GameStatus, GameVariables } from '../types';
import type { Settings } from './settings';
import type { MathHelper } from './mathHelper';

interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  l: number;
  a: number;
}

export class EffectManager {
  private canvas: HTMLCanvasElement;
  private gameStatus: GameStatus;
  private settings: Settings;
  private mathHelper: MathHelper;
  private gameVariables: GameVariables;
  private drops: Drop[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    gameStatus: GameStatus,
    gameVariables: GameVariables,
    mathHelper: MathHelper,
    settings: Settings
  ) {
    this.canvas = canvas;
    this.gameStatus = gameStatus;
    this.mathHelper = mathHelper;
    this.settings = settings;
    this.gameVariables = gameVariables;

    this.initDrops();
  }

  private initDrops(): void {
    this.drops = [];
    for (let i = 0; i < this.settings.dropCount; i++) {
      const drop = {} as Drop;
      this.resetDrop(drop);
      drop.y = this.mathHelper.randomInteger(0, this.gameStatus.originalHeight);
      this.drops.push(drop);
    }
  }

  private resetDrop(drop: Drop): void {
    const scale = Math.random();
    drop.x = this.mathHelper.randomInteger(-this.settings.dropXBuffer, this.gameStatus.originalWidth + this.settings.dropXBuffer);
    drop.vx = this.settings.windVelocity;
    drop.vy = this.mathHelper.lerp(this.settings.dropMinVelocity, this.settings.dropMaxVelocity, scale);
    drop.l = this.mathHelper.lerp(this.settings.dropMinLength, this.settings.dropMaxLength, scale);
    drop.a = this.mathHelper.lerp(this.settings.dropMinAlpha, this.settings.dropMaxAlpha, scale);
    drop.y = this.mathHelper.randomInteger(-drop.l, 0);
  }

  private updateDrops(dt: number): void {
    for (let i = this.drops.length - 1; i >= 0; --i) {
      const drop = this.drops[i];
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;

      if (drop.y > this.gameStatus.originalHeight + drop.l) {
        this.resetDrop(drop);
      }
    }
  }

  drawEffect(dt: number): void {
    const effect = this.gameVariables.mapsEffects[this.gameVariables.currentMap];
    switch (effect) {
      case 'RAIN':
        this.updateDrops(dt);
        this.drawRain();
        break;
      default:
        break;
    }
  }

  private drawRain(): void {
    const ctx = this.canvas.getContext('2d')!;
    ctx.save();

    ctx.strokeStyle = this.settings.rainColor;
    ctx.lineWidth = this.settings.dropWidth;
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < this.drops.length; ++i) {
      const drop = this.drops[i];

      const x1 = Math.round(drop.x);
      const y1 = Math.round(drop.y);

      const v = { x: drop.vx, y: drop.vy };

      this.mathHelper.normalizeVector(v);
      this.mathHelper.scaleVector(v, -drop.l);

      const x2 = Math.round(x1 + v.x);
      const y2 = Math.round(y1 + v.y);

      ctx.globalAlpha = drop.a;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.closePath();
    }
    ctx.restore();
  }
}
