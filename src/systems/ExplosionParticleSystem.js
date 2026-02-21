import { GameConfig } from '../config/GameConfig.js';

/**
 * 爆炸粒子系统
 * 管理游戏中所有爆炸视觉效果
 */
export class ExplosionParticleSystem {
  /**
   * @param {Phaser.Scene} scene - 游戏场景
   */
  constructor(scene) {
    this.scene = scene;
    this.activeParticles = [];
  }

  /**
   * 获取预定义的爆炸配置
   * @returns {Object} 爆炸配置对象
   */
  static getConfigs() {
    return {
      explosiveEnemy: GameConfig.explosionEffects?.explosiveEnemy || {
        coreParticles: 15,
        sparkParticles: 15,
        smokeParticles: 10,
        duration: 800,
        colors: {
          core: [0xFFA500, 0xFF8C00, 0xFFD700],
          spark: [0xFFFFFF, 0xFFFF00, 0xFFAA00],
          smoke: [0x555555, 0x777777, 0x999999]
        },
        gravity: { core: 0, spark: 300, smoke: -80 },
        flash: true,
        flashDuration: 200,
        flashIntensity: 0.3
      },
      small: {
        coreParticles: 8,
        sparkParticles: 8,
        smokeParticles: 4,
        duration: 500,
        colors: {
          core: [0xFFA500, 0xFF6347],
          spark: [0xFFFFFF, 0xFFFF00],
          smoke: [0x666666, 0x888888]
        },
        gravity: { core: 0, spark: 200, smoke: -60 },
        flash: false,
        flashDuration: 100,
        flashIntensity: 0.2
      },
      large: {
        coreParticles: 25,
        sparkParticles: 25,
        smokeParticles: 15,
        duration: 1000,
        colors: {
          core: [0xFF4500, 0xFFA500, 0xFFD700, 0xFF6347],
          spark: [0xFFFFFF, 0xFFFF00, 0xFFAA00, 0xFF8C00],
          smoke: [0x444444, 0x666666, 0x888888, 0xAAAAAA]
        },
        gravity: { core: 0, spark: 400, smoke: -100 },
        flash: true,
        flashDuration: 300,
        flashIntensity: 0.4
      }
    };
  }

  /**
   * 创建爆炸效果
   * @param {number} x - 爆炸中心X坐标
   * @param {number} y - 爆炸中心Y坐标
   * @param {Object} config - 爆炸配置
   */
  createExplosion(x, y, config) {
    if (!config) {
      config = ExplosionParticleSystem.getConfigs().explosiveEnemy;
    }

    // 创建闪光效果
    if (config.flash) {
      this.createFlash(x, y, config);
    }

    // 创建核心粒子
    this.createCoreParticles(x, y, config);

    // 创建火花粒子
    this.createSparkParticles(x, y, config);

    // 创建烟雾粒子
    this.createSmokeParticles(x, y, config);

    // 创建爆炸光环
    this.createExplosionRing(x, y, config);
  }

  /**
   * 创建闪光效果
   * @private
   */
  createFlash(x, y, config) {
    const flash = this.scene.add.circle(x, y, 50, 0xFFFFFF, config.flashIntensity);
    flash.setDepth(60);

    this.scene.tweens.add({
      targets: flash,
      scale: 3,
      alpha: 0,
      duration: config.flashDuration,
      ease: 'Power2',
      onComplete: () => {
        flash.destroy();
      }
    });
  }

