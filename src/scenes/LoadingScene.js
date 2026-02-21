import { Scene } from 'phaser';
import { AssetLoader } from '../utils/AssetLoader.js';

export class LoadingScene extends Scene {
  constructor() {
    super({ key: 'LoadingScene' });
  }

  preload() {
    // 创建临时的加载进度UI（在preload阶段就可以显示）
    this.createPreloadUI();

    // 监听加载进度（在preload阶段更新）
    this.load.on('progress', (value) => {
      this.updateProgress(value);
    });

    // 监听加载完成
    this.load.on('complete', () => {
      this.onLoadComplete();
    });

    // 监听加载错误
    this.load.on('loaderror', (file) => {
      console.warn(`[LoadingScene] 资源加载失败: ${file.key} (${file.type})`);
    });

    // 加载游戏资源
    const assetLoader = new AssetLoader(this);
    assetLoader.loadGameAssets();
  }

  createPreloadUI() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // 创建渐变背景
    const graphics = this.add.graphics();
    for (let y = 0; y < height; y++) {
      const ratio = y / height;
      const r = Math.floor(135 - ratio * 60);
      const g = Math.floor(206 - ratio * 80);
      const b = Math.floor(235 - ratio * 60);
      graphics.fillStyle((r << 16) | (g << 8) | b, 1);
      graphics.fillRect(0, y, width, 1);
    }

    // 游戏标题
    this.titleText = this.add.text(centerX, centerY - 100, 'Deepseek VS GPT', {
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 加载提示文字
    this.loadingText = this.add.text(centerX, centerY + 20, '正在加载资源...', {
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      fontSize: '20px',
      color: '#cccccc'
    }).setOrigin(0.5);

    // 进度条背景
    const barWidth = Math.min(400, width * 0.8);
    const barHeight = 20;
    this.progressBarBg = this.add.rectangle(
      centerX, centerY + 60,
      barWidth, barHeight,
      0x333333
    );

    // 进度条填充（初始宽度为0）
    this.progressBar = this.add.rectangle(
      centerX - barWidth / 2, centerY + 60,
      0, barHeight - 4,
      0x4a90d9
    ).setOrigin(0, 0.5);

    // 百分比文字
    this.percentText = this.add.text(centerX, centerY + 60, '0%', {
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 保存进度条宽度
    this.barWidth = barWidth;
  }

  create() {
    // 添加标题呼吸动画
    this.tweens.add({
      targets: this.titleText,
      scale: { from: 0.95, to: 1.05 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 如果资源已经加载完成（快速加载的情况）
    if (this.load.isReady()) {
      this.onLoadComplete();
    }
  }

  updateProgress(value) {
    const percent = Math.floor(value * 100);
    if (this.progressBar && this.percentText) {
      this.progressBar.width = (this.barWidth - 4) * value;
      this.percentText.setText(`${percent}%`);
    }
  }

  onLoadComplete() {
    if (this.loadingText) {
      this.loadingText.setText('加载完成！');
    }
    if (this.percentText) {
      this.percentText.setText('100%');
    }

    // 延迟后切换到游戏场景
    this.time.delayedCall(500, () => {
      // 淡出效果
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene');
      });
    });
  }
}
