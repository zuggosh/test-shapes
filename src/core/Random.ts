/** Random helpers with an injectable source (deterministic in tests). */
export class Random {
  constructor(private readonly source: () => number = Math.random) {}

  next(): number {
    return this.source();
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.source();
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.source() * items.length) % items.length];
  }

  chance(probability: number): boolean {
    return this.source() < probability;
  }
}
