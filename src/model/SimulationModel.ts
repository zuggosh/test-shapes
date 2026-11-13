import { SETTINGS, type RangeSetting } from '../config/settings';
import { EventEmitter } from '../core/EventEmitter';
import { ShapeModel } from './ShapeModel';
import type { Rect, SettingsSnapshot, ShapeSpec, Stats } from './types';

export interface SimulationEvents {
  shapeAdded: ShapeModel;
  shapeRemoved: ShapeModel;
  settingsChanged: SettingsSnapshot;
  statsChanged: Stats;
  viewportChanged: Rect;
}

/**
 * Single source of truth for the simulation state (the "M" in MVC).
 * Knows nothing about PixiJS or the DOM — views subscribe to its events.
 */
export class SimulationModel extends EventEmitter<SimulationEvents> {
  private readonly _shapes: ShapeModel[] = [];
  private nextId = 1;
  private _gravity: number = SETTINGS.gravity.initial;
  private _spawnRate: number = SETTINGS.spawnRate.initial;
  private _stats: Stats = { count: 0, area: 0 };
  private _viewport: Rect = { x: 0, y: 0, width: 0, height: 0 };

  constructor(private readonly maxShapes: number = SETTINGS.maxShapes) {
    super();
  }

  get shapes(): readonly ShapeModel[] {
    return this._shapes;
  }

  get gravity(): number {
    return this._gravity;
  }

  get spawnRate(): number {
    return this._spawnRate;
  }

  get stats(): Stats {
    return this._stats;
  }

  get viewport(): Rect {
    return this._viewport;
  }

  get settings(): SettingsSnapshot {
    return { gravity: this._gravity, spawnRate: this._spawnRate };
  }

  get isFull(): boolean {
    return this._shapes.length >= this.maxShapes;
  }

  /** Returns the new shape, or null when the safety cap is reached. */
  addShape(spec: ShapeSpec, x: number, y: number): ShapeModel | null {
    if (this.isFull) return null;
    const shape = new ShapeModel(this.nextId++, spec.geometry, spec.color, x, y);
    this._shapes.push(shape);
    this.emit('shapeAdded', shape);
    return shape;
  }

  removeShape(shape: ShapeModel): void {
    const index = this._shapes.indexOf(shape);
    if (index === -1) return;
    // Order is irrelevant for the simulation: O(1) swap-remove.
    const last = this._shapes.pop()!;
    if (index < this._shapes.length) this._shapes[index] = last;
    this.emit('shapeRemoved', shape);
  }

  clear(): void {
    for (let i = this._shapes.length - 1; i >= 0; i--) this.removeShape(this._shapes[i]);
  }

  changeGravity(direction: 1 | -1): void {
    this.setGravity(this._gravity + direction * SETTINGS.gravity.step);
  }

  setGravity(value: number): void {
    const next = clamp(value, SETTINGS.gravity);
    if (next === this._gravity) return;
    this._gravity = next;
    this.emit('settingsChanged', this.settings);
  }

  changeSpawnRate(direction: 1 | -1): void {
    this.setSpawnRate(this._spawnRate + direction * SETTINGS.spawnRate.step);
  }

  setSpawnRate(value: number): void {
    const next = clamp(value, SETTINGS.spawnRate);
    if (next === this._spawnRate) return;
    this._spawnRate = next;
    this.emit('settingsChanged', this.settings);
  }

  setViewport(width: number, height: number): void {
    if (width === this._viewport.width && height === this._viewport.height) return;
    this._viewport = { x: 0, y: 0, width, height };
    this.emit('viewportChanged', this._viewport);
  }

  setStats(stats: Stats): void {
    if (stats.count === this._stats.count && stats.area === this._stats.area) return;
    this._stats = stats;
    this.emit('statsChanged', stats);
  }
}

function clamp(value: number, range: RangeSetting): number {
  return Math.min(range.max, Math.max(range.min, value));
}
