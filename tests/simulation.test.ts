import { describe, expect, it } from 'vitest';
import { SETTINGS } from '../src/config/settings';
import { ObjectPool } from '../src/core/ObjectPool';
import { Random } from '../src/core/Random';
import { SimulationModel } from '../src/model/SimulationModel';
import { ShapeType } from '../src/model/types';
import { createDefaultShapeFactory } from '../src/shapes/ShapeFactory';
import { PhysicsSystem } from '../src/systems/PhysicsSystem';
import { SpawnSystem } from '../src/systems/SpawnSystem';
import { StatsSystem } from '../src/systems/StatsSystem';

function setup() {
  const model = new SimulationModel();
  model.setViewport(400, 300);
  const rng = new Random();
  const factory = createDefaultShapeFactory(rng);
  return { model, factory, spawner: new SpawnSystem(model, factory, rng), physics: new PhysicsSystem(model) };
}

describe('ShapeFactory', () => {
  it('generates every registered type with valid geometry', () => {
    const factory = createDefaultShapeFactory();
    for (const type of Object.values(ShapeType)) {
      const { geometry, color } = factory.create(type);
      expect(geometry.type).toBe(type);
      expect(geometry.area).toBeGreaterThan(0);
      expect(geometry.polygon.length).toBeGreaterThanOrEqual(6);
      expect(color).toBeGreaterThanOrEqual(0);
      expect(color).toBeLessThanOrEqual(0xffffff);
    }
  });

  it('uses the analytic area for circles', () => {
    const { geometry } = createDefaultShapeFactory().create(ShapeType.Circle);
    const radius = (geometry.bounds.maxY - geometry.bounds.minY) / 2;
    expect(geometry.area).toBeCloseTo(Math.PI * radius * radius);
  });

  it('never picks the irregular shape for timed spawns', () => {
    const factory = createDefaultShapeFactory();
    for (let i = 0; i < 200; i++) expect(factory.createRandom().geometry.type).not.toBe(ShapeType.Irregular);
  });
});

describe('SpawnSystem', () => {
  it('spawns exactly 1 shape per second at the default rate', () => {
    const { model, spawner } = setup();
    for (let i = 0; i < 4; i++) spawner.update(0.3); // 1.2 s
    expect(model.shapes.length).toBe(1);
  });

  it('spawns fully above the rectangle, horizontally inside', () => {
    const { model, spawner } = setup();
    for (let i = 0; i < 50; i++) {
      const s = spawner.spawnAtTop()!;
      expect(s.bottom).toBeLessThanOrEqual(1e-9);
      expect(s.left).toBeGreaterThanOrEqual(-1e-9);
      expect(s.right).toBeLessThanOrEqual(model.viewport.width + 1e-9);
    }
  });

  it('respects the shape cap', () => {
    const { model, spawner } = setup();
    for (let i = 0; i < SETTINGS.maxShapes + 20; i++) spawner.spawnAt(10, 10);
    expect(model.shapes.length).toBe(SETTINGS.maxShapes);
  });
});

describe('PhysicsSystem', () => {
  it('accelerates with gravity and removes shapes below the bottom', () => {
    const { model, spawner, physics } = setup();
    const removed: number[] = [];
    model.on('shapeRemoved', (s) => removed.push(s.id));
    const shape = spawner.spawnAt(200, 100)!;

    physics.update(0.1);
    const v1 = shape.vy;
    physics.update(0.1);
    expect(shape.vy).toBeGreaterThan(v1);

    for (let i = 0; i < 200 && model.shapes.length; i++) physics.update(0.05);
    expect(model.shapes.length).toBe(0);
    expect(removed).toEqual([shape.id]);
  });

  it('applies gravity changes immediately', () => {
    const { model, spawner, physics } = setup();
    const shape = spawner.spawnAt(200, 0)!;
    model.setGravity(SETTINGS.gravity.max);
    physics.update(0.1);
    expect(shape.vy).toBeCloseTo(SETTINGS.gravity.max * SETTINGS.gravityScale * 0.1);
  });
});

describe('SimulationModel settings', () => {
  it('clamps values and emits only on change', () => {
    const model = new SimulationModel();
    let events = 0;
    model.on('settingsChanged', () => events++);
    model.setSpawnRate(SETTINGS.spawnRate.max + 100);
    model.setSpawnRate(SETTINGS.spawnRate.max + 5);
    model.changeGravity(-1);
    expect(model.spawnRate).toBe(SETTINGS.spawnRate.max);
    expect(events).toBe(2);
  });
});

describe('StatsSystem', () => {
  it('counts only visible shapes and their visible area', () => {
    const { model, factory } = setup();
    const stats = new StatsSystem();
    const spec = factory.create(ShapeType.Square);
    model.addShape(spec, 200, 150); // fully inside
    model.addShape(spec, 200, -500); // fully outside
    const result = stats.compute(model.shapes, model.viewport);
    expect(result.count).toBe(1);
    expect(result.area).toBe(Math.round(spec.geometry.area));
  });
});

describe('ObjectPool', () => {
  it('reuses released objects and disposes overflow', () => {
    let created = 0;
    let disposed = 0;
    const pool = new ObjectPool(() => ({ id: created++ }), () => {}, () => disposed++, 1);
    const a = pool.acquire();
    const b = pool.acquire();
    pool.release(a);
    pool.release(b);
    expect(disposed).toBe(1);
    expect(pool.acquire()).toBe(a);
    expect(created).toBe(2);
  });
});
