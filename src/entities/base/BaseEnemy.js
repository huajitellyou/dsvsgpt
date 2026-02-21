import { BaseEntity } from './BaseEntity.js';
import { GameConfig } from '../../config/GameConfig.js';
import { AudioSystem } from '../../systems/AudioSystem.js';

/**
 * 敌人基类
 * 所有敌人类型的抽象基类
 */
export class BaseEnemy extends BaseEntity {
  constructor(scene, x, y, texture, config = {}) {
    super(scene, x, y, texture);

    // 基础属性
    this.config = { ...GameConfig.enemy, ...config };
    this.maxHealth = this.config.baseHealth;
    this.health = this.maxHealth;
    this.speed = this.config.baseSpeed;
    this.damage = this.config.baseDamage;
    this.experienceValue = this.config.baseExperience;

    // AI状态
    this.aiState = 'idle';
    this.target = null;
    this.lastAttackTime = 0;
    this.isDead = false;

    // 成长相关
    this.gameStartTime = scene.time.now;
    this.lastGrowthTime = scene.time.now;
    this.speedGrowthRate = 5;
    this.healthGrowthAmount = 10;

    // 跳跃相关
    const aiConfig = this.config.ai || {};
    this.jumpCooldown = aiConfig.jumpCooldown || 1500;
    this.lastJumpTime = 0;
    this.jumpProbability = aiConfig.jumpProbability || 0.03;
    this.jumpPower = 600;
    this.shouldJump = false;
    this.jumpThreshold = aiConfig.jumpThreshold || 120;
    this.walkOffPlatformDelay = aiConfig.walkOffPlatformDelay || 300;
    this.platformEdgeThreshold = aiConfig.platformEdgeThreshold || 40;

    // 物理设置
    this.setCollideWorldBounds(true);
    this.setBounce(0.1);

    // 创建血条
    this.createHealthBar();
  }

  init() {
    // 子类可重写
  }

  /**
   * 创建血条
   */
  createHealthBar() {
    const barWidth = 80;
    const barHeight = 8;
    const barY = -70;

    this.healthBarBg = this.scene.add.rectangle(0, barY, barWidth, barHeight, 0x333333, 1);
    this.healthBarBg.setDepth(100);

    this.healthBarFill = this.scene.add.graphics();
    this.healthBarFill.setDepth(101);

    this.updateHealthBar();
  }

