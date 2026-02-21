/**
 * 显示配置管理模块
 * 统一管理游戏画面显示、分辨率、缩放和适配
 * 严格遵循 Phaser 4 最佳实践
 */
import { DeviceDetector } from './DeviceDetector.js';

export class DisplayConfig {
  // 设计分辨率基准 - 720p 标准
  static DESIGN_WIDTH = 1280;
  static DESIGN_HEIGHT = 720;
  static DESIGN_ASPECT = 1280 / 720; // 16:9

  /**
   * 检测设备类型和特性
   */
  static detectDevice() {
    const dpr = window.devicePixelRatio || 1;

    // 检测屏幕宽高比类型
    const screenAspect = window.innerWidth / window.innerHeight;
    let aspectRatioType = 'standard';
    if (screenAspect >= 2.0) {
      aspectRatioType = 'ultrawide'; // 超宽屏 21:9 或更宽
    } else if (screenAspect >= 1.7) {
      aspectRatioType = 'widescreen'; // 宽屏 16:9
    } else if (screenAspect <= 1.3) {
      aspectRatioType = 'narrow'; // 窄屏 4:3 或更窄
    }

    // 检测是否为移动设备
    const isMobile = DeviceDetector.isMobile();

    // 检测是否为横屏
    const isLandscape = DeviceDetector.isLandscape();

    return {
      dpr: Math.min(dpr, 3), // 限制最大DPR为3，避免性能问题
      aspectRatioType,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      screenAspect,
      isMobile,
      isLandscape
    };
  }

  /**
   * 计算最佳游戏配置
   * 核心策略：使用RESIZE模式适应屏幕，填充整个视口
   */
  static getGameConfig() {
    const device = this.detectDevice();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const screenAspect = screenWidth / screenHeight;

    // 基础配置
    const config = {
      dpr: device.dpr,
      aspectRatioType: device.aspectRatioType,
      screenAspect: device.screenAspect,

      // 固定设计分辨率 - 1080p
      designWidth: this.DESIGN_WIDTH,
      designHeight: this.DESIGN_HEIGHT,

      // 实际渲染分辨率（考虑DPR）
      resolution: device.dpr,

      // 缩放模式配置 - 使用RESIZE填充整个屏幕
      scaleMode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,

      // 最小/最大尺寸限制
      minWidth: 320,
      minHeight: 180,
      maxWidth: 5120,
      maxHeight: 2880,

      // 渲染质量设置
      pixelArt: false,
      antialias: true,
      roundPixels: false,
      powerPreference: 'high-performance'
    };

    // 计算实际显示尺寸 - 填充整个屏幕，不保持固定宽高比
    config.displayWidth = screenWidth;
    config.displayHeight = screenHeight;

    // 计算缩放比例 - 基于实际屏幕尺寸与设计尺寸的比例
    config.scaleX = config.displayWidth / config.designWidth;
    config.scaleY = config.displayHeight / config.designHeight;

    // UI缩放因子 - 使用几何平均值确保UI在不同比例屏幕上保持可用
    config.uniformScale = Math.sqrt(config.scaleX * config.scaleY);

    // 最小缩放限制 - 确保UI不会过小
    config.uiScale = Math.max(config.uniformScale, 0.4);

    // 字体缩放
    config.fontScale = Math.max(0.5, Math.min(2.0, config.uniformScale));

    console.log('[DisplayConfig] 屏幕尺寸:', `${screenWidth}x${screenHeight}`);
    console.log('[DisplayConfig] 宽高比类型:', config.aspectRatioType);
    console.log('[DisplayConfig] DPR:', config.dpr);
    console.log('[DisplayConfig] UI缩放:', config.uiScale.toFixed(3));

    return config;
  }

  /**
   * 获取Phaser游戏配置对象
   */
  static getPhaserConfig(scenes) {
    const config = this.getGameConfig();

    return {
      type: Phaser.AUTO,
      parent: 'game-container',
      width: '100%',
      height: '100%',

      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
          width: config.minWidth,
          height: config.minHeight
        },
        max: {
          width: config.maxWidth,
          height: config.maxHeight
        }
      },

      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 800 },
          debug: false,
          fps: 60
        }
      },

      render: {
        pixelArt: config.pixelArt,
        antialias: config.antialias,
        roundPixels: config.roundPixels,
        powerPreference: config.powerPreference,
        batchSize: 4096
      },

      scene: scenes,

      // 禁用上下文菜单
      disableContextMenu: true,

      // 背景色
      backgroundColor: '#000000'
    };
  }

  /**
   * 计算摄像机 zoom 值
   * 策略：以设计高度为基准，确保不同高度下看到的垂直范围一致
   * 宽屏会看到更多水平内容，窄屏看到较少水平内容
   * 
   * @param {number} screenWidth - 当前屏幕宽度
   * @param {number} screenHeight - 当前屏幕高度
   * @returns {number} zoom 值
   */
  static calculateCameraZoom(screenWidth, screenHeight) {
    // 以设计高度为基准计算 zoom
    // 目标：让 screenHeight 像素显示 designHeight 的游戏世界高度
    const zoom = screenHeight / this.DESIGN_HEIGHT;

    console.log('[DisplayConfig] 摄像机 zoom 计算:', {
      screenSize: `${screenWidth}x${screenHeight}`,
      designHeight: this.DESIGN_HEIGHT,
      zoom: zoom.toFixed(4),
      visibleWidth: (screenWidth / zoom).toFixed(1),
      visibleHeight: (screenHeight / zoom).toFixed(1)
    });

    return zoom;
  }

  /**
   * 获取摄像机配置
   * @param {number} screenWidth - 当前屏幕宽度
   * @param {number} screenHeight - 当前屏幕高度
   * @returns {Object} 摄像机配置对象
   */
  static getCameraConfig(screenWidth, screenHeight) {
    const zoom = this.calculateCameraZoom(screenWidth, screenHeight);

    return {
      zoom: zoom,
      visibleWidth: screenWidth / zoom,
      visibleHeight: screenHeight / zoom,
      designWidth: this.DESIGN_WIDTH,
      designHeight: this.DESIGN_HEIGHT
    };
  }

  /**
   * 计算显示尺寸
   * @param {number} screenWidth - 当前屏幕宽度
   * @param {number} screenHeight - 当前屏幕高度
   * @returns {Object} 显示尺寸对象
   */
  static calculateDisplaySize(screenWidth, screenHeight) {
    return {
      width: screenWidth,
      height: screenHeight
    };
  }
}

// 导出单例配置
export const displayConfig = DisplayConfig.getGameConfig();
