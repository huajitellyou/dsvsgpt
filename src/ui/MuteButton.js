import { AudioSystem } from '../systems/AudioSystem.js';

/**
 * 静音按钮组件 - DOM 实现
 * 使用 DOM 元素创建简洁的静音/非静音切换按钮
 * 固定在屏幕左上角，与其他 UI 组件实现方式一致
 */
export class MuteButton {
  /**
   * @param {Phaser.Scene} scene - Phaser场景
   */
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.buttonElement = null;
    this.iconElement = null;
    this.audioSystem = AudioSystem.getInstance(scene);
    this.isVisible = false;
  }

  /**
   * 创建按钮
   */
  create() {
    // 检查是否已存在按钮
    this.container = document.getElementById('mute-button-container');
    if (this.container) {
      this.container.remove();
    }

    // 创建按钮容器
    this.container = document.createElement('div');
    this.container.id = 'mute-button-container';
    this.container.className = 'mute-button-container';

    // 创建按钮
    this.buttonElement = document.createElement('button');
    this.buttonElement.className = 'mute-button';
    this.buttonElement.setAttribute('aria-label', '切换静音');
    this.buttonElement.setAttribute('title', '点击切换静音');

    // 创建图标容器
    this.iconElement = document.createElement('div');
    this.iconElement.className = 'mute-icon';
    this.iconElement.innerHTML = this.getVolumeIconSVG();

    // 组装按钮
    this.buttonElement.appendChild(this.iconElement);
    this.container.appendChild(this.buttonElement);

    // 添加到 body
    document.body.appendChild(this.container);

    // 绑定事件
    this.buttonElement.addEventListener('click', () => this.onClick());
    this.buttonElement.addEventListener('mouseenter', () => this.onHover());
    this.buttonElement.addEventListener('mouseleave', () => this.onOut());

    // 初始状态更新
    this.updateVisual();
    this.isVisible = true;

    console.log('[MuteButton] DOM 按钮已创建');
    return this;
  }

  /**
   * 获取音量图标 SVG
   */
  getVolumeIconSVG() {
    return `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
  }

  /**
   * 获取静音图标 SVG
   */
  getMuteIconSVG() {
    return `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/>
        <path d="M23 9l-6 6M17 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
  }

  /**
   * 点击处理
   */
  onClick() {
    const isMuted = this.audioSystem.toggleMute();
    this.updateVisual();

    // 播放点击反馈（如果取消静音）
    if (!isMuted) {
      // 可以在这里播放一个测试音效
    }

    console.log('[MuteButton] 静音状态切换:', isMuted);
  }

  /**
   * 悬停处理
   */
  onHover() {
    if (this.buttonElement) {
      this.buttonElement.classList.add('hover');
    }
  }

  /**
   * 离开处理
   */
  onOut() {
    if (this.buttonElement) {
      this.buttonElement.classList.remove('hover');
    }
  }

  /**
   * 更新视觉状态
   */
  updateVisual() {
    if (!this.iconElement) return;

    const isMuted = this.audioSystem.isMuted();
    if (isMuted) {
      this.iconElement.innerHTML = this.getMuteIconSVG();
      this.buttonElement.classList.add('muted');
    } else {
      this.iconElement.innerHTML = this.getVolumeIconSVG();
      this.buttonElement.classList.remove('muted');
    }
  }

  /**
   * 显示按钮
   */
  show() {
    this.isVisible = true;
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  /**
   * 隐藏按钮
   */
  hide() {
    this.isVisible = false;
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * 销毁按钮
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.buttonElement = null;
    this.iconElement = null;
    this.isVisible = false;
  }
}
