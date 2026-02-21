import { Game } from 'phaser';
import { DisplayConfig, displayConfig } from './utils/DisplayConfig.js';
import { LoadingScene } from './scenes/LoadingScene.js';
import { GameScene } from './scenes/GameScene.js';

// 游戏实例（延迟初始化）
let game = null;

// 检测设备并获取配置
console.log('[Main] 初始化显示配置...');
console.log('[Main] 设计分辨率:', `${displayConfig.designWidth}x${displayConfig.designHeight}`);
console.log('[Main] 显示尺寸:', `${displayConfig.displayWidth}x${displayConfig.displayHeight}`);
console.log('[Main] UI缩放:', displayConfig.uiScale.toFixed(3));

/**
 * 初始化 Phaser 游戏
 * 在用户点击开始游戏按钮后调用
 */
function initGame() {
  if (game) {
    console.log('[Main] 游戏已初始化，跳过');
    return;
  }

  console.log('[Main] 开始初始化 Phaser 游戏...');

  // 获取Phaser配置，注册LoadingScene和GameScene
  const config = DisplayConfig.getPhaserConfig([LoadingScene, GameScene]);

  // 创建游戏实例
  game = new Game(config);

  // 将配置附加到game实例供场景访问
  game.displayConfig = {
    ...displayConfig,
    getCameraConfig: DisplayConfig.getCameraConfig.bind(DisplayConfig),
    calculateCameraZoom: DisplayConfig.calculateCameraZoom.bind(DisplayConfig)
  };

  // 游戏启动后先进入LoadingScene
  game.events.on('ready', () => {
    console.log('[Main] Phaser 游戏已就绪，进入 LoadingScene');
    game.scene.start('LoadingScene');
  });

  console.log('[Main] Phaser 游戏初始化完成');
}

// 处理游戏resize的核心函数
function handleGameResize() {
  if (!game) return;

  // 获取新的显示配置
  const newConfig = DisplayConfig.getGameConfig();

  // 将静态方法附加到配置对象，供场景使用
  newConfig.getCameraConfig = DisplayConfig.getCameraConfig.bind(DisplayConfig);
  newConfig.calculateCameraZoom = DisplayConfig.calculateCameraZoom.bind(DisplayConfig);

  game.displayConfig = newConfig;

  // 计算新的游戏尺寸
  const displaySize = DisplayConfig.calculateDisplaySize(window.innerWidth, window.innerHeight);

  // 调用Phaser的resize方法
  if (game.scale && game.isBooted) {
    game.scale.resize(displaySize.width, displaySize.height);
  }

  // 通知所有场景更新
  game.scene.scenes.forEach(scene => {
    if (scene && scene.handleDisplayResize) {
      scene.handleDisplayResize(newConfig);
    }
  });

  console.log('[Main] 游戏已resize:', `${displaySize.width}x${displaySize.height}`);
}

// 监听开始游戏事件
window.addEventListener('startGame', () => {
  console.log('[Main] 收到开始游戏事件');
  initGame();
});

// 处理窗口大小变化 - 使用防抖避免卡顿
let resizeTimeout = null;
window.addEventListener('resize', () => {
  if (!game) return;

  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }

  resizeTimeout = setTimeout(() => {
    console.log('[Main] 窗口大小变化');
    handleGameResize();
  }, 150);
});

// 导出供其他模块使用
export { game, displayConfig };
