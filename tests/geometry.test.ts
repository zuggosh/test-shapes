import { describe, expect, it } from 'vitest';
import { PolygonClipper } from '../src/geometry/PolygonClipper';
import { polygonArea, polygonBounds, regularPolygon, transformPoints } from '../src/geometry/polygon';

const square = [-10, -10, 10, -10, 10, 10, -10, 10]; // 20×20, area 400
const rect = { x: 0, y: 0, width: 100, height: 100 };

describe('polygon', () => {
  it('computes the area of a square', () => {
    expect(polygonArea(square)).toBe(400);
  });

  it('is orientation independent', () => {
    const reversed = [-10, 10, 10, 10, 10, -10, -10, -10];
    expect(polygonArea(reversed)).toBe(400);
  });

  it('approximates a circle with a fine regular polygon', () => {
    expect(polygonArea(regularPolygon(256, 10))).toBeCloseTo(Math.PI * 100, 0);
  });

  it('applies scale then rotation', () => {
    const p = transformPoints([1, 0], 2, 1, Math.PI / 2);
    expect(p[0]).toBeCloseTo(0);
    expect(p[1]).toBeCloseTo(2);
  });

  it('computes bounds', () => {
    expect(polygonBounds(square)).toEqual({ minX: -10, minY: -10, maxX: 10, maxY: 10 });
  });
});

describe('PolygonClipper', () => {
  const clipper = new PolygonClipper();

  it('keeps the full area when fully inside', () => {
    expect(clipper.clippedArea(square, 50, 50, rect)).toBe(400);
  });

  it('returns 0 when fully outside', () => {
    expect(clipper.clippedArea(square, 50, -50, rect)).toBe(0);
  });

  it('clips half a shape crossing the top edge', () => {
    expect(clipper.clippedArea(square, 50, 0, rect)).toBe(200);
  });

  it('clips a quarter at a corner', () => {
    expect(clipper.clippedArea(square, 100, 100, rect)).toBe(100);
  });

  it('is reusable across calls (scratch buffers)', () => {
    clipper.clippedArea(regularPolygon(64, 30), 0, 0, rect);
    expect(clipper.clippedArea(square, 50, 0, rect)).toBe(200);
  });
});
