/**
 * Generic Object Pool. Reuses expensive objects (display objects here)
 * instead of allocating / garbage-collecting them every second.
 */
export class ObjectPool<T> {
  private readonly free: T[] = [];

  constructor(
    private readonly create: () => T,
    private readonly reset: (item: T) => void,
    private readonly dispose: (item: T) => void,
    private readonly maxSize: number,
  ) {}

  get freeCount(): number {
    return this.free.length;
  }

  acquire(): T {
    return this.free.pop() ?? this.create();
  }

  release(item: T): void {
    this.reset(item);
    if (this.free.length < this.maxSize) {
      this.free.push(item);
    } else {
      this.dispose(item);
    }
  }

  clear(): void {
    for (const item of this.free) this.dispose(item);
    this.free.length = 0;
  }
}
