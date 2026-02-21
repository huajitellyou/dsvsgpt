import { GameConfig } from '../config/GameConfig.js';

/**
 * 音频系统 - 管理背景音乐和音效
 * 使用单例模式确保全局唯一实例
 */
export class AudioSystem {
  static instance = null;

  /**
   * 获取单例实例
   * @param {Phaser.Scene} scene - Phaser场景实例
   * @returns {AudioSystem} 音频系统实例
   */
  static getInstance(scene) {
    if (!AudioSystem.instance) {
      AudioSystem.instance = new AudioSystem(scene);
    } else if (scene) {
      // 更新场景引用
      AudioSystem.instance.scene = scene;
    }
    return AudioSystem.instance;
  }

  /**
   * 销毁单例实例
   */
  static destroyInstance() {
    if (AudioSystem.instance) {
      AudioSystem.instance.destroy();
      AudioSystem.instance = null;
    }
  }

  constructor(scene) {
    this.scene = scene;
    this.bgm = null;
    this.sfx = {};
    this.isInitialized = false;
    this.muted = false;
    this.bgmVolume = GameConfig.audio.bgm.volume;
    this.sfxVolume = GameConfig.audio.sfx.volume;
    this.muteKey = GameConfig.audio.bgm.muteKey;

    // 从本地存储加载静音状态
    this.loadMuteState();
  }

  /**
   * 初始化音频系统
   * 加载并设置音频资源
   */
  init() {
    if (this.isInitialized || !this.scene) return;

    // 创建BGM（检查资源是否存在）
    if (this.scene.cache.audio.exists('bgm')) {
      if (this.scene.sound.get('bgm')) {
        this.bgm = this.scene.sound.get('bgm');
      } else {
        this.bgm = this.scene.sound.add('bgm', {
          volume: this.muted ? 0 : this.bgmVolume,
          loop: true
        });
      }
    } else {
      console.warn('[AudioSystem] BGM 资源不存在，跳过创建');
    }

    // 预创建音效对象（仅当资源存在时）
    const sfxKeys = [
      'sfx_level_up',
      'sfx_exp_pickup',
      'sfx_explosion'
    ];

    sfxKeys.forEach(key => {
      // 检查资源是否存在于缓存中
      if (!this.scene.cache.audio.exists(key)) {
        console.warn(`[AudioSystem] 音效资源不存在: ${key}`);
        return;
      }

      if (this.scene.sound.get(key)) {
        this.sfx[key] = this.scene.sound.get(key);
      } else {
        try {
          this.sfx[key] = this.scene.sound.add(key, {
            volume: this.muted ? 0 : this.sfxVolume
          });
        } catch (e) {
          console.warn(`[AudioSystem] 创建音效失败: ${key}`, e);
        }
      }
    });

    this.isInitialized = true;
    console.log('[AudioSystem] 音频系统初始化完成');
  }

  /**
   * 播放背景音乐
   */
  playBGM() {
    if (!this.isInitialized) this.init();
    if (!this.bgm) {
      console.warn('[AudioSystem] BGM 未创建，无法播放');
      return;
    }

    if (!this.bgm.isPlaying) {
      try {
        this.bgm.play();
        console.log('[AudioSystem] BGM 开始播放');
      } catch (e) {
        console.warn('[AudioSystem] BGM 播放失败:', e);
      }
    }
  }

  /**
   * 停止背景音乐
   */
  stopBGM() {
    if (this.bgm && this.bgm.isPlaying) {
      this.bgm.stop();
      console.log('[AudioSystem] BGM 停止');
    }
  }

  /**
   * 从头重新播放背景音乐
   */
  restartBGM() {
    if (!this.isInitialized) this.init();
    if (!this.bgm) {
      console.warn('[AudioSystem] BGM 未创建，无法重新播放');
      return;
    }

    try {
      this.bgm.stop();
      this.bgm.play();
      console.log('[AudioSystem] BGM 从头重新播放');
    } catch (e) {
      console.warn('[AudioSystem] BGM 重新播放失败:', e);
    }
  }

  /**
   * 播放音效
   * @param {string} key - 音效键名
   */
  playSFX(key) {
    if (!this.isInitialized) this.init();
    if (this.muted) return;

    const sfx = this.sfx[key];
    if (sfx) {
      try {
        // 如果音效正在播放，重新播放
        if (sfx.isPlaying) {
          sfx.stop();
        }
        sfx.play();
      } catch (e) {
        console.warn(`[AudioSystem] 播放音效失败: ${key}`, e);
      }
    } else {
      // 尝试直接播放（如果音效未预创建但存在于缓存）
      if (this.scene.cache.audio.exists(key)) {
        try {
          this.scene.sound.play(key, { volume: this.sfxVolume });
        } catch (e) {
          console.warn(`[AudioSystem] 直接播放音效失败: ${key}`, e);
        }
      }
    }
  }

  /**
   * 设置静音状态
   * @param {boolean} muted - 是否静音
   */
  setMuted(muted) {
    this.muted = muted;

    // 更新BGM音量
    if (this.bgm) {
      this.bgm.setVolume(muted ? 0 : this.bgmVolume);
    }

    // 更新所有音效音量
    Object.values(this.sfx).forEach(sfx => {
      sfx.setVolume(muted ? 0 : this.sfxVolume);
    });

    // 保存到本地存储
    this.saveMuteState();

    console.log('[AudioSystem] 静音状态:', muted);
  }

  /**
   * 切换静音状态
   * @returns {boolean} 切换后的静音状态
   */
  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * 获取当前静音状态
   * @returns {boolean} 是否静音
   */
  isMuted() {
    return this.muted;
  }

  /**
   * 设置BGM音量
   * @param {number} volume - 音量 (0-1)
   */
  setBGMVolume(volume) {
    this.bgmVolume = Phaser.Math.Clamp(volume, 0, 1);
    if (this.bgm && !this.muted) {
      this.bgm.setVolume(this.bgmVolume);
    }
  }

  /**
   * 设置音效音量
   * @param {number} volume - 音量 (0-1)
   */
  setSFXVolume(volume) {
    this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
    if (!this.muted) {
      Object.values(this.sfx).forEach(sfx => {
        sfx.setVolume(this.sfxVolume);
      });
    }
  }

  /**
   * 从本地存储加载静音状态
   */
  loadMuteState() {
    try {
      const savedState = localStorage.getItem(this.muteKey);
      if (savedState !== null) {
        this.muted = savedState === 'true';
      }
    } catch (e) {
      console.warn('[AudioSystem] 无法读取静音状态:', e);
    }
  }

  /**
   * 保存静音状态到本地存储
   */
  saveMuteState() {
    try {
      localStorage.setItem(this.muteKey, this.muted.toString());
    } catch (e) {
      console.warn('[AudioSystem] 无法保存静音状态:', e);
    }
  }

  /**
   * 解锁音频（处理浏览器自动播放限制）
   * 需要在用户首次交互后调用
   */
  unlockAudio() {
    if (this.scene && this.scene.sound && this.scene.sound.locked) {
      this.scene.sound.unlock();
      console.log('[AudioSystem] 音频已解锁');
    }
  }

  /**
   * 销毁音频系统
   */
  destroy() {
    this.stopBGM();

    // 销毁所有音效
    Object.values(this.sfx).forEach(sfx => {
      if (sfx) sfx.destroy();
    });
    this.sfx = {};

    // 销毁BGM
    if (this.bgm) {
      this.bgm.destroy();
      this.bgm = null;
    }

    this.isInitialized = false;
    this.scene = null;
    console.log('[AudioSystem] 音频系统已销毁');
  }
}
