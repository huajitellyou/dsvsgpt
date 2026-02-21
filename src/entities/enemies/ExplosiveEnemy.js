import { BaseEnemy } from '../base/BaseEnemy.js';
import { GameConfig } from '../../config/GameConfig.js';
import { AudioSystem } from '../../systems/AudioSystem.js';
import { ExplosionParticleSystem } from '../../systems/ExplosionParticleSystem.js';

/**
 * 爆G - 爆炸敌人
 * 死亡时爆炸，对周围敌人和玩家造成伤害
 */
export class ExplosiveEnemy extends BaseEnemy {
  constructor(scene, x, y) {
    const config = GameConfig.explosiveEnemy;
    super(scene, x, y, 'gpt', config);

    // 设置显示尺寸 - 比基础敌人大20像素
    const displayWidth = 140;
    const displayHeight = 140;
    this.setDisplaySize(displayWidth, displayHeight);
    this.body.setSize(displayWidth, displayHeight);

    // 应用橙黄色半透明色调
    this.setTint(0xFFA500);
    this.setAlpha(0.8);

    // 设置重力
    this.body.setGravityY(1000);
    this.setFlipX(true);

    // 爆炸参数
    this.explosionDamage = config.explosionDamage;
    this.explosionRadius = config.explosionRadius;
    this.hasExploded = false;
  }

  init() {
    // 爆炸敌人特有的初始化
  }

  /**
   * 受到伤害 - 重写以保留橙黄色色调
   * @param {number} damage - 伤害值
   */
  takeDamage(damage) {
    if (this.isDead) return;

    this.health -= damage;
    this.updateHealthBar();

    // 受到攻击时闪烁红色
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active) {
        // 恢复橙黄色色调而不是清除色调
        this.setTint(0xFFA500);
      }
    });

    if (this.health <= 0) {
      this.die();
    }
  }

  /**
   * 死亡处理 - 触发爆炸
   */
  die() {
    if (this.isDead) return;

    this.isDead = true;

    // 触发爆炸效果
    this.explode();

    this.destroyHealthBar();
    this.spawnExperienceOrb();
    this.destroy();
  }

  /**
   * 爆炸效果
   */
  explode() {
    if (this.hasExploded) return;
    this.hasExploded = true;

    // 播放爆炸音效
    AudioSystem.getInstance(this.scene).playSFX('sfx_explosion');

    // 创建爆炸视觉效果
    this.createExplosionEffect();

    // 对周围敌人造成伤害
    this.damageNearbyEnemies();

    // 对玩家造成伤害（如果在范围内）
    this.damagePlayerIfInRange();
  }

  /**
   * 创建爆炸视觉效果
   */
  createExplosionEffect() {
    // 使用粒子系统创建爆炸效果
    if (this.scene.explosionParticleSystem) {
      this.scene.explosionParticleSystem.createExplosion(
        this.x,
        this.y,
        ExplosionParticleSystem.getConfigs().explosiveEnemy
      );
    }

    // 屏幕震动效果
    this.scene.cameras.main.shake(300, 0.03);
  }

  /**
   * 对周围敌人造成伤害
   */
  damageNearbyEnemies() {
    const enemies = this.scene.enemies;
    if (!enemies) return;

    enemies.getChildren().forEach(enemy => {
      if (enemy !== this && enemy.active && !enemy.isDead) {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
        if (distance <= this.explosionRadius) {
          enemy.takeDamage(this.explosionDamage);
        }
      }
    });
  }

  /**
   * 对玩家造成伤害（如果在爆炸范围内）
   */
  damagePlayerIfInRange() {
    const player = this.scene.player;
    if (!player || !player.active) return;

    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (distance <= this.explosionRadius) {
      player.takeDamage(this.explosionDamage);
    }
  }
}
