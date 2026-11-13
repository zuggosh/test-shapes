import { Application, Container, Graphics, Rectangle } from 'pixi.js';
import { SETTINGS } from '../config/settings';
import { THEME } from '../config/theme';

/**
 * Owns the PixiJS application and the scene graph:
 *
 *   stage
 *   ├─ maskShape        (rectangle used as mask — Fig. 1 C)
 *   └─ root (masked)
 *      ├─ hitLayer      (empty-area clicks — Fig. 1 D)
 *      └─ shapesLayer   (falling shapes)
 */
export class StageView {
  readonly app = new Application();
  readonly root = new Container();
  readonly hitLayer = new Container();
  readonly shapesLayer = new Container();
  private readonly maskShape = new Graphics();
  private _width = 0;
  private _height = 0;

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  async init(host: HTMLElement): Promise<void> {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    const dpr = window.devicePixelRatio || 1;

    await this.app.init({
      width,
      height,
      preference: 'webgl', // WebGL2 with automatic WebGL1 fallback — the widest mobile support
      backgroundAlpha: 0, // stage background is a CSS gradient (cheaper than a full-screen quad)
      antialias: dpr < 2, // high-DPI screens don't need MSAA; saves fill-rate on phones
      resolution: Math.min(dpr, SETTINGS.render.maxResolution),
      autoDensity: true,
      powerPreference: 'low-power',
    });

    host.prepend(this.app.canvas);

    this.hitLayer.eventMode = 'static';
    this.shapesLayer.eventMode = 'passive';
    this.root.addChild(this.hitLayer, this.shapesLayer);
    this.root.mask = this.maskShape;
    this.app.stage.addChild(this.maskShape, this.root);
    this.app.stage.eventMode = 'passive';

    this.resize(width, height);
  }

  resize(width: number, height: number): void {
    this._width = width;
    this._height = height;
    this.app.renderer.resize(width, height);
    this.hitLayer.hitArea = new Rectangle(0, 0, width, height);
    // Axis-aligned rect mask → PixiJS uses a GPU scissor test (practically free).
    this.maskShape.clear().rect(0, 0, width, height).fill(THEME.color.white);
  }

  destroy(): void {
    this.app.destroy(true, { children: true });
  }
}
