/**
 * VirtualJoystick - DOM虚拟摇杆组件
 * 使用纯DOM元素实现流畅的触摸摇杆控制
 */
export class VirtualJoystick {
  /**
   * @param {HTMLElement} container - 父容器
   * @param {Object} options - 配置选项
   * @param {string} options.position - 位置 'left' 或 'right'
   * @param {number} options.size - 摇杆大小
   * @param {Function} options.onMove - 移动回调 (direction: {x, y}, angle: number) => void
   * @param {Function} options.onEnd - 结束回调 () => void
   * @param {boolean} options.lockY - 是否锁定Y轴（仅左右移动）
   */
  constructor(container, options = {}) {
    this.container = container;
    this.position = options.position || 'left';
    this.size = options.size || 120;
    this.onMove = options.onMove || null;
    this.onEnd = options.onEnd || null;
    this.lockY = options.lockY || false;

    // 摇杆状态
    this.active = false;
    this.touchId = null;
    this.direction = { x: 0, y: 0 };
    this.angle = 0;

    // 创建DOM元素
    this.createElement();

    // 绑定事件
    this.bindEvents();

    // 启动动画循环
    this.startAnimationLoop();
  }

  createElement() {
    // 摇杆容器
    this.element = document.createElement('div');
    this.element.className = `virtual-joystick joystick-${this.position}`;
    this.element.style.cssText = `
      position: absolute;
      bottom: 40px;
      ${this.position}: 20px;
      width: ${this.size}px;
      height: ${this.size}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      border: 3px solid rgba(255, 255, 255, 0.4);
      touch-action: none;
      pointer-events: auto;
      z-index: 100;
    `;

    // 摇杆头（可拖动的部分）
    this.knob = document.createElement('div');
    this.knob.className = 'joystick-knob';
    const knobSize = this.size * 0.5;
    this.knob.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: ${knobSize}px;
      height: ${knobSize}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      border: 2px solid rgba(255, 255, 255, 0.8);
      transform: translate(-50%, -50%);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      will-change: transform;
    `;

    this.element.appendChild(this.knob);
    this.container.appendChild(this.element);

    // 记录中心位置
    this.centerX = 0;
    this.centerY = 0;
    this.knobOffsetX = 0;
    this.knobOffsetY = 0;
  }

  bindEvents() {
    // 触摸开始
    this.handleTouchStart = (e) => {
      e.preventDefault();
      
      if (this.active) return;
      
      const touch = e.changedTouches[0];
      this.touchId = touch.identifier;
      this.active = true;
      
      // 更新中心位置
      const rect = this.element.getBoundingClientRect();
      this.centerX = rect.left + rect.width / 2;
      this.centerY = rect.top + rect.height / 2;
    };

    // 触摸移动
    this.handleTouchMove = (e) => {
      e.preventDefault();
      
      if (!this.active) return;
      
      // 找到对应的触摸点
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.touchId) {
          this.updateKnobPosition(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    // 触摸结束
    this.handleTouchEnd = (e) => {
      e.preventDefault();
      
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.touchId) {
          this.resetKnob();
          break;
        }
      }
    };

    // 添加事件监听
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });
  }

  updateKnobPosition(clientX, clientY) {
    // 计算偏移量
    let dx = clientX - this.centerX;
    let dy = clientY - this.centerY;

    // 如果锁定Y轴，只保留X方向移动
    if (this.lockY) {
      dy = 0;
    }

    // 计算距离和最大半径
    const maxRadius = (this.size - this.size * 0.5) / 2;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 限制在圆形范围内
    if (distance > maxRadius) {
      const ratio = maxRadius / distance;
      dx *= ratio;
      dy *= ratio;
    }

    // 存储偏移量（用于动画循环）
    this.knobOffsetX = dx;
    this.knobOffsetY = dy;

    // 计算方向向量 (-1 到 1)
    this.direction.x = dx / maxRadius;
    this.direction.y = dy / maxRadius;

    // 计算角度
    this.angle = Math.atan2(dy, dx);

    // 触发回调
    if (this.onMove) {
      this.onMove(this.direction, this.angle);
    }
  }

  resetKnob() {
    this.active = false;
    this.touchId = null;
    this.direction = { x: 0, y: 0 };
    this.angle = 0;
    this.knobOffsetX = 0;
    this.knobOffsetY = 0;

    // 触发结束回调
    if (this.onEnd) {
      this.onEnd();
    }
  }

  startAnimationLoop() {
    const update = () => {
      // 使用transform进行GPU加速的位置更新
      if (this.knob) {
        this.knob.style.transform = `translate(calc(-50% + ${this.knobOffsetX}px), calc(-50% + ${this.knobOffsetY}px))`;
      }
      
      this.animationId = requestAnimationFrame(update);
    };
    
    this.animationId = requestAnimationFrame(update);
  }

  stopAnimationLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 显示摇杆
   */
  show() {
    this.element.style.display = 'block';
  }

  /**
   * 隐藏摇杆
   */
  hide() {
    this.element.style.display = 'none';
  }

  /**
   * 销毁摇杆
   */
  destroy() {
    this.stopAnimationLoop();
    
    // 移除事件监听
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchEnd);
    
    // 移除DOM元素
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    this.element = null;
    this.knob = null;
    this.container = null;
  }
}
