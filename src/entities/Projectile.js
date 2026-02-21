import { BaseEntity } from './base/BaseEntity.js';

export class Projectile extends BaseEntity {
  constructor(scene, x, y) {
    super(scene, x, y, 'arrow');

    this.damage = 50;
    this.pierceCount = 0;
    this.hitEnemies = new Set();

    this.setActive(false);
    this.setVisible(false);

    // 设置贴图和物理体大小一致（扩大为原来的2倍）
    const displaySize = 128;
    this.setDisplaySize(displaySize, displaySize);
    this.body.setSize(displaySize, displaySize);

    this.body.setAllowGravity(false);
  }

  fire(x, y, angle, speed, damage) {
    this.setPosition(x, y);
    this.damage = damage || 50;

    const velocity = this.scene.physics.velocityFromRotation(angle, speed);
    this.setVelocity(velocity.x, velocity.y);
    this.setRotation(angle + Math.PI / 2);

    this.hitEnemies.clear();
    this.activate();
  }

  onUpdate() {
    if (!this.active) return;

    const bounds = this.scene.physics.world.bounds;

    if (
      this.x < bounds.x ||
      this.x > bounds.x + bounds.width ||
      this.y < bounds.y ||
      this.y > bounds.y + bounds.height
    ) {
      this.deactivate();
    }
  }

  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
  }
}
