import { LevelConfig } from '../config/LevelConfig.js';

/**
 * 关卡管理器
 * 负责关卡数据的加载和平台生成
 */
export class LevelManager {
  constructor(scene) {
    this.scene = scene;
    this.platforms = null;
    this.ground = null;
  }

  /**
   * 创建关卡
   */
  createLevel() {
    this.createGround();
    this.createPlatforms();
    this.setupWorldBounds();
  }

  /**
   * 创建地面
   */
  createGround() {
    const groundConfig = LevelConfig.ground;

    this.ground = this.scene.add.tileSprite(
      groundConfig.x,
      groundConfig.y,
      groundConfig.width,
      groundConfig.height,
      'ground'
    );

    this.groundPlatforms = this.scene.physics.add.staticGroup();
    const groundBody = this.groundPlatforms.create(groundConfig.x, groundConfig.y, 'ground');
    groundBody.setDisplaySize(groundConfig.width, groundConfig.height);
    groundBody.setVisible(false);
    groundBody.refreshBody();
  }

  /**
   * 创建平台
   */
  createPlatforms() {
    this.platforms = this.scene.physics.add.staticGroup();

    const styles = LevelConfig.platformStyles;
    const colors = styles.colors;

    LevelConfig.platforms.forEach((data, index) => {
      // 根据高度选择颜色（低层用暖色，中层中性，高层冷色）
      const colorIndex = this.getColorIndexByHeight(data.y);
      const color = colors[colorIndex % colors.length];

      // 创建圆角矩形平台
      const platform = this.createRoundedPlatform(data.x, data.y, data.width, data.height, color, styles.borderRadius);
      this.platforms.add(platform);
    });
  }

  /**
   * 根据高度获取颜色索引
   * @param {number} y - 平台Y坐标
   * @returns {number} 颜色索引
   */
  getColorIndexByHeight(y) {
    const groundY = LevelConfig.ground.y - LevelConfig.ground.height / 2;
    const heightRange = groundY - 200; // 从地面到最高平台的范围
    const relativeHeight = groundY - y;
    const heightRatio = Math.max(0, Math.min(1, relativeHeight / heightRange));

    // 根据高度比例分配颜色：低层(0-0.33)暖色，中层(0.33-0.66)中性，高层(0.66-1)冷色
    if (heightRatio < 0.33) {
      return Math.floor(Math.random() * 2); // 暖色索引 0-1
    } else if (heightRatio < 0.66) {
      return 2 + Math.floor(Math.random() * 2); // 中性色索引 2-3
    } else {
      return 4 + Math.floor(Math.random() * 2); // 冷色索引 4-5
    }
  }

  /**
   * 创建圆角矩形平台
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} color - 颜色
   * @param {number} radius - 圆角半径
   * @returns {Phaser.Physics.Arcade.Sprite} 平台物理对象
   */
  createRoundedPlatform(x, y, width, height, color, radius) {
    // 生成唯一的纹理键名
    const textureKey = `platform_${width}_${height}_${color}_${radius}`;

    // 如果纹理不存在，创建它
    if (!this.scene.textures.exists(textureKey)) {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(color, 1);
      graphics.fillRoundedRect(0, 0, width, height, radius);
      graphics.generateTexture(textureKey, width, height);
      graphics.destroy();
    }

    // 创建精灵并添加物理
    const platform = this.scene.add.sprite(x, y, textureKey);
    this.scene.physics.add.existing(platform, true);

    // 调整物理体大小以匹配视觉
    platform.body.setSize(width, height);

    return platform;
  }

  /**
   * 设置世界边界
   */
  setupWorldBounds() {
    const worldConfig = LevelConfig.world;
    this.scene.physics.world.setBounds(0, 0, worldConfig.width, worldConfig.height);
  }

  /**
   * 获取随机敌人生成点
   * @returns {Object}
   */
  getRandomEnemySpawnPoint() {
    return LevelConfig.getRandomEnemySpawnPoint();
  }

  /**
   * 获取玩家生成点
   * @returns {Object}
   */
  getPlayerSpawnPoint() {
    return LevelConfig.getPlayerSpawnPoint();
  }

  /**
   * 获取平台组
   * @returns {Phaser.Physics.Arcade.StaticGroup}
   */
  getPlatforms() {
    return this.platforms;
  }

  /**
   * 获取地面平台组
   * @returns {Phaser.Physics.Arcade.StaticGroup}
   */
  getGroundPlatforms() {
    return this.groundPlatforms;
  }
}
