import { BaseEntity } from './base/BaseEntity.js';
import { ArrowWeapon } from './ArrowWeapon.js';
import { GameConfig } from '../config/GameConfig.js';
import { AudioSystem } from '../systems/AudioSystem.js';

export class Player extends BaseEntity {
  constructor(scene, x, y) {
    super(scene, x, y, 'deepseek');

    const playerConfig = GameConfig.player;

    this.speed = playerConfig.baseSpeed;
    this.jumpPower = playerConfig.baseJumpPower;
    this.isFacingRight = true;

    this.level = 1;
    this.experience = 0;
    this.expToNextLevel = playerConfig.growth.experienceNeeded(1);
    this.score = 0;
    this.maxHealth = playerConfig.baseHealth;
    this.currentHealth = this.maxHealth;
    this.baseAttack = playerConfig.baseAttack;
    this.currentAttack = this.baseAttack;
    this.experienceMultiplier = 1.0;

    this.setCollideWorldBounds(true);
    this.setBounce(0.1);
    this.setDrag(500);

    const displaySize = 154;
    this.body.setSize(displaySize, displaySize);
    this.body.setOffset((this.width - displaySize) / 2, (this.height - displaySize) / 2);
    this.setDisplaySize(displaySize, displaySize);

    this.body.setGravityY(1500);

    this.weapon = new ArrowWeapon(scene, this);

    this.invulnerable = false;
    this.invulnerableTime = playerConfig.invincibilityDuration;

    this.maxJumps = 2;
    this.remainingJumps = this.maxJumps;
    this.coyoteTime = 100;
    this.coyoteTimer = 0;
    this.wasOnGround = false;
    this.jumpBufferTime = 100;
    this.jumpBufferTimer = 0;

    // 怒气爆发组件
    this.rageExplosionComponent = null;

    // 翻滚相关属性
    this.rollLevel = 1;                    // 翻滚等级
    this.rollDamageBonus = 0;              // 翻滚伤害加成（来自"创4你"技能）
    this.isRolling = false;                // 是否正在翻滚
    this.rollCooldownTimer = 0;            // 翻滚冷却计时器
    this.rollCooldown = GameConfig.roll.cooldown;
    this.isRollInvulnerable = false;       // 翻滚期间无敌状态
  }

  init() {
    // 玩家特有的初始化逻辑
  }

  moveLeft() {
    this.setVelocityX(-this.speed);
    if (this.isFacingRight) {
      this.setFlipX(false);
      this.isFacingRight = false;
    }
  }

  moveRight() {
    this.setVelocityX(this.speed);
    if (!this.isFacingRight) {
      this.setFlipX(true);
      this.isFacingRight = true;
    }
  }

  stop() {
    this.setVelocityX(0);
  }

  jump() {
    if (this.remainingJumps > 0 || this.coyoteTimer > 0) {
      this.setVelocityY(-this.jumpPower);
      this.remainingJumps--;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
    } else {
      this.jumpBufferTimer = this.jumpBufferTime;
    }
  }

  onUpdate(time, delta) {
    if (this.weapon) {
      this.weapon.update();
    }

    this.updateJumpMechanics();
    this.updateRollCooldown(delta);
  }

  updateJumpMechanics() {
    const isOnGround = this.body.touching.down || this.body.onFloor();

    if (isOnGround) {
      this.remainingJumps = this.maxJumps;
      this.coyoteTimer = this.coyoteTime;

      if (this.jumpBufferTimer > 0) {
        this.setVelocityY(-this.jumpPower);
        this.remainingJumps--;
        this.jumpBufferTimer = 0;
      }
    } else {
      if (this.coyoteTimer > 0) {
        this.coyoteTimer -= 16;
      }
    }

    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= 16;
    }

