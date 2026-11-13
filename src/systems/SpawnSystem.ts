import { Random } from '../core/Random';
import type { SimulationModel } from '../model/SimulationModel';
import type { ShapeModel } from '../model/ShapeModel';
import { ShapeType } from '../model/types';
import type { ShapeFactory } from '../shapes/ShapeFactory';

/**
 * Timed generation driven by the game loop (no setInterval):
 * pauses with the ticker and stays exact at any refresh rate.
 */
export class SpawnSystem {
  private accumulator = 0;

  constructor(
    private readonly model: SimulationModel,
    private readonly factory: ShapeFactory,
    private readonly rng: Random = new Random(),
  ) {}

  update(dt: number): void {
    const rate = this.model.spawnRate;
    if (rate <= 0) {
      this.accumulator = 0;
      return;
    }
    this.accumulator += dt * rate;
    while (this.accumulator >= 1) {
      this.accumulator -= 1;
      this.spawnAtTop();
    }
  }

  /** Random X across the top; the shape starts fully above the rectangle (Fig. 1 — A). */
  spawnAtTop(): ShapeModel | null {
    if (this.model.isFull) return null;
    const spec = this.factory.createRandom();
    const { bounds } = spec.geometry;
    const width = this.model.viewport.width;
    const minX = -bounds.minX;
    const maxX = Math.max(minX, width - bounds.maxX);
    const x = this.rng.range(minX, maxX);
    const y = -bounds.maxY;
    return this.model.addShape(spec, x, y);
  }

  /** Click / tap: a random irregular shape centred on the pointer (task 3, 3a). */
  spawnAt(x: number, y: number): ShapeModel | null {
    if (this.model.isFull) return null;
    return this.model.addShape(this.factory.create(ShapeType.Irregular), x, y);
  }
}
