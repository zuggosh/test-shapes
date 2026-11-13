import type { FederatedPointerEvent } from 'pixi.js';
import type { SimulationModel } from '../model/SimulationModel';
import type { ShapeModel } from '../model/ShapeModel';
import type { SpawnSystem } from '../systems/SpawnSystem';
import type { StageView } from '../view/StageView';

/**
 * Pointer events work identically for mouse, touch and pen.
 * `pointerdown` is used instead of click/tap: shapes are moving, so a tap whose
 * down/up land on different positions would otherwise be lost.
 */
export class InputController {
  private readonly onEmptyArea = (event: FederatedPointerEvent) => {
    const point = event.getLocalPosition(this.stage.root);
    this.spawner.spawnAt(point.x, point.y);
  };

  constructor(
    private readonly stage: StageView,
    private readonly model: SimulationModel,
    private readonly spawner: SpawnSystem,
  ) {
    stage.hitLayer.on('pointerdown', this.onEmptyArea);
  }

  /** Passed to ShapeView instances. */
  readonly onShapePicked = (shape: ShapeModel): void => {
    this.model.removeShape(shape);
  };

  destroy(): void {
    this.stage.hitLayer.off('pointerdown', this.onEmptyArea);
  }
}
