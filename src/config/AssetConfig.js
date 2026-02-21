/**
 * 资源路径配置中心
 * 统一管理所有资源路径，避免硬编码
 */
export const AssetConfig = {
  // 基础路径
  // 开发时使用相对路径，vite 会将 publicDir 的内容复制到 dist 根目录
  basePath: './',

  // 图片路径
  images: {
    characters: 'images/characters/',
    environment: 'images/environment/',
    items: 'images/items/',
    ui: 'images/ui/'
  },

  // 音频路径
  audio: 'audio/',

  // 数据路径
  data: 'data/',

  // 资源映射表
  assets: {
    // 角色
    'deepseek': { path: 'images/characters/deepseek.png', type: 'image' },
    'gpt': { path: 'images/characters/GPT.png', type: 'image' },
    'gemini': { path: 'images/characters/gemini.png', type: 'image' },
    'tower_base': { path: 'images/characters/塔底座.png', type: 'image' },
    'tower_head': { path: 'images/characters/塔头.png', type: 'image' },

    // 环境
    'sky': { path: 'images/environment/sky.png', type: 'image' },
    'ground': { path: 'images/environment/ground.png', type: 'image' },
    'cloud': { path: 'images/environment/cloud.png', type: 'image' },
    'grass': { path: 'images/environment/grass.png', type: 'image' },

    // 物品
    'arrow': { path: 'images/items/arrow.png', type: 'image' },
    'experience': { path: 'images/items/experience.png', type: 'image' },

    // 数据
    'skills': { path: 'data/skills.json', type: 'json' },

    // 音频 - 背景音乐
    'bgm': { path: 'audio/bgm.mp3', type: 'audio' },
    'menu_bgm': { path: 'audio/menu_bgm.mp3', type: 'audio' },

    // 音频 - 音效
    'sfx_level_up': { path: 'audio/level_up.wav', type: 'audio' },
    'sfx_exp_pickup': { path: 'audio/exp_pickup.wav', type: 'audio' },
    'sfx_explosion': { path: 'audio/explosion.wav', type: 'audio' }
  },

  /**
   * 获取完整资源路径
   * @param {string} key - 资源键名
   * @returns {string} 完整路径
   */
  getPath(key) {
    const asset = this.assets[key];
    return asset ? this.basePath + asset.path : null;
  },

  /**
   * 批量获取资源路径
   * @param {string[]} keys - 资源键名数组
   * @returns {Object} 键值对路径映射
   */
  getPaths(keys) {
    const paths = {};
    keys.forEach(key => {
      paths[key] = this.getPath(key);
    });
    return paths;
  }
};
