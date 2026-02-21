import { GameConfig } from '../../config/GameConfig.js';
import { AudioSystem } from '../../systems/AudioSystem.js';
import { ExperienceOrb } from '../ExperienceOrb.js';

/**
 * 紫G - 塔头敌人
 * 击败塔状敌人后生成，向玩家方向惯性滚动
 */
export class TowerHeadEnemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'tower_head');

    this.config = GameConfig.towerHeadEnemy;

    // 基础属性
    this.maxHealth = this.config.health;
    this.health = this.maxHealth;
    this.damage = this.config.damage;
    this.experienceValue = this.config.baseExperience;
    this.isDead = false;

    // 惯性移动相关
    this.currentVelocityX = 0;
    this.currentVelocityY = 0;
    this.maxSpeed = this.config.maxSpeed;
    this.acceleration = this.config.acceleration;
    this.friction = this.config.friction;

    // 目标
    this.target = null;

    // 旋转相关
    this.rotationSpeed = Phaser.Math.DegToRad(this.config.rotationSpeed);

    // 添加到场景
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 初始化物理体
    this.initPhysics();

    // 创建血条
    this.createHealthBar();
  }

  /**
   * 初始化物理体
   */
  initPhysics() {
    if (!this.body) {
      this.scene.physics.add.existing(this);
    }
    if (this.body) {
      this.setDisplaySize(80, 80);
      this.body.setSize(80, 80);
      this.body.setAllowGravity(false);
    }
  }

  /**
   * 创建血条
   */
  createHealthBar() {
    const barWidth = 60;
    const barHeight = 6;
    const barY = -50;

    this.healthBarBg = this.scene.add.rectangle(0, barY, barWidth, barHeight, 0x333333, 1);
    this.healthBarBg.setDepth(100);

    this.healthBarFill = this.scene.add.graphics();
    this.healthBarFill.setDepth(101);

    this.updateHealthBar();
  }

  /**
   * 更新血条
   */
  updateHealthBar() {
    if (!this.active || !this.healthBarFill || this.isDead) return;

    const barWidth = 60;
    const barHeight = 6;
    const barY = this.y - 50;

    this.healthBarBg.setPosition(this.x, barY);

    const healthPercent = Math.max(0, this.health / this.maxHealth);
    const fillWidth = barWidth * healthPercent;

    this.healthBarFill.clear();

    let color;
    if (healthPercent > 0.6) {
      color = 0x00cc44;
    } else if (healthPercent > 0.3) {
      color = 0xffaa00;
    } else {
      color = 0xcc0000;
    }

    this.healthBarFill.fillStyle(color, 1);
    this.healthBarFill.fillRect(this.x - barWidth / 2, barY - barHeight / 2, fillWidth, barHeight);
  }

  /**
   * 销毁血条
   */
  destroyHealthBar() {
    if (this.healthBarBg) {
      this.healthBarBg.destroy();
      this.healthBarBg = null;
    }
    if (this.healthBarFill) {
      this.healthBarFill.destroy();
      this.healthBarFill = null;
    }
  }

  /**
   * 设置目标
   */
  setTarget(target) {
    this.target = target;
  }

  /**
   * 预更新
   */
  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (this.isDead || !this.active) return;

    const dt = delta / 1000;

    // 更新血条
    this.updateHealthBar();

    // 更新移动（惯性）
    this.updateMovement(dt);

    // 更新旋转（根据滚动方向）
    this.updateRotation(dt);
  }

  /**
   * 更新移动（惯性物理）
   */
  updateMovement(dt) {
    if (!this.target || !this.target.active) return;

    // 计算朝向玩家的方向
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 10) {
      // 归一化方向
      const dirX = dx / distance;
      const dirY = dy / distance;

      // 应用加速度
      this.currentVelocityX += dirX * this.acceleration * dt;
      this.currentVelocityY += dirY * this.acceleration * dt;

      // 限制最大速度
      const currentSpeed = Math.sqrt(
        this.currentVelocityX * this.currentVelocityX +
        this.currentVelocityY * this.currentVelocityY
      );

      if (currentSpeed > this.maxSpeed) {
        const scale = this.maxSpeed / currentSpeed;
        this.currentVelocityX *= scale;
        this.currentVelocityY *= scale;
      }
    } else {
      // 靠近目标时应用摩擦力减速
      this.applyFriction(dt);
    }

    // 应用速度
    this.setVelocity(this.currentVelocityX, this.currentVelocityY);
  }

  /**
   * 应用摩擦力
   */
  applyFriction(dt) {
    const speed = Math.sqrt(
      this.currentVelocityX * this.currentVelocityX +
      this.currentVelocityY * this.currentVelocityY
    );

    if (speed > 0) {
      const frictionFactor = Math.max(0, speed - this.friction * dt) / speed;
      this.currentVelocityX *= frictionFactor;
      this.currentVelocityY *= frictionFactor;
    }
  }

  /**
   * 更新旋转（根据滚动方向）
   */
  updateRotation(dt) {
    // 根据水平移动方向旋转
    if (Math.abs(this.currentVelocityX) > 10) {
      const rotationDirection = this.currentVelocityX > 0 ? 1 : -1;
      const speedRatio = Math.abs(this.currentVelocityX) / this.maxSpeed;
      this.rotation += this.rotationSpeed * speedRatio * rotationDirection * dt;
    }
  }

  /**
   * 受到伤害
   */
  takeDamage(damage) {
    if (this.isDead) return;

    this.health -= damage;
    this.updateHealthBar();

    // 播放被击中音效（音频文件暂缺）
    // AudioSystem.getInstance(this.scene).playSFX('sfx_enemy_hit');

    // 闪烁效果
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active) {
        this.clearTint();
      }
    });

    if (this.health <= 0) {
      this.die();
    }
  }

  /**
   * 死亡处理
   */
  die() {
    if (this.isDead) return;

    this.isDead = true;

    // 播放死亡音效（音频文件暂缺）
    // AudioSystem.getInstance(this.scene).playSFX('sfx_enemy_die');

    // 销毁血条
    this.destroyHealthBar();

    // 掉落经验
    this.spawnExperienceOrb();

    // 销毁
    this.destroy();
  }

  /**
   * 掉落经验球
   */
  spawnExperienceOrb() {
    if (this.scene && this.scene.spawnExperienceOrbs) {
      const orbCount = Phaser.Math.Between(2, 4);
      this.scene.spawnExperienceOrbs(this.x, this.y, orbCount);
    }
  }

  /**
   * 获取对玩家的伤害
   */
  getDamageToPlayer(playerLevel) {
    const config = GameConfig.enemy.damageToPlayer;
    const levelBonus = (playerLevel - 1) * config.levelMultiplier;
    return this.damage + levelBonus;
  }

  /**
   * 销毁
   */
  destroy() {
    this.destroyHealthBar();
    super.destroy();
  }
}
