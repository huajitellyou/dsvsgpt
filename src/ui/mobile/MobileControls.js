import { VirtualJoystick } from './VirtualJoystick.js';
import { TouchButton } from './TouchButton.js';
import { DeviceDetector } from '../../utils/DeviceDetector.js';

/**
 * MobileControls - 移动端控制器
 * 整合左侧移动摇杆、右侧射击摇杆和跳跃按钮
 */
export class MobileControls {
  /**
   * @param {Phaser.Scene} scene - 游戏场景
   */
  constructor(scene) {
    this.scene = scene;

    // 检测是否为移动设备
    this.isMobile = DeviceDetector.isMobile();

    if (!this.isMobile) {
      console.log('[MobileControls] 非移动设备，不创建控制器');
      return;
    }

    console.log('[MobileControls] 检测到移动设备，创建控制器');

    // 创建控件容器
    this.createContainer();

    // 控制状态
    this.moveDirection = 0; // -1(左) 0(停) 1(右)
    this.fireAngle = 0;
    this.isFiring = false;
    this.jumpPressed = false;

    // 射击定时器
    this.fireInterval = 250; // 每秒4发 = 250ms间隔
    this.fireTimer = null;

    // 创建控件
    this.createMoveJoystick();
    this.createFireJoystick();
    this.createJumpButton();
    this.createRollButton();

    // 初始隐藏，等待横屏
    this.updateVisibility();
    this.bindOrientationEvents();
  }

  createContainer() {
    // 使用现有的 game-ui-container 或创建新的
    this.container = document.getElementById('mobile-controls-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'mobile-controls-container';
      this.container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1500;
      `;
      document.body.appendChild(this.container);
    }
  }

  /**
   * 创建左侧移动摇杆（只能左右移动）
   */
  createMoveJoystick() {
    this.moveJoystick = new VirtualJoystick(this.container, {
      position: 'left',
      size: 120,
      lockY: true, // 锁定Y轴，只能左右移动
      onMove: (direction, _angle) => {
        // 设置移动方向（只取X分量）
        const threshold = 0.3; // 死区阈值
        if (direction.x < -threshold) {
          this.moveDirection = -1;
        } else if (direction.x > threshold) {
          this.moveDirection = 1;
        } else {
          this.moveDirection = 0;
        }
      },
      onEnd: () => {
        this.moveDirection = 0;
      }
    });
  }

  /**
   * 创建右侧射击摇杆
   */
  createFireJoystick() {
    this.fireJoystick = new VirtualJoystick(this.container, {
      position: 'right',
      size: 120,
      lockY: false, // 可以360度瞄准
      onMove: (_direction, angle) => {
        this.fireAngle = angle;

        // 如果还没开始射击，启动射击
        if (!this.isFiring) {
          this.startFiring();
        }
      },
      onEnd: () => {
        this.stopFiring();
      }
    });
  }

  /**
   * 创建跳跃按钮
   */
  createJumpButton() {
    this.jumpButton = new TouchButton(this.container, {
      position: 'right',
      size: 70,
      label: '跳',
      offsetX: 100,
      offsetY: -130,
      onPress: () => {
        this.jumpPressed = true;
        // 触发跳跃
        if (this.scene && this.scene.player) {
          this.scene.player.jump();
        }
      },
      onRelease: () => {
        this.jumpPressed = false;
      }
    });
  }

  /**
   * 创建翻滚按钮
   */
  createRollButton() {
    this.rollButton = new TouchButton(this.container, {
      position: 'right',
      size: 70,
      label: '滚',
      offsetX: 10,
      offsetY: -25,
      onPress: () => {
        // 触发翻滚
        if (this.scene && this.scene.player) {
          this.scene.player.roll();
        }
      }
    });
  }

  /**
   * 开始连续射击
   */
  startFiring() {
    if (this.isFiring) return;

    this.isFiring = true;

    // 立即发射第一发
    this.fire();

    // 启动定时器连续发射
    this.fireTimer = setInterval(() => {
      this.fire();
    }, this.fireInterval);
  }

  /**
   * 停止射击
   */
  stopFiring() {
    this.isFiring = false;

    if (this.fireTimer) {
      clearInterval(this.fireTimer);
      this.fireTimer = null;
    }
  }

  /**
   * 发射箭矢
   */
  fire() {
    if (!this.scene || !this.scene.player) return;

    const player = this.scene.player;

    // 计算目标位置（基于摇杆角度）
    const distance = 500; // 虚拟目标距离
    const targetX = player.x + Math.cos(this.fireAngle) * distance;
    const targetY = player.y + Math.sin(this.fireAngle) * distance;

    // 调用玩家的射击方法
    player.fireWeapon(targetX, targetY, player.getAttackPower());
  }

  /**
   * 更新方法 - 每帧调用
   */
  update() {
    if (!this.isMobile || !this.scene || !this.scene.player) return;

    // 处理移动
    const player = this.scene.player;

    if (this.moveDirection < 0) {
      player.moveLeft();
    } else if (this.moveDirection > 0) {
      player.moveRight();
    } else {
      player.stop();
    }

    // 跳跃在按钮回调中已处理
  }

  /**
   * 检测是否为横屏
   */
  isLandscape() {
    return DeviceDetector.isLandscape();
  }

  /**
   * 更新控件可见性
   */
  updateVisibility() {
    const visible = this.isMobile && this.isLandscape();

    if (this.moveJoystick) {
      this.moveJoystick.element.style.display = visible ? 'block' : 'none';
    }
    if (this.fireJoystick) {
      this.fireJoystick.element.style.display = visible ? 'block' : 'none';
    }
    if (this.jumpButton) {
      this.jumpButton.element.style.display = visible ? 'flex' : 'none';
    }
    if (this.rollButton) {
      this.rollButton.element.style.display = visible ? 'flex' : 'none';
    }
  }

  /**
   * 绑定屏幕方向事件
   */
  bindOrientationEvents() {
    this.handleOrientationChange = () => {
      // 延迟执行，等待屏幕旋转完成
      setTimeout(() => this.updateVisibility(), 100);
    };

    if (screen.orientation) {
      screen.orientation.addEventListener('change', this.handleOrientationChange);
    }

    window.addEventListener('resize', this.handleOrientationChange);
    window.addEventListener('orientationchange', this.handleOrientationChange);
  }

  /**
   * 销毁控制器
   */
  destroy() {
    // 停止射击
    this.stopFiring();

    // 移除事件监听
    if (screen.orientation) {
      screen.orientation.removeEventListener('change', this.handleOrientationChange);
    }
    window.removeEventListener('resize', this.handleOrientationChange);
    window.removeEventListener('orientationchange', this.handleOrientationChange);

    // 销毁控件
    if (this.moveJoystick) {
      this.moveJoystick.destroy();
      this.moveJoystick = null;
    }
    if (this.fireJoystick) {
      this.fireJoystick.destroy();
      this.fireJoystick = null;
    }
    if (this.jumpButton) {
      this.jumpButton.destroy();
      this.jumpButton = null;
    }
    if (this.rollButton) {
      this.rollButton.destroy();
      this.rollButton = null;
    }

    // 移除容器
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.container = null;
    this.scene = null;
  }
}
