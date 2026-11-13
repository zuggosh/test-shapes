import { PolygonClipper } from '../geometry/PolygonClipper';
import type { ShapeModel } from '../model/ShapeModel';
import type { Rect, Stats } from '../model/types';

/**
 * Computes how many shapes are visible and the surface they cover inside the rectangle.
 * Fast path: shapes fully inside use the precomputed area, fully outside count as 0;
 * only shapes crossing an edge (usually 1–3) are clipped (Sutherland–Hodgman).
 */
export class StatsSystem {
  private readonly clipper = new PolygonClipper();

  compute(shapes: readonly ShapeModel[], rect: Rect): Stats {
    const right = rect.x + rect.width;
    const bottom = rect.y + rect.height;
    let count = 0;
    let area = 0;

    for (let i = 0; i < shapes.length; i++) {
      const s = shapes[i];
      const top = s.top;
      const bot = s.bottom;
      const left = s.left;
      const rgt = s.right;

      if (bot <= rect.y || top >= bottom || rgt <= rect.x || left >= right) continue;

      if (top >= rect.y && bot <= bottom && left >= rect.x && rgt <= right) {
        area += s.geometry.area;
        count++;
        continue;
      }

      const visible = this.clipper.clippedArea(s.geometry.polygon, s.x, s.y, rect) * s.geometry.areaCorrection;
      if (visible > 0) {
        area += visible;
        count++;
      }
    }

    return { count, area: Math.round(area) };
  }
}
