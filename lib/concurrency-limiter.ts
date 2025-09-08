/**
 * Utility to limit concurrent async operations
 */
export class ConcurrencyLimiter {
  private running = 0;
  private queue: Array<() => void> = [];

  constructor(private limit: number) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        this.running++;
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          if (this.queue.length > 0) {
            const next = this.queue.shift();
            next?.();
          }
        }
      };

      if (this.running < this.limit) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }
}

/**
 * Process an array of items with limited concurrency
 */
export async function processWithConcurrency<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 3
): Promise<R[]> {
  const limiter = new ConcurrencyLimiter(concurrency);
  
  const promises = items.map(item => 
    limiter.run(() => processor(item))
  );
  
  return Promise.all(promises);
}
