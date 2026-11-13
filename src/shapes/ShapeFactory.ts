import { SETTINGS } from '../config/settings';
import { THEME } from '../config/theme';
import { hslToHex } from '../core/color';
import { Random } from '../core/Random';
import { ShapeType, type ShapeSpec } from '../model/types';
import type { ShapeGenerator } from './ShapeGenerator';
import {
  CircleGenerator,
  EllipseGenerator,
  IrregularGenerator,
  RegularPolygonGenerator,
  StarGenerator,
} from './generators';

/**
 * Factory + registry of generator strategies.
 * Adding a new shape type = registering one more generator; nothing else changes.
 * Type and colour are decided here, once, at generation time (task 2h).
 */
export class ShapeFactory {
  private readonly generators = new Map<ShapeType, ShapeGenerator>();
  private randomPool: ShapeType[] = [];
  private sizeScale = 1;

  constructor(private readonly rng: Random = new Random()) {}

  register(generator: ShapeGenerator, includeInRandom = true): this {
    this.generators.set(generator.type, generator);
    if (includeInRandom && !this.randomPool.includes(generator.type)) {
      this.randomPool.push(generator.type);
    }
    return this;
  }

  /** Shrinks shapes on small screens so the rectangle doesn't fill up instantly. */
  setSizeScale(scale: number): void {
    this.sizeScale = scale;
  }

  get registeredTypes(): ShapeType[] {
    return [...this.generators.keys()];
  }

  create(type: ShapeType): ShapeSpec {
    const generator = this.generators.get(type);
    if (!generator) throw new Error(`No generator registered for "${type}"`);
    const size = this.rng.range(SETTINGS.shape.minRadius, SETTINGS.shape.maxRadius) * this.sizeScale;
    return { geometry: generator.generate(this.rng, size), color: this.randomColor() };
  }

  createRandom(): ShapeSpec {
    return this.create(this.rng.pick(this.randomPool));
  }

  randomColor(): number {
    const { saturation, lightness } = THEME.shapeColor;
    return hslToHex(
      this.rng.range(0, 360),
      this.rng.range(saturation[0], saturation[1]),
      this.rng.range(lightness[0], lightness[1]),
    );
  }
}

/** Default setup: the 7 required types for timed spawns, irregular for clicks. */
export function createDefaultShapeFactory(rng: Random = new Random()): ShapeFactory {
  return new ShapeFactory(rng)
    .register(new RegularPolygonGenerator(ShapeType.Triangle, 3))
    .register(new RegularPolygonGenerator(ShapeType.Square, 4))
    .register(new RegularPolygonGenerator(ShapeType.Pentagon, 5))
    .register(new RegularPolygonGenerator(ShapeType.Hexagon, 6))
    .register(new CircleGenerator())
    .register(new EllipseGenerator())
    .register(new StarGenerator())
    .register(new IrregularGenerator(), false);
}
