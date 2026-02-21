import { GameConfig } from '../config/GameConfig.js';

/**
 * 塔子弹类
 * 三阶段状态：飞行 -> 滚动（初始方向） -> 滚动（反方向） -> 销毁
 */
export class TowerBullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'gemini');

    this.config = GameConfig.towerBullet;

    // 状态管理
    this.state = 'flying'; // 'flying', 'rolling_initial', 'rolling_opposite'
    this.currentVelocity = 0;
    this.rollDirection = 1; // 1 = 右, -1 = 左
    this.rollDistance = 0;
    this.targetRollDistance = this.config.initialRollDistance;
    this.isDamaging = false; // 只有滚动阶段才有伤害

    // 伤害值
    this.damage = this.config.damage;

    // 添加到场景
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 初始状态
    this.setActive(false);
    this.setVisible(false);
  }

  /**
   * 初始化物理体（在添加到场景后调用）
   */
  initPhysics() {
    if (!this.body) {
      this.scene.physics.add.existing(this);
    }
    if (this.body) {
      this.setDisplaySize(this.config.size, this.config.size);
      this.body.setSize(this.config.size, this.config.size);
      this.body.setAllowGravity(false);
    }
  }

  /**
   * 发射子弹
   * @param {number} x - 起始X坐标
   * @param {number} y - 起始Y坐标
   * @param {number} targetX - 目标X坐标
   * @param {number} targetY - 目标Y坐标
   */
  fire(x, y, targetX, targetY) {
    // 确保物理体已初始化
    this.initPhysics();

    // 检查物理体是否有效
    if (!this.body) {
      console.warn('[TowerBullet] 物理体初始化失败，无法发射');
      return;
    }

    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);

    // 重置状态
    this.state = 'flying';
    this.currentVelocity = 0;
    this.rollDistance = 0;
    this.isDamaging = false;
    this.setRotation(0);

    // 计算飞行方向
    const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
    const velocity = this.scene.physics.velocityFromRotation(angle, this.config.flySpeed);
    this.setVelocity(velocity.x, velocity.y);

    // 设置旋转朝向飞行方向
    this.setRotation(angle);
  }

  /**
   * 碰撞到平台/地面，进入滚动阶段
   */
  onHitPlatform() {
    if (this.state !== 'flying') return;

    this.state = 'rolling_initial';
    this.isDamaging = true;
    this.currentVelocity = 0;
    this.rollDistance = 0;

    // 随机选择滚动方向（左或右）
    this.rollDirection = Math.random() < 0.5 ? -1 : 1;

    // 停止垂直速度，开始横向滚动
    this.setVelocityY(0);
  }

  /**
   * 预更新（每帧调用）
   */
  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (!this.active) return;

    const dt = delta / 1000; // 转换为秒

    switch (this.state) {
      case 'flying':
        this.updateFlying();
        break;
      case 'rolling_initial':
        this.updateRollingInitial(dt);
        break;
      case 'rolling_opposite':
        this.updateRollingOpposite(dt);
        break;
    }

    // 检查是否超出世界边界
    this.checkBounds();
  }

  /**
   * 更新飞行状态
   */
  updateFlying() {
    // 飞行阶段保持当前速度，不需要特殊处理
    // 旋转跟随速度方向
    const velocity = this.body.velocity;
    if (velocity.x !== 0 || velocity.y !== 0) {
      const angle = Math.atan2(velocity.y, velocity.x);
      this.setRotation(angle);
    }
  }

  /**
   * 更新初始滚动阶段
   * @param {number} dt - 时间增量（秒）
   */
  updateRollingInitial(dt) {
    // 应用加速度
    const targetVelocity = this.rollDirection * this.config.rollSpeed;
    const accel = this.config.rollAcceleration * dt;

    if (this.currentVelocity < targetVelocity) {
      this.currentVelocity = Math.min(this.currentVelocity + accel, targetVelocity);
    } else if (this.currentVelocity > targetVelocity) {
      this.currentVelocity = Math.max(this.currentVelocity - accel, targetVelocity);
    }

    // 应用速度
    this.setVelocityX(this.currentVelocity);
    this.setVelocityY(0);

    // 根据移动方向旋转（滚动效果）
    // 旋转速度与实际滚动速度成正比
    const rotationSpeed = (this.currentVelocity / this.config.rollSpeed) * this.config.rollAcceleration * 0.01;
    this.rotation += rotationSpeed * dt * this.rollDirection;

    // 累计滚动距离
    this.rollDistance += Math.abs(this.currentVelocity * dt);

    // 检查是否达到初始滚动距离
    if (this.rollDistance >= this.targetRollDistance) {
      this.state = 'rolling_opposite';
      this.rollDirection *= -1; // 反向
      this.currentVelocity = 0; // 重置速度，重新加速
    }
  }

  /**
   * 更新反向滚动阶段
   * @param {number} dt - 时间增量（秒）
   */
  updateRollingOpposite(dt) {
    // 应用加速度
    const targetVelocity = this.rollDirection * this.config.rollSpeed;
    const accel = this.config.rollAcceleration * dt;

    if (this.currentVelocity < targetVelocity) {
      this.currentVelocity = Math.min(this.currentVelocity + accel, targetVelocity);
    } else if (this.currentVelocity > targetVelocity) {
      this.currentVelocity = Math.max(this.currentVelocity - accel, targetVelocity);
    }

    // 应用速度
    this.setVelocityX(this.currentVelocity);
    this.setVelocityY(0);

    // 根据移动方向旋转
    const rotationSpeed = (this.currentVelocity / this.config.rollSpeed) * this.config.rollAcceleration * 0.01;
    this.rotation += rotationSpeed * dt * this.rollDirection;
  }

  /**
   * 检查是否超出世界边界
   */
  checkBounds() {
    const bounds = this.scene.physics.world.bounds;
    const margin = 100; // 边界余量

    if (
      this.x < bounds.x - margin ||
      this.x > bounds.x + bounds.width + margin ||
      this.y < bounds.y - margin ||
      this.y > bounds.y + bounds.height + margin
    ) {
      this.deactivate();
    }
  }

  /**
   * 停用子弹（回收到对象池）
   */
  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    this.state = 'flying';
    this.isDamaging = false;
  }

  /**
   * 获取当前伤害值
   * @returns {number} 伤害值（非滚动阶段返回0）
   */
  getDamage() {
    return this.isDamaging ? this.damage : 0;
  }
}
