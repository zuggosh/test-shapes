import type { Random } from '../core/Random';
import { polygonArea, polygonBounds, transformPoints } from '../geometry/polygon';
import type { ShapeGeometry, ShapePath, ShapeType } from '../model/types';

/** Strategy: one implementation per shape type. */
export interface ShapeGenerator {
  readonly type: ShapeType;
  /** @param size circumradius in px */
  generate(rng: Random, size: number): ShapeGeometry;
}

interface GeometryInput {
  type: ShapeType;
  path: ShapePath;
  contextKey: string | null;
  /** Outline in the same space as `path` (unit space for shared shapes). */
  outline: readonly number[];
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  /** Analytic area override (circles / ellipses). */
  exactArea?: number;
}

/** Builds the immutable geometry record; shared by all generators. */
export function buildGeometry(input: GeometryInput): ShapeGeometry {
  const scaleX = input.scaleX ?? 1;
  const scaleY = input.scaleY ?? 1;
  const rotation = input.rotation ?? 0;
  const polygon = transformPoints(input.outline, scaleX, scaleY, rotation);
  const polyArea = polygonArea(polygon);
  const area = input.exactArea ?? polyArea;
  return {
    type: input.type,
    path: input.path,
    contextKey: input.contextKey,
    scaleX,
    scaleY,
    rotation,
    polygon,
    bounds: polygonBounds(polygon),
    area,
    areaCorrection: polyArea > 0 ? area / polyArea : 1,
  };
}
