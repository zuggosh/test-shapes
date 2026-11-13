export interface RangeSetting {
  readonly initial: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

/** Central tunables. Everything that is a "magic number" lives here. */
export const SETTINGS = {
  /** Shapes generated per second (task: default 1). */
  spawnRate: { initial: 1, min: 0, max: 10, step: 1 } satisfies RangeSetting,
  /** Gravity value shown in the UI (unitless level). */
  gravity: { initial: 3, min: 1, max: 15, step: 1 } satisfies RangeSetting,
  /** px/s² per gravity unit. */
  gravityScale: 60,
  /** Terminal velocity, px/s. */
  maxFallSpeed: 1400,

  /** Hard cap on live shapes — protects low-end mobile devices. */
  maxShapes: 300,
  /** Frame delta clamp (ms) — avoids huge jumps after a stall / tab switch. */
  maxFrameMs: 50,
  /** How often the HUD statistics are recomputed (ms). */
  statsIntervalMs: 100,

  shape: {
    /** Circumradius range in CSS px, scaled down on small screens. */
    minRadius: 20,
    maxRadius: 44,
    /** Polygon resolution used for area/clipping of circles & ellipses. */
    curveSegments: 48,
  },

  render: {
    maxResolution: 2,
    /** Pooled ShapeViews kept for reuse; extras are destroyed. */
    poolMaxSize: 64,
  },
} as const;
