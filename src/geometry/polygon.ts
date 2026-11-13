import type { Bounds } from '../model/types';

/** Shoelace formula. Returns the absolute area of a flat [x,y,...] polygon. */
export function polygonArea(points: ArrayLike<number>, length = points.length): number {
  if (length < 6) return 0;
  let sum = 0;
  let px = points[length - 2];
  let py = points[length - 1];
  for (let i = 0; i < length; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    sum += px * y - x * py;
    px = x;
    py = y;
  }
  return Math.abs(sum) / 2;
}

export function polygonBounds(points: ArrayLike<number>): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

/** Applies scale then rotation (same order as a Pixi local transform). */
export function transformPoints(
  points: readonly number[],
  scaleX: number,
  scaleY: number,
  rotation: number,
): number[] {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const out = new Array<number>(points.length);
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i] * scaleX;
    const y = points[i + 1] * scaleY;
    out[i] = x * cos - y * sin;
    out[i + 1] = x * sin + y * cos;
  }
  return out;
}

/** Regular polygon on the unit circle, first vertex pointing up. */
export function regularPolygon(sides: number, radius = 1): number[] {
  const out: number[] = [];
  for (let i = 0; i < sides; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / sides;
    out.push(Math.cos(a) * radius, Math.sin(a) * radius);
  }
  return out;
}

export function starPolygon(spikes: number, outer = 1, inner = 0.45): number[] {
  const out: number[] = [];
  const total = spikes * 2;
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / spikes;
    out.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  return out;
}
