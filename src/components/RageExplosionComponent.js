import { GameConfig } from '../config/GameConfig.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { ExplosionParticleSystem } from '../systems/ExplosionParticleSystem.js';

/**
 * 怒气爆发组件
 * 管理"我气炸了"技能的效果：
 * - 9秒积攒时间，期间玩家贴图逐渐变红
 * - 积攒完成后半透明
 * - 受到伤害时触发爆炸，对周围敌人造成伤害
 * - 爆炸后重新积攒
 */
export class RageExplosionComponent {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.config = GameConfig.rageExplosion;

    this.isCharging = false;
    this.chargeProgress = 0;
    this.isReady = false;

    this.chargeEvent = null;
    this.originalAlpha = 1;
  }

  /**
   * 开始积攒怒气
   */
  startCharging() {
    if (this.isCharging) return;

    this.isCharging = true;
    this.chargeProgress = 0;
    this.isReady = false;
    this.originalAlpha = this.player.alpha;

    // 清除之前的色调
    this.player.clearTint();
    this.player.setAlpha(this.originalAlpha);

    // 创建积攒更新事件
    this.chargeEvent = this.scene.time.addEvent({
      delay: 50, // 每50ms更新一次
      callback: this.updateCharge,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * 更新积攒进度
   */
  updateCharge() {
    if (!this.isCharging || !this.player.active) {
      this.stopCharging();
      return;
    }

    this.chargeProgress += 50;
    const ratio = Math.min(this.chargeProgress / this.config.chargeTime, 1);

    // 从白色(0xFFFFFF)渐变到红色(0xFF0000)
    const r = 255;
    const g = Math.floor(255 * (1 - ratio));
    const b = Math.floor(255 * (1 - ratio));
    const color = (r << 16) | (g << 8) | b;

    this.player.setTint(color);

    // 积攒完成
    if (ratio >= 1) {
      this.onChargeComplete();
    }
  }

  /**
   * 积攒完成
   */
  onChargeComplete() {
    this.isReady = true;
    // 设置半透明
    this.player.setAlpha(this.config.tintAlpha);
  }

  /**
   * 停止积攒
   */
  stopCharging() {
    if (this.chargeEvent) {
      this.chargeEvent.remove();
      this.chargeEvent = null;
    }
    this.isCharging = false;
  }

  /**
   * 玩家受到伤害时的回调
   */
  onPlayerDamaged() {
    if (this.isReady) {
      this.explode();
    }
  }

  /**
   * 触发爆炸
   */
  explode() {
    // 停止积攒
    this.stopCharging();

    // 播放爆炸音效
    AudioSystem.getInstance(this.scene).playSFX('sfx_explosion');

    // 创建爆炸视觉效果
    this.createExplosionEffect();

    // 对周围敌人造成伤害
    this.damageNearbyEnemies();

    // 屏幕震动
    this.scene.cameras.main.shake(300, 0.03);

    // 重置玩家外观
    this.player.clearTint();
    this.player.setAlpha(this.originalAlpha);

    // 重新开始积攒
    this.scene.time.delayedCall(500, () => {
      if (this.player.active) {
        this.startCharging();
      }
    });
  }

  /**
   * 创建爆炸视觉效果
   */
  createExplosionEffect() {
    if (this.scene.explosionParticleSystem) {
      this.scene.explosionParticleSystem.createExplosion(
        this.player.x,
        this.player.y,
        ExplosionParticleSystem.getConfigs().explosiveEnemy
      );
    }
  }

  /**
   * 对周围敌人造成伤害
   */
  damageNearbyEnemies() {
    const enemies = this.scene.enemies;
    if (!enemies) return;

    enemies.getChildren().forEach(enemy => {
      if (enemy.active && !enemy.isDead) {
        const distance = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          enemy.x,
          enemy.y
        );
        if (distance <= this.config.explosionRadius) {
          enemy.takeDamage(this.config.explosionDamage);
        }
      }
    });
  }

  /**
   * 销毁组件
   */
  destroy() {
    this.stopCharging();
    if (this.player.active) {
      this.player.clearTint();
      this.player.setAlpha(this.originalAlpha);
    }
  }
}
