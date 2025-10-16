
/**
 * Simple memory pool for Float32Array reuse
 */
export default class MemoryPool {
  private pools: Map<number, Float32Array[]> = new Map();
  private maxPoolSize = 8;

  acquireFloat32(size: number): Float32Array {
    const pool = this.pools.get(size);
    
    if (pool && pool.length > 0) {
      return pool.pop()!;
    }
    
    return new Float32Array(size);
  }

  release(array: Float32Array): void {
    const size = array.length;
    let pool = this.pools.get(size);
    
    if (!pool) {
      pool = [];
      this.pools.set(size, pool);
    }
    
    if (pool.length < this.maxPoolSize) {
      // Zero out for reuse
      array.fill(0);
      pool.push(array);
    }
  }

  clear(): void {
    this.pools.clear();
  }
}