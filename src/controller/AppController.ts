import type { Ticker } from 'pixi.js';
import { SETTINGS } from '../config/settings';
import { Random } from '../core/Random';
import { SimulationModel } from '../model/SimulationModel';
import { createDefaultShapeFactory, type ShapeFactory } from '../shapes/ShapeFactory';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { StatsSystem } from '../systems/StatsSystem';
import { HtmlHud } from '../ui/HtmlHud';
import { ShapesRenderer } from '../view/ShapesRenderer';
import { StageView } from '../view/StageView';
import { InputController } from './InputController';

export interface AppElements {
  stage: HTMLElement;
  hud: HTMLElement;
  controls: HTMLElement;
}

/**
 * Composition root + game loop (the "C" in MVC).
 * Wires model, systems, views and UI, and owns the application lifecycle.
 */
export class AppController {
  private readonly model = new SimulationModel();
  private readonly stage = new StageView();
  private readonly factory: ShapeFactory;
  private readonly physics: PhysicsSystem;
  private readonly spawner: SpawnSystem;
  private readonly statsSystem = new StatsSystem();

  private renderer?: ShapesRenderer;
  private input?: InputController;
  private hud?: HtmlHud;
  private resizeObserver?: ResizeObserver;
  private resizeFrame = 0;
  private statsElapsed = 0;

  constructor(private readonly elements: AppElements) {
    const rng = new Random();
    this.factory = createDefaultShapeFactory(rng);
    this.physics = new PhysicsSystem(this.model);
    this.spawner = new SpawnSystem(this.model, this.factory, rng);
  }

  async start(): Promise<void> {
    const { stage: host, hud, controls } = this.elements;
    await this.stage.init(host);

    this.input = new InputController(this.stage, this.model, this.spawner);
    this.renderer = new ShapesRenderer(this.stage.shapesLayer, this.model, this.input.onShapePicked);
    this.hud = new HtmlHud(hud, controls, this.model);

    this.applySize(this.stage.width, this.stage.height);
    this.observeResize(host);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.stage.app.ticker.add(this.update);
  }

  destroy(): void {
    this.stage.app.ticker.remove(this.update);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.resizeObserver?.disconnect();
    cancelAnimationFrame(this.resizeFrame);
    this.input?.destroy();
    this.hud?.destroy();
    this.model.clear();
    this.renderer?.destroy();
    this.model.removeAllListeners();
    this.stage.destroy();
  }

  /** One frame: spawn → physics → views → (throttled) statistics. */
  private readonly update = (ticker: Ticker): void => {
    const deltaMs = Math.min(ticker.deltaMS, SETTINGS.maxFrameMs);
    const dt = deltaMs / 1000;

    this.spawner.update(dt);
    this.physics.update(dt);
    this.renderer!.sync();

    this.statsElapsed += deltaMs;
    if (this.statsElapsed >= SETTINGS.statsIntervalMs) {
      this.statsElapsed = 0;
      this.model.setStats(this.statsSystem.compute(this.model.shapes, this.model.viewport));
    }
  };

  /** rAF is already throttled in background tabs; stopping the ticker also stops spawning. */
  private readonly onVisibilityChange = (): void => {
    const ticker = this.stage.app.ticker;
    if (document.hidden) ticker.stop();
    else ticker.start();
  };

  private observeResize(host: HTMLElement): void {
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', () => this.scheduleResize(host));
      return;
    }
    this.resizeObserver = new ResizeObserver(() => this.scheduleResize(host));
    this.resizeObserver.observe(host);
  }

  /** Coalesces bursts of resize notifications (e.g. mobile URL bar) into one per frame. */
  private scheduleResize(host: HTMLElement): void {
    cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = requestAnimationFrame(() => {
      const width = Math.max(1, Math.floor(host.clientWidth));
      const height = Math.max(1, Math.floor(host.clientHeight));
      if (width !== this.stage.width || height !== this.stage.height) {
        this.stage.resize(width, height);
        this.applySize(width, height);
      }
    });
  }

  private applySize(width: number, height: number): void {
    this.model.setViewport(width, height);
    // Smaller shapes on phones so the playfield keeps the same "density".
    const shortSide = Math.min(width, height);
    this.factory.setSizeScale(Math.min(1, Math.max(0.6, shortSide / 600)));
  }
}
