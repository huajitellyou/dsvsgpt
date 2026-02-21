/**
 * TouchButton - DOM触摸按钮组件
 * 支持点击和长按操作
 */
export class TouchButton {
  /**
   * @param {HTMLElement} container - 父容器
   * @param {Object} options - 配置选项
   * @param {string} options.position - 位置 'left' 或 'right'
   * @param {number} options.size - 按钮大小
   * @param {string} options.label - 按钮标签文字
   * @param {Function} options.onPress - 按下回调 () => void
   * @param {Function} options.onRelease - 释放回调 () => void
   */
  constructor(container, options = {}) {
    this.container = container;
    this.position = options.position || 'right';
    this.size = options.size || 70;
    this.label = options.label || '';
    this.onPress = options.onPress || null;
    this.onRelease = options.onRelease || null;
    this.offsetX = options.offsetX || 0;
    this.offsetY = options.offsetY || 0;

    // 按钮状态
    this.pressed = false;
    this.touchId = null;

    // 创建DOM元素
    this.createElement();

    // 绑定事件
    this.bindEvents();
  }

  createElement() {
    // 按钮容器
    this.element = document.createElement('div');
    this.element.className = `touch-button button-${this.position}`;

    // 计算基础位置
    const basePosition = 160;
    const finalPosition = basePosition - this.offsetX;
    const finalBottom = 40 - this.offsetY;

    this.element.style.cssText = `
      position: absolute;
      bottom: ${finalBottom}px;
      ${this.position}: ${finalPosition}px;
      width: ${this.size}px;
      height: ${this.size}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      border: 3px solid rgba(255, 255, 255, 0.5);
      touch-action: none;
      pointer-events: auto;
      z-index: 100;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: ${this.size * 0.35}px;
      font-weight: bold;
      color: rgba(255, 255, 255, 0.9);
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      user-select: none;
      -webkit-user-select: none;
      transition: background 0.1s ease, transform 0.1s ease;
    `;

    if (this.label) {
      this.element.textContent = this.label;
    }

    this.container.appendChild(this.element);
  }

  bindEvents() {
    // 触摸开始
    this.handleTouchStart = (e) => {
      e.preventDefault();
      
      if (this.pressed) return;
      
      const touch = e.changedTouches[0];
      this.touchId = touch.identifier;
      this.pressed = true;
      
      // 视觉反馈
      this.element.style.background = 'rgba(255, 255, 255, 0.4)';
      this.element.style.transform = 'scale(0.95)';

      if (this.onPress) {
        this.onPress();
      }
    };

    // 触摸结束
    this.handleTouchEnd = (e) => {
      e.preventDefault();
      
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.touchId) {
          this.resetButton();
          break;
        }
      }
    };

    // 添加事件监听
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });
  }

  resetButton() {
    this.pressed = false;
    this.touchId = null;
    
    // 恢复视觉
    this.element.style.background = 'rgba(255, 255, 255, 0.2)';
    this.element.style.transform = 'scale(1)';

    if (this.onRelease) {
      this.onRelease();
    }
  }

  /**
   * 显示按钮
   */
  show() {
    this.element.style.display = 'flex';
  }

  /**
   * 隐藏按钮
   */
  hide() {
    this.element.style.display = 'none';
  }

  /**
   * 销毁按钮
   */
  destroy() {
    // 移除事件监听
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchEnd);
    
    // 移除DOM元素
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    this.element = null;
    this.container = null;
  }
}
