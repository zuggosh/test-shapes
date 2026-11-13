import { SETTINGS } from '../config/settings';
import type { SimulationModel } from '../model/SimulationModel';

/**
 * Gravity as acceleration: v += g·dt, y += v·dt (semi-implicit Euler).
 * Gravity is read every frame, so UI changes affect all shapes immediately.
 * Shapes that have fully left the bottom of the rectangle are removed.
 */
export class PhysicsSystem {
  constructor(private readonly model: SimulationModel) {}

  update(dt: number): void {
    const model = this.model;
    const g = model.gravity * SETTINGS.gravityScale;
    const maxSpeed = SETTINGS.maxFallSpeed;
    const floor = model.viewport.height;
    const shapes = model.shapes;

    // Backwards: removal swaps the last element into the current slot.
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      shape.vy = Math.min(shape.vy + g * dt, maxSpeed);
      shape.y += shape.vy * dt;
      if (shape.top > floor) model.removeShape(shape);
    }
  }
}
