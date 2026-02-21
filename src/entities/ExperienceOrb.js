import { BaseEntity } from './base/BaseEntity.js';
import { GameConfig } from '../config/GameConfig.js';
import { AudioSystem } from '../systems/AudioSystem.js';

export class ExperienceOrb extends BaseEntity {
  constructor(scene, x, y) {
    super(scene, x, y, 'experience');

    const expConfig = GameConfig.experience;

    this.expValue = expConfig.baseValue;
    this.attractionSpeed = 400;
    this.collectionDistance = expConfig.pickupDistance;
    this.attractionRange = expConfig.magnetDistance;
    this.isOnGround = false;

    this.body.setAllowGravity(true);
    this.body.setGravityY(800);
    this.body.setBounce(0.3);
    this.body.setImmovable(false);

    const displaySize = 24;
    this.setDisplaySize(displaySize, displaySize);
    this.body.setSize(displaySize * 0.8, displaySize * 0.8);

    this.setAlpha(0.9);
    this.body.setDrag(50, 0);
  }

  onUpdate() {
    if (!this.active) return;

    // 经验球的更新逻辑在碰撞时处理
  }

  update(player) {
    if (!this.active || !player || !player.active) {
      return;
    }

    this.isOnGround = this.body.touching.down || this.body.onFloor();

    this.moveTowardsPlayer(player);

    if (this.checkCollection(player)) {
      this.collect(player);
    }
  }

  moveTowardsPlayer(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.attractionRange && distance > 0) {
      const speedMultiplier = 1 + (this.attractionRange - distance) / this.attractionRange;
      const velocityX = (dx / distance) * this.attractionSpeed * speedMultiplier;
      const velocityY = (dy / distance) * this.attractionSpeed * speedMultiplier;

      this.setVelocity(velocityX, velocityY);
      this.body.setAllowGravity(false);
    } else {
      this.body.setAllowGravity(true);
    }
  }

  checkCollection(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < this.collectionDistance;
  }

  collect(player) {
    if (player && player.gainExperience) {
      player.gainExperience(this.expValue);
    }

    // 播放拾取音效
    AudioSystem.getInstance(this.scene).playSFX('sfx_exp_pickup');

    this.createCollectionEffect();
    this.destroy();
  }

  createCollectionEffect() {
    const particles = this.scene.add.particles(this.x, this.y, 'experience', {
      speed: { min: 50, max: 100 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      quantity: 5,
      emitting: false
    });

    particles.explode(5);

    this.scene.time.delayedCall(600, () => {
      if (particles.active) {
        particles.destroy();
      }
    });
  }
}