  /**
   * 更新血条显示
   */
  updateHealthBar() {
    if (!this.active || !this.healthBarFill) return;

    const barWidth = 80;
    const barHeight = 8;
    const barY = this.y - 70;

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
   * @param {BaseEntity} target - 目标实体
   */
  setTarget(target) {
    this.target = target;
  }

  onUpdate(time, delta) {
    super.onUpdate(time, delta);

    if (this.isDead || !this.active) return;

    this.updateGrowth();
    this.updateHealthBar();

    if (this.target && this.target.active) {
      this.chasePlayer(this.target);
      this.tryJump();
      this.tryWalkOffPlatform();
    }
  }

  /**
   * 成长更新
   */
  updateGrowth() {
    const currentTime = this.scene.time.now;
    const elapsedTime = currentTime - this.lastGrowthTime;

    if (elapsedTime >= this.growthInterval) {
      this.health += this.healthGrowthAmount;
      this.speed += this.speedGrowthRate;
      this.lastGrowthTime = currentTime;
    }
  }

  /**
   * 追击玩家
   */
  chasePlayer(player) {
    const directionX = player.x - this.x;
    const directionY = player.y - this.y;
    const distanceX = Math.abs(directionX);
    const distanceY = Math.abs(directionY);

    // 水平移动逻辑
    if (distanceX > 5) {
      // 检查场景中是否有塔敌人，有则加速30%
      let speedMultiplier = 1;
      if (this.scene.towerEnemies && this.scene.towerEnemies.countActive() > 0) {
        speedMultiplier = 1.3;
      }

      const velocityX = directionX > 0 ? this.speed * speedMultiplier : -this.speed * speedMultiplier;
      this.setVelocityX(velocityX);

      if (directionX > 0) {
        this.setFlipX(true);
      } else {
        this.setFlipX(false);
      }
    } else {
      this.setVelocityX(0);
    }

    // 智能判断是否需要跳跃
    this.shouldJumpToReachPlayer(distanceY, directionY, distanceX);
  }

  /**
   * 判断是否需要跳跃来接近玩家
   * @param {number} distanceY - 垂直距离
   * @param {number} directionY - 垂直方向（负值表示玩家在上方）
   * @param {number} distanceX - 水平距离
   */
  shouldJumpToReachPlayer(distanceY, directionY, distanceX) {
    // 如果玩家在上方且垂直距离大于跳跃阈值，需要跳跃
    if (directionY < 0 && distanceY > this.jumpThreshold) {
      // 玩家在上方，尝试跳跃
      this.shouldJump = true;
    }
    // 如果玩家在上方但距离不远，且水平距离较大，也尝试跳跃（平台间移动）
    else if (directionY < 0 && distanceY > 50 && distanceX < 200 && distanceX > 50) {
      this.shouldJump = true;
    }
  }

  /**
   * 尝试跳跃
   */
  tryJump() {
    const currentTime = this.scene.time.now;

    // 检查冷却时间
    if (currentTime - this.lastJumpTime < this.jumpCooldown) {
      return;
    }

    // 只有在地面上才能跳跃
    if (!this.body.touching.down && !this.body.onFloor()) {
      return;
    }

    // 智能判断：如果需要跳跃来接近玩家
    if (this.shouldJump) {
      this.setVelocityY(-this.jumpPower);
      this.lastJumpTime = currentTime;
      this.shouldJump = false;
      return;
    }

    // 随机跳跃（保持原有的随机行为）
    if (Math.random() < this.jumpProbability) {
      this.setVelocityY(-this.jumpPower);
      this.lastJumpTime = currentTime;
    }
  }

  /**
   * 尝试走下平台
   * 当玩家在正下方时使用
   */
  tryWalkOffPlatform() {
    if (!this.target || !this.target.active) return;

    const directionY = this.target.y - this.y;
    const distanceX = Math.abs(this.target.x - this.x);

    // 如果玩家在正下方且水平距离很小
    if (directionY > 50 && distanceX < this.platformEdgeThreshold) {
      // 暂时禁用与平台的向下碰撞，让敌人可以落下
      this.body.checkCollision.down = false;

      // 一段时间后恢复碰撞
      this.scene.time.delayedCall(this.walkOffPlatformDelay, () => {
        if (this.active) {
          this.body.checkCollision.down = true;
        }
      });
    }
  }

  /**
   * 受到伤害
   * @param {number} damage - 伤害值
   */
  takeDamage(damage) {
    if (this.isDead) return;

    this.health -= damage;
    this.updateHealthBar();

    // 播放被击中音效（音频文件暂缺）
    // AudioSystem.getInstance(this.scene).playSFX('sfx_enemy_hit');

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

    this.destroyHealthBar();
    this.spawnExperienceOrb();
    this.destroy();
  }

  /**
   * 掉落经验球
   */
  spawnExperienceOrb() {
    if (this.scene && this.scene.spawnExperienceOrbs) {
      const orbCount = Phaser.Math.Between(2, 6);
      this.scene.spawnExperienceOrbs(this.x, this.y, orbCount);
    }
  }

  /**
   * 获取对玩家的伤害
   */
  getDamageToPlayer(playerLevel) {
    const config = GameConfig.enemy.damageToPlayer;
    const levelBonus = (playerLevel - 1) * config.levelMultiplier;
    return config.baseDamage + levelBonus;
  }

  destroy() {
    this.destroyHealthBar();
    super.destroy();
  }
}
