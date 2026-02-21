/**
 * 游戏实体基类
 * 所有游戏实体的抽象基类
 */
export class BaseEntity extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 基础属性
    this.entityId = Phaser.Utils.String.UUID();
    this.isActive = true;

    // 初始化
    this.init();
  }

  /**
   * 初始化方法，子类可重写
   */
  init() {
    // 子类实现
  }

  /**
   * 每帧更新
   * @param {number} time - 当前时间
   * @param {number} delta - 时间增量
   */
  update(time, delta) {
    if (!this.isActive) return;

    this.onUpdate(time, delta);
  }

  /**
   * 更新逻辑，子类重写
   */
  onUpdate(time, delta) {
    // 子类实现
  }

  /**
   * 激活实体
   */
  activate() {
    this.isActive = true;
    this.setVisible(true);
    this.setActive(true);
    if (this.body) {
      this.body.enable = true;
    }
  }

  /**
   * 停用实体
   */
  deactivate() {
    this.isActive = false;
    this.setVisible(false);
    this.setActive(false);
    if (this.body) {
      this.body.enable = false;
    }
  }

  /**
   * 回收实体到对象池
   */
  recycle() {
    this.deactivate();
    this.emit('recycle', this);
  }

  /**
   * 销毁实体
   */
  destroy() {
    this.isActive = false;
    super.destroy();
  }
}
