import { BaseEnemy } from '../base/BaseEnemy.js';
import { GameConfig } from '../../config/GameConfig.js';
import { AudioSystem } from '../../systems/AudioSystem.js';
import { TowerHeadEnemy } from './TowerHeadEnemy.js';

/**
 * 塔G - 塔状敌人
 * 由底座和旋转的头部组成，定期向玩家发射子弹
 */
export class TowerEnemy extends BaseEnemy {
  constructor(scene, x, y) {
    const config = GameConfig.towerEnemy;
    // 使用塔底座作为主体纹理
    super(scene, x, y, 'tower_base', config);

    this.config = config;

    // 设置底座尺寸
    const baseWidth = 100;
    const baseHeight = 100;
    this.setDisplaySize(baseWidth, baseHeight);
    this.body.setSize(baseWidth, baseHeight);

    // 禁用重力（塔站在平台上不动）
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);

    // 创建塔头（旋转部分）
    this.towerHead = scene.add.sprite(x, y - baseHeight / 2 - 30, 'tower_head');
    this.towerHead.setDisplaySize(80, 80);
    this.towerHead.setDepth(this.depth + 1);

    // 旋转相关
    this.headRotation = 0;
    this.rotationSpeed = Phaser.Math.DegToRad(this.config.rotationSpeed); // 转换为弧度

    // 射击相关
    this.lastFireTime = 0;
    this.fireInterval = this.config.fireInterval;
    this.target = null;

    // 血条位置调整（塔比较高）
    this.destroyHealthBar();
    this.createHealthBar();
  }

  /**
   * 创建血条（重写以适应塔的高度）
   */
  createHealthBar() {
    const barWidth = 80;
    const barHeight = 8;
    const barY = -120; // 塔比较高，血条往上移

    this.healthBarBg = this.scene.add.rectangle(0, barY, barWidth, barHeight, 0x333333, 1);
    this.healthBarBg.setDepth(100);

    this.healthBarFill = this.scene.add.graphics();
    this.healthBarFill.setDepth(101);

    this.updateHealthBar();
  }

  /**
   * 更新血条位置
   */
  updateHealthBar() {
    if (!this.active || !this.healthBarFill) return;

    const barWidth = 80;
    const barHeight = 8;
    const barY = this.y - 120;

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
   * 设置目标（玩家）
   */
  setTarget(target) {
    this.target = target;
  }

  /**
   * 更新
   */
  onUpdate(time, delta) {
    if (this.isDead || !this.active) return;

    // 确保time是有效数字（GameScene可能传递player对象作为参数）
    if (typeof time !== 'number') {
      time = this.scene.time.now;
    }

    // 更新血条
    this.updateHealthBar();

    // 旋转塔头
    this.updateHeadRotation(time, delta);

    // 尝试射击
    if (this.target && this.target.active) {
      this.tryFire(time);
    }
  }

  /**
   * 更新塔头旋转
   */
  updateHeadRotation(time, delta) {
    // 持续旋转
    this.headRotation += this.rotationSpeed * (delta / 1000);
    this.towerHead.setRotation(this.headRotation);

    // 更新塔头位置（跟随底座）
    const headOffsetY = 65; // 头部在底座上方
    this.towerHead.setPosition(this.x, this.y - headOffsetY);
  }

  /**
   * 尝试射击
   */
  tryFire(time) {
    if (time - this.lastFireTime < this.fireInterval) {
      return;
    }

    // 检查目标是否有效
    if (!this.target || !this.target.active) {
      return;
    }

    // 发射子弹
    this.fireBullet();

    // 更新最后射击时间
    this.lastFireTime = time;
  }

  /**
   * 发射子弹
   */
  fireBullet() {
    // 检查目标是否有效
    if (!this.target || !this.target.active) {
      return;
    }

    // 从塔头位置发射
    const bulletX = this.towerHead.x;
    const bulletY = this.towerHead.y;

    // 获取子弹组并发射
    if (this.scene.towerBullets) {
      const bullet = this.scene.towerBullets.get(bulletX, bulletY);
      if (bullet && bullet.fire) {
        bullet.fire(bulletX, bulletY, this.target.x, this.target.y);
        // 播放射击音效（音频文件暂缺）
        // AudioSystem.getInstance(this.scene).playSFX('sfx_shoot');
      }
    }
  }

  /**
   * 受到伤害（重写以保留塔的视觉反馈）
   */
  takeDamage(damage) {
    if (this.isDead) return;

    this.health -= damage;
    this.updateHealthBar();

    // 播放被击中音效（音频文件暂缺）
    // AudioSystem.getInstance(this.scene).playSFX('sfx_enemy_hit');

    // 底座和头部都闪烁红色
    this.setTint(0xff0000);
    this.towerHead.setTint(0xff0000);

    this.scene.time.delayedCall(100, () => {
      if (this.active) {
        this.clearTint();
      }
      if (this.towerHead && this.towerHead.active) {
        this.towerHead.clearTint();
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

    // 生成塔头敌人（从塔头位置）
    this.spawnTowerHead();

    // 销毁塔头精灵
    if (this.towerHead) {
      this.towerHead.destroy();
      this.towerHead = null;
    }

    // 销毁底座
    this.destroy();
  }

  /**
   * 生成塔头敌人
   */
  spawnTowerHead() {
    const headX = this.towerHead ? this.towerHead.x : this.x;
    const headY = this.towerHead ? this.towerHead.y : this.y - 65;

    try {
      const towerHeadEnemy = new TowerHeadEnemy(this.scene, headX, headY);

      // 检查是否成功创建（有物理体）
      if (!towerHeadEnemy.body) {
        console.warn('[TowerEnemy] 塔头敌人创建失败，物理体为null');
        towerHeadEnemy.destroy();
        return;
      }

      towerHeadEnemy.setTarget(this.target);

      // 添加到场景和敌人组
      if (this.scene.enemies) {
        this.scene.enemies.add(towerHeadEnemy);
      }
    } catch (error) {
      console.error('[TowerEnemy] 生成塔头敌人时出错:', error);
    }
  }

  /**
   * 销毁
   */
  destroy() {
    // 销毁塔头
    if (this.towerHead) {
      this.towerHead.destroy();
      this.towerHead = null;
    }

    this.destroyHealthBar();
    super.destroy();
  }
}
