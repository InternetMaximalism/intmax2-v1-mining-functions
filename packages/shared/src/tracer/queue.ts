export class Queue<T> {
  readonly queues: T[] = [];

  enqueue(address: T): void {
    this.queues.push(address);
  }

  enqueueMany(addresses: T[]): void {
    this.queues.push(...addresses);
  }

  dequeue(): T | undefined {
    return this.queues.shift();
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  size(): number {
    return this.queues.length;
  }
}
