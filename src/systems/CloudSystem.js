import { GameConfig } from '../config/GameConfig.js';

/**
 * 云朵系统
 * 管理游戏中缓慢飘动的云朵效果
 */
export class CloudSystem {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
    this.worldWidth = GameConfig.world.width;
    this.worldHeight = GameConfig.world.height;

    // 云朵配置
    this.config = {
      count: 6,                    // 云朵数量
      minY: 50,                    // 最小高度
      maxY: 400,                   // 最大高度
      minScale: 0.5,               // 最小缩放
      maxScale: 1.2,               // 最大缩放
      minSpeed: 0.3,               // 最小速度 (像素/帧)
      maxSpeed: 0.8,               // 最大速度 (像素/帧)
      minAlpha: 0.4,               // 最小透明度
      maxAlpha: 0.8                // 最大透明度
    };

    this.init();
  }

  /**
   * 初始化云朵系统
   */
  init() {
    // 创建云朵组
    this.cloudGroup = this.scene.add.group();

    // 创建初始云朵
    for (let i = 0; i < this.config.count; i++) {
      this.createCloud(true);
    }
  }

  /**
   * 创建单个云朵
   * @param {boolean} randomX - 是否在屏幕范围内随机X位置
   */
  createCloud(randomX = false) {
    const x = randomX
      ? Phaser.Math.Between(0, this.worldWidth)
      : this.worldWidth + 100;
    const y = Phaser.Math.Between(this.config.minY, this.config.maxY);
    const scale = Phaser.Math.FloatBetween(this.config.minScale, this.config.maxScale);
    const alpha = Phaser.Math.FloatBetween(this.config.minAlpha, this.config.maxAlpha);
    const speed = Phaser.Math.FloatBetween(this.config.minSpeed, this.config.maxSpeed);

    const cloud = this.scene.add.image(x, y, 'cloud');
    cloud.setScale(scale);
    cloud.setAlpha(alpha);
    cloud.setScrollFactor(0.5); // 视差效果：云朵移动速度是相机的一半

    // 存储云朵数据
    const cloudData = {
      sprite: cloud,
      speed: speed,
      width: cloud.width * scale
    };

    this.clouds.push(cloudData);
    this.cloudGroup.add(cloud);

    return cloudData;
  }

  /**
   * 更新云朵位置
   */
  update() {
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const cloud = this.clouds[i];

      // 移动云朵
      cloud.sprite.x -= cloud.speed;

      // 如果云朵完全移出屏幕左侧，重置到右侧
      if (cloud.sprite.x < -cloud.width / 2) {
        this.resetCloud(cloud);
      }
    }
  }

  /**
   * 重置云朵到右侧
   * @param {Object} cloud - 云朵数据对象
   */
  resetCloud(cloud) {
    cloud.sprite.x = this.worldWidth + cloud.width / 2;
    cloud.sprite.y = Phaser.Math.Between(this.config.minY, this.config.maxY);

    // 随机化其他属性
    const scale = Phaser.Math.FloatBetween(this.config.minScale, this.config.maxScale);
    const alpha = Phaser.Math.FloatBetween(this.config.minAlpha, this.config.maxAlpha);
    cloud.speed = Phaser.Math.FloatBetween(this.config.minSpeed, this.config.maxSpeed);

    cloud.sprite.setScale(scale);
    cloud.sprite.setAlpha(alpha);
    cloud.width = cloud.sprite.width * scale;
  }

  /**
   * 销毁云朵系统
   */
  destroy() {
    if (this.cloudGroup) {
      this.cloudGroup.clear(true, true);
      this.cloudGroup.destroy();
      this.cloudGroup = null;
    }
    this.clouds = [];
  }
}
