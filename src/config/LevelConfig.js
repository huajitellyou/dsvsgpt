import { GameConfig } from './GameConfig.js';

/**
 * 关卡配置
 * 集中管理所有关卡相关数据
 */
export const LevelConfig = {
  // 世界边界（引用 GameConfig）
  world: GameConfig.world,

  // 平台数据（消除 GameScene.js 中的重复）
  platforms: [
    // 低层 (y=800-1050) - 4个，均匀分布
    { x: 200, y: 1050, width: 150, height: 25 },
    { x: 800, y: 1000, width: 180, height: 25 },
    { x: 1400, y: 850, width: 160, height: 25 },
    { x: 2000, y: 800, width: 150, height: 25 },
    // 中层 (y=550-700) - 4个，均匀分布
    { x: 300, y: 700, width: 160, height: 25 },
    { x: 900, y: 650, width: 150, height: 25 },
    { x: 1200, y: 550, width: 130, height: 25 },
    { x: 1800, y: 600, width: 140, height: 25 },
    // 高层 (y=250-400) - 4个，均匀分布
    { x: 400, y: 400, width: 140, height: 25 },
    { x: 1000, y: 300, width: 150, height: 25 },
    { x: 1300, y: 250, width: 200, height: 25 },
    { x: 1900, y: 250, width: 150, height: 25 }
  ],

  // 地面数据
  // groundY 是地面顶部位置，tileSprite 需要中心点位置
  ground: {
    x: GameConfig.world.width / 2,
    y: GameConfig.world.groundY + GameConfig.world.groundHeight / 2,
    width: GameConfig.world.width,
    height: GameConfig.world.groundHeight,
    color: 0xC4A484
  },

  // 平台颜色
  platformColor: 0xC4A484,

  // 平台样式配置
  platformStyles: {
    // 平台颜色数组（按高度分层：低层暖色、中层中性、高层冷色）
    colors: [
      0xE8A87C, // 暖橙 - 低层
      0xD4A574, // 沙棕 - 低层
      0xC38D9E, // 粉紫 - 中层
      0xB8A9C9, // 淡紫 - 中层
      0x85CDCA, // 青绿 - 高层
      0x41B3A3  // 深青 - 高层
    ],
    borderRadius: 8,  // 圆角半径
    borderColor: 0xFFFFFF, // 边框颜色（可选）
    borderWidth: 0    // 边框宽度（0表示无边框）
  },

  // 生成点
  spawnPoints: {
    player: {
      x: GameConfig.world.width * GameConfig.player.startXOffset,
      y: GameConfig.world.groundY - GameConfig.player.startYOffset  // groundY 是地面顶部
    },
    // 敌人可以在这些平台位置生成
    enemyPlatforms: [
      { x: 200, y: 1000 },
      { x: 800, y: 950 },
      { x: 1400, y: 800 },
      { x: 2000, y: 750 },
      { x: 300, y: 650 },
      { x: 900, y: 600 },
      { x: 1200, y: 500 },
      { x: 1800, y: 550 },
      { x: 400, y: 350 },
      { x: 1000, y: 250 },
      { x: 1300, y: 200 },
      { x: 1900, y: 200 }
    ]
  },

  /**
   * 获取随机敌人生成点
   * @returns {Object} {x, y}
   */
  getRandomEnemySpawnPoint() {
    return Phaser.Utils.Array.GetRandom(this.spawnPoints.enemyPlatforms);
  },

  /**
   * 获取玩家初始位置
   * @returns {Object} {x, y}
   */
  getPlayerSpawnPoint() {
    return this.spawnPoints.player;
  }
};
