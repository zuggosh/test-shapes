import { GraphicsContext } from 'pixi.js';
import { THEME } from '../config/theme';
import type { ShapePath } from '../model/types';

/**
 * Shared GPU geometry (PixiJS v8 GraphicsContext).
 * Standard shapes are drawn ONCE in white, unit size; every instance reuses the context
 * and gets its size via scale and its colour via `tint` — no per-shape tessellation.
 * Unique (irregular) shapes get their own context, destroyed when the shape dies.
 */
export class GraphicsContextCache {
  private readonly shared = new Map<string, GraphicsContext>();
  /** Placeholder assigned to pooled, inactive views. */
  readonly empty = new GraphicsContext();

  getShared(key: string, path: ShapePath): GraphicsContext {
    let context = this.shared.get(key);
    if (!context) {
      context = this.build(path);
      this.shared.set(key, context);
    }
    return context;
  }

  createUnique(path: ShapePath): GraphicsContext {
    return this.build(path);
  }

  destroy(): void {
    for (const context of this.shared.values()) context.destroy();
    this.shared.clear();
    this.empty.destroy();
  }

  private build(path: ShapePath): GraphicsContext {
    const context = new GraphicsContext();
    if (path.kind === 'circle') {
      context.circle(0, 0, path.radius);
    } else {
      context.poly(path.points as number[], true);
    }
    return context.fill(THEME.color.white);
  }
}
