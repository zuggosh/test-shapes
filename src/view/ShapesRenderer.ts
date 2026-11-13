import type { Container } from 'pixi.js';
import { SETTINGS } from '../config/settings';
import { ObjectPool } from '../core/ObjectPool';
import type { ShapeModel } from '../model/ShapeModel';
import type { SimulationModel } from '../model/SimulationModel';
import { GraphicsContextCache } from './GraphicsContextCache';
import { ShapeView } from './ShapeView';

/**
 * Keeps the display list in sync with the model (View side of MVC).
 * Subscribes to model events; owns the ShapeView pool and the geometry cache.
 */
export class ShapesRenderer {
  private readonly views = new Map<number, ShapeView>();
  private readonly cache = new GraphicsContextCache();
  private readonly pool: ObjectPool<ShapeView>;
  private readonly unsubscribe: Array<() => void>;

  constructor(
    private readonly layer: Container,
    model: SimulationModel,
    onPick: (shape: ShapeModel) => void,
  ) {
    this.pool = new ObjectPool<ShapeView>(
      () => new ShapeView(onPick),
      (view) => view.reset(this.cache.empty),
      (view) => view.destroy(),
      SETTINGS.render.poolMaxSize,
    );

    this.unsubscribe = [
      model.on('shapeAdded', (shape) => this.add(shape)),
      model.on('shapeRemoved', (shape) => this.remove(shape)),
    ];
  }

  get activeCount(): number {
    return this.views.size;
  }

  get pooledCount(): number {
    return this.pool.freeCount;
  }

  /** Copies model positions to display objects. Called once per frame. */
  sync(): void {
    for (const view of this.views.values()) view.sync();
  }

  destroy(): void {
    this.unsubscribe.forEach((off) => off());
    for (const view of this.views.values()) view.destroy();
    this.views.clear();
    this.pool.clear();
    this.cache.destroy();
  }

  private add(shape: ShapeModel): void {
    const { contextKey, path } = shape.geometry;
    const isUnique = contextKey === null;
    const context = isUnique ? this.cache.createUnique(path) : this.cache.getShared(contextKey, path);
    const view = this.pool.acquire();
    view.bind(shape, context, isUnique);
    this.layer.addChild(view.graphics);
    this.views.set(shape.id, view);
  }

  private remove(shape: ShapeModel): void {
    const view = this.views.get(shape.id);
    if (!view) return;
    this.views.delete(shape.id);
    this.pool.release(view);
  }
}