  /**
   * 创建核心粒子
   * @private
   */
  createCoreParticles(x, y, config) {
    const count = config.coreParticles || 15;
    const colors = config.colors?.core || [0xFFA500, 0xFF8C00, 0xFFD700];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Phaser.Math.FloatBetween(-0.2, 0.2);
      const speed = Phaser.Math.Between(200, 400);
      const size = Phaser.Math.Between(8, 20);
      const color = Phaser.Utils.Array.GetRandom(colors);

      const particle = this.scene.add.circle(x, y, size, color);
      particle.setDepth(50);

      const velocityX = Math.cos(angle) * speed;
      const velocityY = Math.sin(angle) * speed;

      this.animateParticle(particle, velocityX, velocityY, config.gravity?.core || 0, 300, 500);
    }
  }

  /**
   * 创建火花粒子
   * @private
   */
  createSparkParticles(x, y, config) {
    const count = config.sparkParticles || 15;
    const colors = config.colors?.spark || [0xFFFFFF, 0xFFFF00, 0xFFAA00];

    for (let i = 0; i < count; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(300, 600);
      const size = Phaser.Math.Between(2, 5);
      const color = Phaser.Utils.Array.GetRandom(colors);

      const particle = this.scene.add.rectangle(x, y, size, size, color);
      particle.setDepth(51);
      particle.rotation = Phaser.Math.FloatBetween(0, Math.PI * 2);

      const velocityX = Math.cos(angle) * speed;
      const velocityY = Math.sin(angle) * speed;

      this.animateParticle(particle, velocityX, velocityY, config.gravity?.spark || 300, 200, 400, true);
    }
  }

  /**
   * 创建烟雾粒子
   * @private
   */
  createSmokeParticles(x, y, config) {
    const count = config.smokeParticles || 10;
    const colors = config.colors?.smoke || [0x555555, 0x777777, 0x999999];

    for (let i = 0; i < count; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(50, 100);
      const size = Phaser.Math.Between(15, 30);
      const color = Phaser.Utils.Array.GetRandom(colors);

      const particle = this.scene.add.circle(x, y, size, color, 0.6);
      particle.setDepth(48);

      const velocityX = Math.cos(angle) * speed;
      const velocityY = Math.sin(angle) * speed;

      this.animateSmokeParticle(particle, velocityX, velocityY, config.gravity?.smoke || -80, 600, 800);
    }
  }

  /**
   * 创建爆炸光环
   * @private
   */
  createExplosionRing(x, y, config) {
    const ring = this.scene.add.circle(x, y, 10, 0xFFA500, 0.5);
    ring.setDepth(49);

    this.scene.tweens.add({
      targets: ring,
      radius: 100,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        ring.destroy();
      }
    });
  }

  /**
   * 动画化粒子
   * @private
   */
  animateParticle(particle, velocityX, velocityY, gravity, minDuration, maxDuration, rotate = false) {
    const duration = Phaser.Math.Between(minDuration, maxDuration);
    const targetX = particle.x + velocityX * (duration / 1000);
    const targetY = particle.y + velocityY * (duration / 1000) + 0.5 * gravity * Math.pow(duration / 1000, 2);

    const tweenConfig = {
      targets: particle,
      x: targetX,
      y: targetY,
      alpha: 0,
      scale: 0.3,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        particle.destroy();
      }
    };

    if (rotate) {
      tweenConfig.rotation = particle.rotation + Phaser.Math.FloatBetween(-2, 2);
    }

    this.scene.tweens.add(tweenConfig);
    this.activeParticles.push(particle);
  }

  /**
   * 动画化烟雾粒子
   * @private
   */
  animateSmokeParticle(particle, velocityX, velocityY, gravity, minDuration, maxDuration) {
    const duration = Phaser.Math.Between(minDuration, maxDuration);

    // 计算目标位置（考虑重力影响）
    const t = duration / 1000;
    const targetVelY = velocityY + gravity * t;
    const targetX = particle.x + velocityX * t;
    const targetY = particle.y + (velocityY + targetVelY) * 0.5 * t;

    // 使用单个tween动画，通过yoyo和repeat创建复杂效果
    this.scene.tweens.add({
      targets: particle,
      x: targetX,
      y: targetY,
      scale: 2.5,
      alpha: 0,
      duration: duration,
      ease: 'Sine.easeOut',
      onComplete: () => {
        particle.destroy();
      }
    });

    this.activeParticles.push(particle);
  }

  /**
   * 清理所有活动粒子
   */
  destroy() {
    this.activeParticles.forEach(particle => {
      if (particle.active) {
        particle.destroy();
      }
    });
    this.activeParticles = [];
  }
}
