import { GPTEnemy } from './GPTEnemy.js';
import { ExplosiveEnemy } from './ExplosiveEnemy.js';
import { TowerEnemy } from './TowerEnemy.js';

/**
 * 敌人工厂
 * 负责创建不同类型的敌人
 */
export class EnemyFactory {
  static enemyTypes = {
    'gpt': GPTEnemy,
    'explosive': ExplosiveEnemy,
    'tower': TowerEnemy
    // 未来可添加更多敌人类型
    // 'deepseek': DeepSeekEnemy,
    // 'boss': BossEnemy
  };

  /**
   * 创建敌人
   * @param {Phaser.Scene} scene - 场景
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} type - 敌人类型
   * @returns {BaseEnemy}
   */
  static create(scene, x, y, type = 'gpt') {
    const EnemyClass = this.enemyTypes[type];
    if (!EnemyClass) {
      console.warn(`Unknown enemy type: ${type}`);
      return null;
    }

    return new EnemyClass(scene, x, y);
  }

  /**
   * 注册新的敌人类型
   * @param {string} type - 类型标识
   * @param {class} enemyClass - 敌人类
   */
  static register(type, enemyClass) {
    this.enemyTypes[type] = enemyClass;
  }

  /**
   * 获取所有可用敌人类型
   * @returns {string[]}
   */
  static getAvailableTypes() {
    return Object.keys(this.enemyTypes);
  }
}