    this.wasOnGround = isOnGround;
  }

  fireWeapon(targetX, targetY, damage) {
    if (this.weapon) {
      this.weapon.fire(targetX, targetY, damage || this.currentAttack);
      // 播放射击音效（音频文件暂缺）
      // AudioSystem.getInstance(this.scene).playSFX('sfx_shoot');
    }
  }

  getWeaponProjectiles() {
    return this.weapon ? this.weapon.getProjectiles() : null;
  }

  gainExperience(amount) {
    const finalAmount = Math.floor(amount * this.experienceMultiplier);
    this.experience += finalAmount;

    if (this.experience >= this.expToNextLevel) {
      this.levelUp();
    }

    if (this.scene && this.scene.updateUI) {
      this.scene.updateUI();
    }
  }

  levelUp() {
    const growthConfig = GameConfig.player.growth;
    this.level++;
    this.experience -= this.expToNextLevel;
    this.expToNextLevel = Math.floor(this.expToNextLevel * growthConfig.experienceMultiplier);
    this.maxHealth += growthConfig.healthPerLevel;
    this.currentAttack += growthConfig.attackPerLevel;

    if (this.scene && this.scene.showLevelUpEffect) {
      this.scene.showLevelUpEffect();
    }
  }

  getAttackPower() {
    return this.currentAttack;
  }

  heal(amount) {
    this.currentHealth = Math.min(this.currentHealth + amount, this.maxHealth);
    if (this.scene && this.scene.updateUI) {
      this.scene.updateUI();
    }
  }

  takeDamage(damage) {
    // 翻滚期间无敌或已有无敌状态
    if (this.isRollInvulnerable || this.invulnerable || !this.active) {
      return;
    }

    this.currentHealth -= damage;

    // 播放受伤音效（音频文件暂缺）
    // AudioSystem.getInstance(this.scene).playSFX('sfx_player_hit');

    // 触发怒气爆发组件（如果存在且已准备好）
    if (this.rageExplosionComponent) {
      this.rageExplosionComponent.onPlayerDamaged();
    }

    // 只有在没有怒气爆发组件或组件未准备好时才显示受伤闪烁
    if (!this.rageExplosionComponent || !this.rageExplosionComponent.isReady) {
      this.setTint(0xff0000);
      this.scene.time.delayedCall(200, () => {
        if (this.active) {
          this.clearTint();
        }
      });
    }

    this.invulnerable = true;
    this.scene.time.delayedCall(this.invulnerableTime, () => {
      this.invulnerable = false;
    });

    if (this.currentHealth <= 0) {
      this.die();
    }

    if (this.scene && this.scene.updateUI) {
      this.scene.updateUI();
    }
  }

  addScore(points) {
    this.score += points;
    if (this.scene && this.scene.updateUI) {
      this.scene.updateUI();
    }
  }

  die() {
    if (this.scene && this.scene.gameOver) {
      this.scene.gameOver();
    }
  }

  getLevel() {
    return this.level;
  }

  getScore() {
    return this.score;
  }

  getExperience() {
    return this.experience;
  }

  getExpToNextLevel() {
    return this.expToNextLevel;
  }

  getHealth() {
    return this.currentHealth;
  }

  getMaxHealth() {
    return this.maxHealth;
  }

  /**
   * 设置怒气爆发组件
   * @param {RageExplosionComponent} component - 怒气爆发组件
   */
  setRageExplosionComponent(component) {
    // 如果已有组件，先销毁
    if (this.rageExplosionComponent) {
      this.rageExplosionComponent.destroy();
    }
    this.rageExplosionComponent = component;
  }

  /**
   * 执行翻滚
   * @returns {boolean} 是否成功执行翻滚
   */
  roll() {
    if (this.isRolling || this.rollCooldownTimer > 0) return false;

    this.isRolling = true;
    this.isRollInvulnerable = true;

    const config = GameConfig.roll;
    const direction = this.isFacingRight ? 1 : -1;

    // 计算目标位置（限制在世界边界内）
    const worldWidth = GameConfig.world.width;
    let targetX = this.x + direction * config.distance;
    targetX = Phaser.Math.Clamp(targetX, 50, worldWidth - 50);

    // 计算翻滚伤害
    const damage = config.baseDamage + (this.rollLevel - 1) * config.damagePerLevel + this.rollDamageBonus;

    // 创建翻滚动画和移动
    this.performRollAnimation(config.duration, config.rotations);
    this.performRollMovement(targetX, config.duration);

    // 对路径上的敌人造成伤害
    this.dealRollDamage(damage);

    // 设置冷却
    this.rollCooldownTimer = this.rollCooldown;

    // 定时结束翻滚状态
    this.scene.time.delayedCall(config.duration, () => {
      this.endRoll();
    });

    return true;
  }

  /**
   * 执行翻滚动画
   * @param {number} duration - 动画持续时间
   * @param {number} rotations - 旋转周数
   */
  performRollAnimation(duration, rotations) {
    this.scene.tweens.add({
      targets: this,
      angle: 360 * rotations * (this.isFacingRight ? 1 : -1),
      duration: duration,
      ease: 'Linear'
    });
  }

  /**
   * 执行翻滚移动
   * @param {number} targetX - 目标X坐标
   * @param {number} duration - 移动持续时间
   */
  performRollMovement(targetX, duration) {
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      duration: duration,
      ease: 'Quad.easeOut'
    });
  }

  /**
   * 对翻滚路径上的敌人造成伤害
   * @param {number} damage - 伤害值
   */
  dealRollDamage(damage) {
    if (!this.scene || !this.scene.enemies) return;

    const enemies = this.scene.enemies.getChildren();
    enemies.forEach(enemy => {
      if (enemy.active && this.isEnemyInRollPath(enemy)) {
        enemy.takeDamage(damage);
      }
    });
  }

  /**
   * 检查敌人是否在翻滚路径上
   * @param {BaseEnemy} enemy - 敌人实体
   * @returns {boolean} 是否在路径上
   */
  isEnemyInRollPath(enemy) {
    const direction = this.isFacingRight ? 1 : -1;
    const dx = enemy.x - this.x;

    // 敌人在面向方向，且在翻滚距离内
    if (direction > 0 && dx > 0 && dx < GameConfig.roll.distance) {
      const dy = Math.abs(enemy.y - this.y);
      return dy < 100; // 垂直方向容错范围
    }
    if (direction < 0 && dx < 0 && Math.abs(dx) < GameConfig.roll.distance) {
      const dy = Math.abs(enemy.y - this.y);
      return dy < 100;
    }
    return false;
  }

  /**
   * 结束翻滚
   */
  endRoll() {
    this.isRolling = false;
    this.isRollInvulnerable = false;
    this.setAngle(0);
  }

  /**
   * 升级翻滚技能
   */
  upgradeRoll() {
    this.rollLevel++;
  }

  /**
   * 增加翻滚伤害
   * @param {number} bonus - 伤害加成值
   */
  addRollDamageBonus(bonus) {
    this.rollDamageBonus += bonus;
  }

  /**
   * 更新翻滚冷却
   * @param {number} delta - 时间增量
   */
  updateRollCooldown(delta) {
    if (this.rollCooldownTimer > 0) {
      this.rollCooldownTimer -= delta;
      if (this.rollCooldownTimer < 0) {
        this.rollCooldownTimer = 0;
      }
    }
  }
}
