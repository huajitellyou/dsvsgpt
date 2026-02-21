import { AssetConfig } from '../config/AssetConfig.js';

/**
 * 统一资源加载器
 * 封装Phaser的加载逻辑，提供一致的加载接口
 */
export class AssetLoader {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * 加载单个资源
   * @param {string} key - 资源键名
   */
  load(key) {
    const asset = AssetConfig.assets[key];
    if (!asset) {
      console.warn(`Asset not found: ${key}`);
      return;
    }

    const path = AssetConfig.getPath(key);

    switch (asset.type) {
      case 'image':
        this.scene.load.image(key, path);
        break;
      case 'spritesheet':
        this.scene.load.spritesheet(key, path, asset.config);
        break;
      case 'json':
        this.scene.load.json(key, path);
        break;
      case 'audio':
        this.scene.load.audio(key, path);
        break;
      default:
        console.warn(`Unknown asset type: ${asset.type}`);
    }
  }

  /**
   * 批量加载资源
   * @param {string[]} keys - 资源键名数组
   */
  loadMany(keys) {
    keys.forEach(key => this.load(key));
  }

  /**
   * 按类别加载资源
   * @param {string} category - 类别名称
   */
  loadCategory(category) {
    const keys = Object.keys(AssetConfig.assets).filter(key => {
      const path = AssetConfig.assets[key].path;
      return path.includes(`/${category}/`);
    });
    this.loadMany(keys);
  }

  /**
   * 加载游戏所需的所有资源
   */
  loadGameAssets() {
    this.loadCategory('characters');
    this.loadCategory('environment');
    this.loadCategory('items');
    this.loadMany(['skills']);
    this.loadAudioAssets();
  }

  /**
   * 加载音频资源
   */
  loadAudioAssets() {
    const audioKeys = [
      'bgm',
      'sfx_level_up',
      'sfx_exp_pickup',
      'sfx_explosion'
    ];

    audioKeys.forEach(key => {
      const asset = AssetConfig.assets[key];
      if (asset) {
        const path = AssetConfig.getPath(key);
        this.scene.load.audio(key, path);
      }
    });

    console.log('[AssetLoader] 音频资源加载请求已发送');
  }
}
