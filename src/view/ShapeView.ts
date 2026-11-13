import { Graphics, type GraphicsContext } from 'pixi.js';
import type { ShapeModel } from '../model/ShapeModel';

/** Visual representation of one ShapeModel. Pooled and reused. */
export class ShapeView {
  readonly graphics = new Graphics();
  private _model: ShapeModel | null = null;
  private uniqueContext: GraphicsContext | null = null;

  constructor(onPick: (model: ShapeModel) => void) {
    const g = this.graphics;
    g.eventMode = 'static'; // precise hit-test against the actual geometry
    g.cursor = 'pointer';
    g.visible = false;
    g.on('pointerdown', (event) => {
      event.stopPropagation();
      if (this._model) onPick(this._model);
    });
  }

  get model(): ShapeModel | null {
    return this._model;
  }

  bind(model: ShapeModel, context: GraphicsContext, isUnique: boolean): void {
    const g = this.graphics;
    const geometry = model.geometry;
    this._model = model;
    this.uniqueContext = isUnique ? context : null;
    g.context = context;
    g.tint = model.color;
    g.scale.set(geometry.scaleX, geometry.scaleY);
    g.rotation = geometry.rotation;
    g.position.set(model.x, model.y);
    g.visible = true;
  }

  sync(): void {
    const model = this._model;
    if (model) this.graphics.position.set(model.x, model.y);
  }

  /** Returns the view to a neutral state before going back to the pool. */
  reset(emptyContext: GraphicsContext): void {
    const g = this.graphics;
    this._model = null;
    g.visible = false;
    g.removeFromParent();
    g.context = emptyContext;
    if (this.uniqueContext) {
      this.uniqueContext.destroy();
      this.uniqueContext = null;
    }
  }

  destroy(): void {
    this.uniqueContext?.destroy();
    this.uniqueContext = null;
    this._model = null;
    this.graphics.destroy();
  }
}
