import type { Rect } from '../model/types';
import { polygonArea } from './polygon';

const LEFT = 0;
const RIGHT = 1;
const TOP = 2;
// Edge 3 is BOTTOM (handled by the default branches below).

/**
 * Sutherland–Hodgman clipping of a polygon against an axis-aligned rectangle.
 * Works on reusable scratch buffers, so a steady-state frame allocates nothing.
 * Valid for any simple polygon clipped by a convex window (our case).
 */
export class PolygonClipper {
  private bufferA: number[] = [];
  private bufferB: number[] = [];

  /** Area of `points` (translated by ox, oy) that lies inside `rect`. */
  clippedArea(points: readonly number[], ox: number, oy: number, rect: Rect): number {
    let input = this.bufferA;
    let output = this.bufferB;
    let inputLength = points.length;
    for (let i = 0; i < inputLength; i += 2) {
      input[i] = points[i] + ox;
      input[i + 1] = points[i + 1] + oy;
    }

    const left = rect.x;
    const right = rect.x + rect.width;
    const top = rect.y;
    const bottom = rect.y + rect.height;

    for (let edge = 0; edge < 4; edge++) {
      if (inputLength < 6) return 0;
      const boundary = edge === LEFT ? left : edge === RIGHT ? right : edge === TOP ? top : bottom;
      let outputLength = 0;

      let px = input[inputLength - 2];
      let py = input[inputLength - 1];
      let prevInside = isInside(edge, px, py, boundary);

      for (let i = 0; i < inputLength; i += 2) {
        const cx = input[i];
        const cy = input[i + 1];
        const currInside = isInside(edge, cx, cy, boundary);

        if (currInside !== prevInside) {
          // Edge crosses the boundary — emit the intersection point.
          if (edge === LEFT || edge === RIGHT) {
            const t = (boundary - px) / (cx - px);
            output[outputLength++] = boundary;
            output[outputLength++] = py + t * (cy - py);
          } else {
            const t = (boundary - py) / (cy - py);
            output[outputLength++] = px + t * (cx - px);
            output[outputLength++] = boundary;
          }
        }
        if (currInside) {
          output[outputLength++] = cx;
          output[outputLength++] = cy;
        }
        px = cx;
        py = cy;
        prevInside = currInside;
      }

      const swap = input;
      input = output;
      output = swap;
      inputLength = outputLength;
    }

    return polygonArea(input, inputLength);
  }
}

function isInside(edge: number, x: number, y: number, boundary: number): boolean {
  switch (edge) {
    case LEFT:
      return x >= boundary;
    case RIGHT:
      return x <= boundary;
    case TOP:
      return y >= boundary;
    default:
      return y <= boundary;
  }
}
