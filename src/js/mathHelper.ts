import type { Vector2D } from '../types';

export class MathHelper {
  randomInteger(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
  }

  lerp(a: number, b: number, n: number): number {
    return a + ((b - a) * n);
  }

  scaleVector(v: Vector2D, s: number): void {
    v.x *= s;
    v.y *= s;
  }

  normalizeVector(v: Vector2D): void {
    const m = Math.sqrt(v.x * v.x + v.y * v.y);
    this.scaleVector(v, 1 / m);
  }

  dist(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
