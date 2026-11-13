import { SETTINGS } from '../config/settings';
import type { Random } from '../core/Random';
import { regularPolygon, starPolygon } from '../geometry/polygon';
import { ShapeType, type ShapeGeometry } from '../model/types';
import { buildGeometry, type ShapeGenerator } from './ShapeGenerator';

const TAU = Math.PI * 2;

/** 3, 4, 5, 6 sides. Unit geometry is shared on the GPU, size comes from scale. */
export class RegularPolygonGenerator implements ShapeGenerator {
  private readonly unit: number[];
  private readonly key: string;

  constructor(
    readonly type: ShapeType,
    sides: number,
  ) {
    this.unit = regularPolygon(sides);
    this.key = `polygon-${sides}`;
  }

  generate(rng: Random, size: number): ShapeGeometry {
    return buildGeometry({
      type: this.type,
      path: { kind: 'polygon', points: this.unit },
      contextKey: this.key,
      outline: this.unit,
      scaleX: size,
      scaleY: size,
      rotation: rng.range(0, TAU),
    });
  }
}

export class StarGenerator implements ShapeGenerator {
  readonly type = ShapeType.Star;
  private readonly unit = starPolygon(5, 1, 0.45);

  generate(rng: Random, size: number): ShapeGeometry {
    return buildGeometry({
      type: this.type,
      path: { kind: 'polygon', points: this.unit },
      contextKey: 'star-5',
      outline: this.unit,
      scaleX: size,
      scaleY: size,
      rotation: rng.range(0, TAU),
    });
  }
}

/**
 * PixiJS tessellates circles based on their radius, so a radius-1 circle scaled up
 * would look faceted. The shared circle is drawn at a base radius close to the
 * real on-screen size and scaled from there.
 */
const CIRCLE_BASE_RADIUS = 64;
/** Circle outline used only for maths (the renderer draws a real circle). */
const CIRCLE_OUTLINE = regularPolygon(SETTINGS.shape.curveSegments, CIRCLE_BASE_RADIUS);
const CIRCLE_PATH = { kind: 'circle', radius: CIRCLE_BASE_RADIUS } as const;

export class CircleGenerator implements ShapeGenerator {
  readonly type = ShapeType.Circle;

  generate(_rng: Random, size: number): ShapeGeometry {
    const scale = size / CIRCLE_BASE_RADIUS;
    return buildGeometry({
      type: this.type,
      path: CIRCLE_PATH,
      contextKey: 'circle',
      outline: CIRCLE_OUTLINE,
      scaleX: scale,
      scaleY: scale,
      exactArea: Math.PI * size * size,
    });
  }
}

/** Ellipse = the shared unit circle with a non-uniform scale (same GPU geometry). */
export class EllipseGenerator implements ShapeGenerator {
  readonly type = ShapeType.Ellipse;

  generate(rng: Random, size: number): ShapeGeometry {
    const rx = size;
    const ry = size * rng.range(0.45, 0.7);
    return buildGeometry({
      type: this.type,
      path: CIRCLE_PATH,
      contextKey: 'circle',
      outline: CIRCLE_OUTLINE,
      scaleX: rx / CIRCLE_BASE_RADIUS,
      scaleY: ry / CIRCLE_BASE_RADIUS,
      rotation: rng.range(0, Math.PI),
      exactArea: Math.PI * rx * ry,
    });
  }
}

/**
 * Genuinely random irregular shape (bonus 3a).
 * Random vertex count, random angular jitter and random radius per vertex.
 * Vertices are ordered by angle around the origin, so the outline is star-shaped
 * and never self-intersects. Half of the shapes are smoothed into organic "blobs"
 * (closed quadratic B-spline sampled into a dense polygon — drawn == measured).
 */
export class IrregularGenerator implements ShapeGenerator {
  readonly type = ShapeType.Irregular;

  generate(rng: Random, size: number): ShapeGeometry {
    const count = rng.int(5, 11);
    const step = TAU / count;
    const start = rng.range(0, TAU);
    const control: number[] = [];
    for (let i = 0; i < count; i++) {
      const angle = start + i * step + rng.range(-0.38, 0.38) * step;
      const radius = size * rng.range(0.4, 1);
      control.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }

    const points = rng.chance(0.5) ? smoothClosed(control, 6) : control;
    return buildGeometry({
      type: this.type,
      path: { kind: 'polygon', points },
      contextKey: null,
      outline: points,
    });
  }
}

/** Samples a closed curve through edge midpoints using vertices as quadratic controls. */
function smoothClosed(points: readonly number[], samplesPerSegment: number): number[] {
  const n = points.length / 2;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const prev = ((i - 1 + n) % n) * 2;
    const curr = i * 2;
    const next = ((i + 1) % n) * 2;
    const sx = (points[prev] + points[curr]) / 2;
    const sy = (points[prev + 1] + points[curr + 1]) / 2;
    const ex = (points[curr] + points[next]) / 2;
    const ey = (points[curr + 1] + points[next + 1]) / 2;
    const cx = points[curr];
    const cy = points[curr + 1];
    for (let s = 0; s < samplesPerSegment; s++) {
      const t = s / samplesPerSegment;
      const u = 1 - t;
      out.push(u * u * sx + 2 * u * t * cx + t * t * ex, u * u * sy + 2 * u * t * cy + t * t * ey);
    }
  }
  return out;
}
