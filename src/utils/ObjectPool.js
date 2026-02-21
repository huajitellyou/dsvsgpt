/**
 * 对象池管理器
 * 统一管理游戏中所有对象池，提高性能
 */
export class ObjectPool {
  constructor(scene) {
    this.scene = scene;
    this.pools = new Map();
  }

  /**
   * 创建对象池
   * @param {string} key - 对象池标识
   * @param {class} ClassType - 对象类
   * @param {number} maxSize - 最大容量
   * @param {function} factory - 工厂函数
   */
  createPool(key, ClassType, maxSize = 50, factory = null) {
    if (this.pools.has(key)) {
      console.warn(`Pool ${key} already exists`);
      return this.pools.get(key);
    }

    const pool = {
      ClassType,
      maxSize,
      factory,
      available: [],
      inUse: new Set()
    };

    this.pools.set(key, pool);
    return pool;
  }

  /**
   * 获取对象
   * @param {string} key - 对象池标识
   * @param {...any} args - 构造函数参数
   * @returns {Object|null}
   */
  acquire(key, ...args) {
    const pool = this.pools.get(key);
    if (!pool) {
      console.warn(`Pool ${key} not found`);
      return null;
    }

    let obj;

    if (pool.available.length > 0) {
      obj = pool.available.pop();
      obj.activate?.();
    } else if (pool.inUse.size < pool.maxSize) {
      if (pool.factory) {
        obj = pool.factory(this.scene, ...args);
      } else {
        obj = new pool.ClassType(this.scene, ...args);
      }
    } else {
      console.warn(`Pool ${key} is full`);
      return null;
    }

    pool.inUse.add(obj);
    return obj;
  }

  /**
   * 回收对象
   * @param {string} key - 对象池标识
   * @param {Object} obj - 要回收的对象
   */
  release(key, obj) {
    const pool = this.pools.get(key);
    if (!pool) {
      console.warn(`Pool ${key} not found`);
      return;
    }

    if (!pool.inUse.has(obj)) {
      return;
    }

    pool.inUse.delete(obj);
    obj.deactivate?.();
    pool.available.push(obj);
  }

  /**
   * 清空对象池
   * @param {string} key - 对象池标识
   */
  clear(key) {
    const pool = this.pools.get(key);
    if (!pool) return;

    pool.available.forEach(obj => obj.destroy?.());
    pool.available = [];
    pool.inUse.clear();
  }

  /**
   * 清空所有对象池
   */
  clearAll() {
    this.pools.forEach((_, key) => this.clear(key));
  }

  /**
   * 获取对象池状态
   * @param {string} key - 对象池标识
   * @returns {Object}
   */
  getStats(key) {
    const pool = this.pools.get(key);
    if (!pool) return null;

    return {
      available: pool.available.length,
      inUse: pool.inUse.size,
      maxSize: pool.maxSize
    };
  }

  /**
   * 销毁对象池管理器
   */
  destroy() {
    this.clearAll();
    this.pools.clear();
    this.scene = null;
  }
}
