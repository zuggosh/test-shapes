export interface RangeSetting {
  readonly initial: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

export const SETTINGS = {
  spawnRate: { initial: 1, min: 0, max: 10, step: 1 } satisfies RangeSetting,
  gravity: { initial: 3, min: 1, max: 15, step: 1 } satisfies RangeSetting,
  gravityScale: 60,
  maxFallSpeed: 1400,
  maxShapes: 300,
  maxFrameMs: 50,
  statsIntervalMs: 100,
  shape: {
    minRadius: 20,
    maxRadius: 44,
    curveSegments: 48,
  },
  render: {
    maxResolution: 2,
    poolMaxSize: 64,
  },
} as const;
