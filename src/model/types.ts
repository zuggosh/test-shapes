export const ShapeType = {
  Triangle: 'triangle',
  Square: 'square',
  Pentagon: 'pentagon',
  Hexagon: 'hexagon',
  Circle: 'circle',
  Ellipse: 'ellipse',
  Star: 'star',
  Irregular: 'irregular',
} as const;
export type ShapeType = (typeof ShapeType)[keyof typeof ShapeType];

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Renderer-agnostic description of what to draw. */
export type ShapePath =
  | { readonly kind: 'polygon'; readonly points: readonly number[] }
  | { readonly kind: 'circle'; readonly radius: number };

/**
 * Immutable geometry of a shape, defined once at generation time.
 *
 * `path` is drawn either in unit space (shared, cached GPU geometry — `contextKey` set)
 * and then transformed by scale/rotation, or directly in px (unique shapes, `contextKey` null).
 * `polygon` is the same outline already transformed into local px space and is the single
 * source of truth for bounds, clipping and area maths.
 */
export interface ShapeGeometry {
  readonly type: ShapeType;
  readonly path: ShapePath;
  readonly contextKey: string | null;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly rotation: number;
  /** Flat [x0, y0, x1, y1, ...] in local px, centred on the shape origin. */
  readonly polygon: readonly number[];
  readonly bounds: Bounds;
  /** Exact area in px² (analytic for circle/ellipse). */
  readonly area: number;
  /** exactArea / polygonArea — corrects clipped areas of curved shapes. */
  readonly areaCorrection: number;
}

export interface ShapeSpec {
  readonly geometry: ShapeGeometry;
  readonly color: number;
}

export interface Stats {
  /** Shapes currently (at least partially) visible inside the rectangle. */
  readonly count: number;
  /** Visible surface area in px² (overlaps are summed, not unioned). */
  readonly area: number;
}

export interface SettingsSnapshot {
  readonly gravity: number;
  readonly spawnRate: number;
}
