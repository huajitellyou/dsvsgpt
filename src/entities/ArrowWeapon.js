import { Projectile } from './Projectile.js';
import { GameConfig } from '../config/GameConfig.js';

export class ArrowWeapon {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    const weaponConfig = GameConfig.weapon.arrow;

    this.arrowOffset = 30;
    this.tripleShot = false;
    this.arrowSpeedMultiplier = 1.0;
    this.baseDamage = weaponConfig.baseDamage;
    this.pierceCount = 0;

    this.arrowSprite = scene.add.image(0, 0, 'arrow');
    this.arrowSprite.setScale(weaponConfig.scale);
    this.arrowSprite.setOrigin(0.5, 0.5);

    this.projectiles = scene.add.group({
      maxSize: 30,
      runChildUpdate: true
    });

    // 预创建箭矢对象池
    for (let i = 0; i < 30; i++) {
      const projectile = new Projectile(scene, 0, 0, 'arrow');
      this.projectiles.add(projectile);
    }

    this.update();
  }

  update() {
    if (!this.player || !this.arrowSprite) {
      return;
    }

    const playerX = this.player.x;
    const playerY = this.player.y;

    let arrowX;
    if (this.player.isFacingRight) {
      arrowX = playerX + this.arrowOffset;
      this.arrowSprite.setFlipX(false);
    } else {
      arrowX = playerX - this.arrowOffset;
      this.arrowSprite.setFlipX(true);
    }

    const arrowY = playerY - 10;

    this.arrowSprite.setPosition(arrowX, arrowY);
  }

  fire(targetX, targetY, damage) {
    const startX = this.arrowSprite.x;
    const startY = this.arrowSprite.y;

    const baseAngle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);
    const speed = this.getArrowSpeed();

    if (this.tripleShot) {
      // 三连射：中间箭 + 两侧箭偏转15度（约0.26弧度）
      const angles = [baseAngle - 0.26, baseAngle, baseAngle + 0.26];
      for (const angle of angles) {
        const projectile = this.projectiles.getFirstDead(false);
        if (projectile) {
          projectile.fire(startX, startY, angle, speed, damage);
          projectile.pierceCount = this.pierceCount;
        }
      }
    } else {
      // 单发射击
      const projectile = this.projectiles.getFirstDead(false);
      if (projectile) {
        projectile.fire(startX, startY, baseAngle, speed, damage);
        projectile.pierceCount = this.pierceCount;
      }
    }
  }

  enableTripleShot() {
    this.tripleShot = true;
  }

  addPierce(count) {
    this.pierceCount += count;
  }

  increaseArrowSpeed(multiplier) {
    this.arrowSpeedMultiplier += multiplier;
  }

  getArrowSpeed() {
    return GameConfig.weapon.arrow.baseSpeed * this.arrowSpeedMultiplier;
  }

  getProjectiles() {
    return this.projectiles;
  }

  destroy() {
    if (this.arrowSprite) {
      this.arrowSprite.destroy();
      this.arrowSprite = null;
    }

    if (this.projectiles) {
      this.projectiles.clear(true, true);
      this.projectiles = null;
    }

    this.player = null;
    this.scene = null;
  }
}
