import type { ShapeGeometry } from './types';

/** Mutable runtime state of one falling shape. Renderer-agnostic. */
export class ShapeModel {
  /** Vertical velocity, px/s. */
  vy = 0;

  constructor(
    readonly id: number,
    readonly geometry: ShapeGeometry,
    readonly color: number,
    public x: number,
    public y: number,
  ) {}

  get top(): number {
    return this.y + this.geometry.bounds.minY;
  }

  get bottom(): number {
    return this.y + this.geometry.bounds.maxY;
  }

  get left(): number {
    return this.x + this.geometry.bounds.minX;
  }

  get right(): number {
    return this.x + this.geometry.bounds.maxX;
  }
}
