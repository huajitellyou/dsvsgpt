import { Scene } from 'phaser';
import { Player } from '../entities/Player.js';
import { ExperienceOrb } from '../entities/ExperienceOrb.js';
import { SkillSystem } from '../systems/SkillSystem.js';
import { CloudSystem } from '../systems/CloudSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { ExplosionParticleSystem } from '../systems/ExplosionParticleSystem.js';
import { SkillSelectionUI } from '../ui/SkillSelectionUI.js';
import { GameUI } from '../ui/GameUI.js';
import { GameOverUI } from '../ui/GameOverUI.js';
import { MuteButton } from '../ui/MuteButton.js';
import { MobileControls } from '../ui/mobile/MobileControls.js';
import { GameConfig } from '../config/GameConfig.js';
import { LevelManager } from '../core/LevelManager.js';
import { EnemyFactory } from '../entities/enemies/EnemyFactory.js';
import { TowerBullet } from '../entities/TowerBullet.js';

export class GameScene extends Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // 资源已在LoadingScene中加载完成，此处无需重复加载
    // 保留错误监听以防万一
    this.load.on('loaderror', (file) => {
      console.warn(`[GameScene] 资源加载失败: ${file.key} (${file.type})`);
    });
  }

  create() {
    // 获取显示配置
    this.displayConfig = this.game.displayConfig;

    // 游戏世界尺寸（从配置读取）
    this.worldWidth = GameConfig.world.width;
    this.worldHeight = GameConfig.world.height;

    // 初始化音频系统并从头播放BGM
    this.initAudio();

    // 创建天空背景（在关卡之前创建，确保在最底层）
    this.createSkyBackground();

    // 初始化关卡管理器
    this.levelManager = new LevelManager(this);
    this.levelManager.createLevel();

    // 创建云朵系统（在平台之后创建，确保在背景层）
    this.cloudSystem = new CloudSystem(this);

    // 创建爆炸粒子系统
    this.explosionParticleSystem = new ExplosionParticleSystem(this);

    // 创建玩家
    this.createPlayer();

    // 创建敌人系统
    this.createEnemySystem();

    // 设置相机
    this.setupCamera();

    // 创建DOM UI
    this.gameUI = new GameUI(this);
    this.gameUI.show();

    // 创建静音按钮（在右上角）
    this.createMuteButton();

    // 输入设置
    this.setupKeyboard();
    this.setupMouseInput();

    // 技能系统
    this.createSkillSystem();

    // 游戏结束UI
    this.gameOverUI = new GameOverUI(this);

    // 游戏状态
    this.isPaused = false;
    this.isGameOver = false;

    // 创建移动端控制器
    this.mobileControls = new MobileControls(this);

    // 添加淡入效果（从LoadingScene切换过来）
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  /**
   * 初始化音频系统
   */
  initAudio() {
    // 获取音频系统实例
    this.audioSystem = AudioSystem.getInstance(this);
    this.audioSystem.init();

    // 从头重新播放BGM
    this.audioSystem.restartBGM();

    // 监听首次用户交互以解锁音频
    this.input.once('pointerdown', () => {
      this.audioSystem.unlockAudio();
    });

    console.log('[GameScene] 音频系统初始化完成');
  }

  /**
   * 创建静音按钮
   */
  createMuteButton() {
    // DOM 实现的静音按钮，自动固定在屏幕左上角
    this.muteButton = new MuteButton(this);
    this.muteButton.create();

    console.log('[GameScene] 静音按钮已创建');
  }

  /**
   * 创建天空背景
   */
  createSkyBackground() {
    // 创建天空贴图，像地面一样在世界中固定
    // 使用 tileSprite 平铺，覆盖整个世界区域
    this.skyBackground = this.add.tileSprite(
      this.worldWidth / 2,
      this.worldHeight / 2,
      this.worldWidth,
      this.worldHeight,
      'sky'
    );

    // 调整天空层级到最底层
    this.skyBackground.setDepth(-100);

    // 设置相机背景色为透明，让天空贴图显示
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
  }

  createSkillSystem() {
    const arrowWeapon = this.player ? this.player.weapon : null;
    this.skillSystem = new SkillSystem(this, this.player, arrowWeapon);
    this.skillSelectionUI = new SkillSelectionUI(this);
  }

  createEnemySystem() {
    this.enemies = this.physics.add.group({
      runChildUpdate: true
    });

    this.experienceOrbs = this.physics.add.group({
      classType: ExperienceOrb,
      runChildUpdate: true
    });

    // 创建塔子弹组（使用对象池）
    this.towerBullets = this.physics.add.group({
      classType: TowerBullet,
      maxSize: 30,
      runChildUpdate: true
    });

    this.spawnEnemies();

    // 碰撞检测
    this.physics.add.collider(this.enemies, this.levelManager.getGroundPlatforms());
    this.physics.add.collider(this.enemies, this.levelManager.getPlatforms());
    this.physics.add.collider(this.experienceOrbs, this.levelManager.getGroundPlatforms());
    this.physics.add.collider(this.experienceOrbs, this.levelManager.getPlatforms());
    this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);

    const projectiles = this.player.getWeaponProjectiles();
    if (projectiles) {
      this.physics.add.overlap(projectiles, this.enemies, this.handleProjectileEnemyCollision, null, this);
    }

    this.physics.add.overlap(this.player, this.experienceOrbs, this.handlePlayerExperienceCollision, null, this);

    // 塔子弹碰撞检测
    this.setupTowerBulletCollisions();
  }

  /**
   * 设置塔子弹碰撞检测
   */
  setupTowerBulletCollisions() {
    // 子弹与地面碰撞（使用overlap而不是collider，只触发回调不产生物理碰撞）
    this.physics.add.overlap(
      this.towerBullets,
      this.levelManager.getGroundPlatforms(),
      this.handleTowerBulletPlatformCollision,
      null,
      this
    );

    // 子弹与平台碰撞（使用overlap而不是collider，只触发回调不产生物理碰撞）
    this.physics.add.overlap(
      this.towerBullets,
      this.levelManager.getPlatforms(),
      this.handleTowerBulletPlatformCollision,
      null,
      this
    );

    // 子弹与玩家碰撞（只在滚动阶段造成伤害）
    this.physics.add.overlap(
      this.player,
      this.towerBullets,
      this.handleTowerBulletPlayerCollision,
      null,
      this
    );
  }

  /**
   * 处理塔子弹与平台碰撞
   */
  handleTowerBulletPlatformCollision(bullet, platform) {
    if (bullet.active && bullet.onHitPlatform) {
      bullet.onHitPlatform();
    }
  }

  /**
   * 处理塔子弹与玩家碰撞
   */
  handleTowerBulletPlayerCollision(player, bullet) {
    if (!bullet.active) return;

    // 只在滚动阶段造成伤害
    const damage = bullet.getDamage();
    if (damage > 0) {
      player.takeDamage(damage);
      // 碰撞后销毁子弹
      bullet.deactivate();
    }
  }

  spawnEnemies() {
    const spawnConfig = GameConfig.enemy.spawn;

    // 初始生成敌人（在屏幕外生成）
    for (let i = 0; i < spawnConfig.initialCount; i++) {
      const spawnPoint = this.getOffScreenSpawnPoint();
      const enemy = EnemyFactory.create(this, spawnPoint.x, spawnPoint.y, 'gpt');
      if (enemy) {
        enemy.setTarget(this.player);
        this.enemies.add(enemy);
      }
    }

    // 设置普通敌人生成计时器
    this.currentSpawnDelay = spawnConfig.initialDelay;
    this.minSpawnDelay = spawnConfig.minInterval;
    this.spawnDelayDecrease = spawnConfig.delayDecrease;

    this.spawnTimer = this.time.addEvent({
      delay: this.currentSpawnDelay,
      callback: this.spawnAdditionalEnemy,
      callbackScope: this,
      loop: true
    });

    // 设置爆炸敌人生成计时器
    const explosiveConfig = GameConfig.explosiveEnemy.spawn;
    this.explosiveSpawnDelay = explosiveConfig.initialDelay;
    this.minExplosiveSpawnDelay = explosiveConfig.minInterval;
    this.explosiveSpawnDelayDecrease = explosiveConfig.delayDecrease;

    this.explosiveSpawnTimer = this.time.addEvent({
      delay: this.explosiveSpawnDelay,
      callback: this.spawnExplosiveEnemy,
      callbackScope: this,
      loop: true
    });

    // 设置塔敌人生成计时器
    const towerConfig = GameConfig.towerEnemy.spawn;
    this.towerSpawnDelay = towerConfig.initialDelay;
    this.minTowerSpawnDelay = towerConfig.minInterval;
    this.towerSpawnDelayDecrease = towerConfig.delayDecrease;

    this.towerSpawnTimer = this.time.addEvent({
      delay: this.towerSpawnDelay,
      callback: this.spawnTowerEnemy,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * 生成爆炸敌人
   */
  spawnExplosiveEnemy() {
    if (this.isPaused || this.isGameOver) {
      return;
    }

    const spawnPoint = this.getOffScreenSpawnPoint();
    const enemy = EnemyFactory.create(this, spawnPoint.x, spawnPoint.y, 'explosive');
    if (enemy) {
      enemy.setTarget(this.player);
      this.enemies.add(enemy);
    }

    // 更新生成间隔（逐渐加速直到达到上限）
    if (this.explosiveSpawnDelay > this.minExplosiveSpawnDelay) {
      this.explosiveSpawnDelay -= this.explosiveSpawnDelayDecrease;
      if (this.explosiveSpawnDelay < this.minExplosiveSpawnDelay) {
        this.explosiveSpawnDelay = this.minExplosiveSpawnDelay;
      }

      // 更新计时器的延迟
      if (this.explosiveSpawnTimer) {
        this.explosiveSpawnTimer.delay = this.explosiveSpawnDelay;
      }
    }
  }

  /**
   * 生成塔敌人
   * 在平台上生成，避免距离玩家过近
   */
  spawnTowerEnemy() {
    if (this.isPaused || this.isGameOver) {
      return;
    }

    // 获取有效的平台生成点
    const spawnPoint = this.getPlatformSpawnPointForTower();
    if (!spawnPoint) {
      return;
    }

    const enemy = EnemyFactory.create(this, spawnPoint.x, spawnPoint.y, 'tower');
    if (enemy) {
      enemy.setTarget(this.player);
      this.enemies.add(enemy);
    }

    // 更新生成间隔
    if (this.towerSpawnDelay > this.minTowerSpawnDelay) {
      this.towerSpawnDelay -= this.towerSpawnDelayDecrease;
      if (this.towerSpawnDelay < this.minTowerSpawnDelay) {
        this.towerSpawnDelay = this.minTowerSpawnDelay;
      }

      if (this.towerSpawnTimer) {
        this.towerSpawnTimer.delay = this.towerSpawnDelay;
      }
    }
  }

  /**
   * 获取塔敌人的平台生成点
   * 确保距离玩家足够远
   */
  getPlatformSpawnPointForTower() {
    const towerConfig = GameConfig.towerEnemy.spawn;
    const minDistance = towerConfig.minDistanceFromPlayer;
    const platforms = this.levelManager.getPlatforms();

    if (!platforms) return null;

    // 获取所有平台
    const platformList = platforms.getChildren();
    if (platformList.length === 0) return null;

    // 筛选出距离玩家足够远的平台
    const validPlatforms = platformList.filter(platform => {
      const distance = Phaser.Math.Distance.Between(
        platform.x, platform.y,
        this.player.x, this.player.y
      );
      return distance >= minDistance;
    });

    if (validPlatforms.length === 0) {
      // 如果没有足够远的平台，使用屏幕外生成
      return this.getOffScreenSpawnPoint();
    }

    // 随机选择一个有效平台
    const selectedPlatform = Phaser.Utils.Array.GetRandom(validPlatforms);

    // 在平台上方生成（塔站在平台上）
    return {
      x: selectedPlatform.x,
      y: selectedPlatform.y - 60 // 平台上方60像素
    };
  }

  /**
   * 获取屏幕外的生成点
   * 敌人在离玩家比较近的屏幕外生成，而不是贴脸生成
   * @returns {Object} {x, y}
   */
  getOffScreenSpawnPoint() {
    const camera = this.cameras.main;
    const playerX = this.player.x;
    const playerY = this.player.y;

    // 获取相机可见区域
    const visibleWidth = this.cameraConfig?.visibleWidth || this.scale.width;
    const visibleHeight = this.cameraConfig?.visibleHeight || this.scale.height;

    // 生成范围：屏幕外但靠近屏幕边缘（太近会让玩家感觉贴脸，太远会让敌人找不到玩家）
    const minDistanceFromScreen = 100;  // 距离屏幕边缘最小距离
    const maxDistanceFromScreen = 400;  // 距离屏幕边缘最大距离
    const MIN_SPAWN_DISTANCE = 900;     // 距离玩家最小生成距离
    const MAX_ATTEMPTS = 10;            // 最大尝试次数

    let spawnX, spawnY, distance;
    let attempts = 0;

    // 循环直到找到满足距离要求的生成点
    do {
      // 随机选择生成方向（上下左右）
      const direction = Phaser.Math.Between(0, 3);

      switch (direction) {
        case 0: // 上方
          spawnX = playerX + Phaser.Math.Between(-visibleWidth / 2, visibleWidth / 2);
          spawnY = playerY - visibleHeight / 2 - Phaser.Math.Between(minDistanceFromScreen, maxDistanceFromScreen);
          break;
        case 1: // 右方
          spawnX = playerX + visibleWidth / 2 + Phaser.Math.Between(minDistanceFromScreen, maxDistanceFromScreen);
          spawnY = playerY + Phaser.Math.Between(-visibleHeight / 2, visibleHeight / 2);
          break;
        case 2: // 下方
          spawnX = playerX + Phaser.Math.Between(-visibleWidth / 2, visibleWidth / 2);
          spawnY = playerY + visibleHeight / 2 + Phaser.Math.Between(minDistanceFromScreen, maxDistanceFromScreen);
          break;
        case 3: // 左方
          spawnX = playerX - visibleWidth / 2 - Phaser.Math.Between(minDistanceFromScreen, maxDistanceFromScreen);
          spawnY = playerY + Phaser.Math.Between(-visibleHeight / 2, visibleHeight / 2);
          break;
      }

      // 确保生成点在世界边界内
      spawnX = Phaser.Math.Clamp(spawnX, 50, GameConfig.world.width - 50);
      spawnY = Phaser.Math.Clamp(spawnY, 50, GameConfig.world.groundY - 50);

      // 计算与玩家的距离
      distance = Phaser.Math.Distance.Between(spawnX, spawnY, playerX, playerY);
      attempts++;
    } while (distance < MIN_SPAWN_DISTANCE && attempts < MAX_ATTEMPTS);

    return { x: spawnX, y: spawnY };
  }

  spawnAdditionalEnemy() {
    if (this.isPaused || this.isGameOver) {
      return;
    }

    const spawnPoint = this.getOffScreenSpawnPoint();
    const enemy = EnemyFactory.create(this, spawnPoint.x, spawnPoint.y, 'gpt');
    if (enemy) {
      enemy.setTarget(this.player);
      this.enemies.add(enemy);
    }

    // 更新生成间隔（逐渐加速直到达到上限）
    if (this.currentSpawnDelay > this.minSpawnDelay) {
      this.currentSpawnDelay -= this.spawnDelayDecrease;
      if (this.currentSpawnDelay < this.minSpawnDelay) {
        this.currentSpawnDelay = this.minSpawnDelay;
      }

      // 更新计时器的延迟
      if (this.spawnTimer) {
        this.spawnTimer.delay = this.currentSpawnDelay;
      }
    }
  }

  spawnExperienceOrb(x, y) {
    const orb = new ExperienceOrb(this, x, y);
    this.experienceOrbs.add(orb);
  }

  spawnExperienceOrbs(x, y, count) {
    const expConfig = GameConfig.experience;
    for (let i = 0; i < count; i++) {
      const offsetX = Phaser.Math.Between(-expConfig.spreadRadius, expConfig.spreadRadius);
      const offsetY = Phaser.Math.Between(-expConfig.spreadRadius, expConfig.spreadRadius);
      const orb = new ExperienceOrb(this, x + offsetX, y + offsetY);
      this.experienceOrbs.add(orb);
    }
  }

  handlePlayerEnemyCollision(player, enemy) {
    // 翻滚期间不与敌人碰撞
    if (player.isRolling) {
      return;
    }

    const damage = enemy.getDamageToPlayer(player.getLevel());
    player.takeDamage(damage);
  }

  handleProjectileEnemyCollision(projectile, enemy) {
    if (!projectile.active || !enemy.active) {
      return;
    }

    // 检查是否已经击中过这个敌人（避免同一箭矢多次伤害同一敌人）
    if (projectile.hitEnemies.has(enemy)) {
      return;
    }

    // 记录敌人是否即将死亡（在造成伤害前判断）
    const willDie = enemy.health <= projectile.damage;

    enemy.takeDamage(projectile.damage);
    projectile.hitEnemies.add(enemy);

    // 处理穿透逻辑
    if (projectile.pierceCount > 0) {
      projectile.pierceCount--;
      // 箭矢继续飞行，不消失
    } else {
      projectile.deactivate();
    }

    // 如果敌人被击败，增加得分
    // 注意：takeDamage 会设置 isDead，所以这里只判断 willDie
    if (willDie) {
      this.player.addScore(100);
    }
  }

  handlePlayerExperienceCollision(player, orb) {
    orb.collect(player);
  }

  /**
   * 更新UI显示
   */
  updateUI() {
    if (this.gameUI && this.player) {
      this.gameUI.update(this.player);
    }
  }

  showLevelUpEffect() {
    console.log('showLevelUpEffect called');
    try {
      // 播放升级音效
      this.audioSystem.playSFX('sfx_level_up');

      // 暂停游戏
      this.physics.pause();
      this.isPaused = true;
      console.log('Game paused');

      // 获取随机3个技能
      const skills = this.skillSystem.getRandomSkills(3);
      console.log('Got skills:', skills.map(s => s.id));

      // 显示技能选择UI
      if (this.skillSelectionUI) {
        console.log('Showing skill selection UI');
        this.skillSelectionUI.show(skills, (skillId) => {
          console.log('Skill selected:', skillId);
          try {
            // 应用选中的技能
            if (this.skillSystem) {
              this.skillSystem.applySkill(skillId);
              console.log('Skill applied:', skillId);
            }

            // 恢复游戏
            this.physics.resume();
            this.isPaused = false;
            console.log('Game resumed');

            // 更新UI
            this.updateUI();
          } catch (e) {
            console.error('Error in skill selection callback:', e);
            this.physics.resume();
            this.isPaused = false;
          }
        });
      } else {
        console.error('skillSelectionUI is null!');
        this.physics.resume();
        this.isPaused = false;
      }

      this.cameras.main.flash(500, 0, 255, 0);
    } catch (e) {
      console.error('Error in showLevelUpEffect:', e);
      this.physics.resume();
      this.isPaused = false;
    }
  }

  gameOver() {
    this.isGameOver = true;
    this.physics.pause();

    // 获取最终统计数据
    const finalScore = this.player.getScore();
    const finalLevel = this.player.getLevel();

    // 显示DOM游戏结束界面
    if (this.gameOverUI) {
      this.gameOverUI.show(
        { score: finalScore, level: finalLevel },
        () => {
          // 重新开始游戏
          this.scene.restart();
        }
      );
    }
  }

  createPlayer() {
    const spawnPoint = this.levelManager.getPlayerSpawnPoint();

    this.player = new Player(this, spawnPoint.x, spawnPoint.y);
    this.physics.add.collider(this.player, this.levelManager.getGroundPlatforms());
    this.physics.add.collider(this.player, this.levelManager.getPlatforms());
  }

  setupCamera() {
    const camera = this.cameras.main;
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    // 设置相机边界
    camera.setBounds(0, 0, this.worldWidth, this.worldHeight);

    // 计算摄像机 zoom - 以高度为基准，保持垂直视野一致
    const cameraConfig = this.displayConfig.getCameraConfig
      ? this.displayConfig.getCameraConfig(screenWidth, screenHeight)
      : this.calculateCameraConfig(screenWidth, screenHeight);

    this.cameraConfig = cameraConfig;
    camera.setZoom(cameraConfig.zoom);

    // 跟随玩家
    camera.startFollow(this.player, true, GameConfig.camera.lerpX, GameConfig.camera.lerpY);
    camera.setBackgroundColor(GameConfig.camera.backgroundColor);

    console.log('[Camera] 设置完成:', {
      screenSize: `${screenWidth}x${screenHeight}`,
      zoom: cameraConfig.zoom.toFixed(4),
      visibleArea: `${cameraConfig.visibleWidth.toFixed(1)}x${cameraConfig.visibleHeight.toFixed(1)}`
    });
  }

  /**
   * 计算摄像机配置（备用方法，当 displayConfig 未提供时）
   */
  calculateCameraConfig(screenWidth, screenHeight) {
    const designHeight = 720;
    const zoom = screenHeight / designHeight;

    return {
      zoom: zoom,
      visibleWidth: screenWidth / zoom,
      visibleHeight: screenHeight / zoom
    };
  }

  /**
   * 更新摄像机 zoom
   */
  updateCameraZoom() {
    const camera = this.cameras.main;
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    // 重新计算 zoom
    const cameraConfig = this.displayConfig.getCameraConfig
      ? this.displayConfig.getCameraConfig(screenWidth, screenHeight)
      : this.calculateCameraConfig(screenWidth, screenHeight);

    this.cameraConfig = cameraConfig;
    camera.setZoom(cameraConfig.zoom);

    console.log('[Camera] Zoom 已更新:', {
      zoom: cameraConfig.zoom.toFixed(4),
      visibleArea: `${cameraConfig.visibleWidth.toFixed(1)}x${cameraConfig.visibleHeight.toFixed(1)}`
    });
  }

  setupKeyboard() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.rollKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  setupMouseInput() {
    this.input.on('pointerdown', (pointer) => {
      if (this.isPaused) {
        return;
      }

      if (pointer.leftButtonDown() && this.player) {
        const attackPower = this.player.getAttackPower ? this.player.getAttackPower() : 50;
        this.player.fireWeapon(pointer.worldX, pointer.worldY, attackPower);
      }
    });
  }

  update() {
    if (this.isPaused || !this.player) return;

    this.updateInput();
    this.updatePlayer();
    this.updateEnemies();
    this.updateExperienceOrbs();
    this.updateClouds();
    this.updateUI();
  }

  /**
   * 更新云朵
   */
  updateClouds() {
    if (this.cloudSystem) {
      this.cloudSystem.update();
    }
  }

  /**
   * 更新输入处理
   */
  updateInput() {
    const hasMobileInput = this.mobileControls?.isMobile && this.mobileControls?.isLandscape();

    if (hasMobileInput) {
      this.mobileControls.update();
    } else {
      this.updateKeyboardInput();
    }
  }

  /**
   * 更新键盘输入
   */
  updateKeyboardInput() {
    const leftPressed = this.wasd.left.isDown;
    const rightPressed = this.wasd.right.isDown;

    if (leftPressed) {
      this.player.moveLeft();
    } else if (rightPressed) {
      this.player.moveRight();
    } else {
      this.player.stop();
    }

    const keyboardJump = Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
      this.cursors.up.isDown ||
      Phaser.Input.Keyboard.JustDown(this.wasd.up);

    if (keyboardJump) {
      this.player.jump();
    }

    // 翻滚按键检测
    if (Phaser.Input.Keyboard.JustDown(this.rollKey)) {
      this.player.roll();
    }
  }

  /**
   * 更新玩家
   */
  updatePlayer() {
    this.player.update();
  }

  /**
   * 更新敌人
   */
  updateEnemies() {
    if (!this.enemies) return;

    this.enemies.getChildren().forEach(enemy => {
      if (enemy.active && enemy.update) {
        enemy.update(this.player);
      }
    });
  }

  /**
   * 更新经验球
   */
  updateExperienceOrbs() {
    if (!this.experienceOrbs) return;

    this.experienceOrbs.getChildren().forEach(orb => {
      if (orb.active && orb.update) {
        orb.update(this.player);
      }
    });
  }

  shutdown() {
    if (this.gameUI) {
      this.gameUI.destroy();
      this.gameUI = null;
    }

    if (this.skillSelectionUI) {
      this.skillSelectionUI.destroy();
      this.skillSelectionUI = null;
    }

    if (this.gameOverUI) {
      this.gameOverUI.destroy();
      this.gameOverUI = null;
    }

    if (this.mobileControls) {
      this.mobileControls.destroy();
      this.mobileControls = null;
    }

    if (this.cloudSystem) {
      this.cloudSystem.destroy();
      this.cloudSystem = null;
    }

    if (this.skyBackground) {
      this.skyBackground.destroy();
      this.skyBackground = null;
    }

    if (this.muteButton) {
      this.muteButton.destroy();
      this.muteButton = null;
    }

    // 清理爆炸敌人生成计时器
    if (this.explosiveSpawnTimer) {
      this.explosiveSpawnTimer.remove();
      this.explosiveSpawnTimer = null;
    }

    // 清理塔敌人生成计时器
    if (this.towerSpawnTimer) {
      this.towerSpawnTimer.remove();
      this.towerSpawnTimer = null;
    }

    // 清理爆炸粒子系统
    if (this.explosionParticleSystem) {
      this.explosionParticleSystem.destroy();
      this.explosionParticleSystem = null;
    }

    // 清理塔子弹组
    if (this.towerBullets) {
      this.towerBullets.clear(true, true);
      this.towerBullets = null;
    }

    // 注意：不销毁音频系统，保持BGM连续播放
    // 音频系统会在页面卸载时自动销毁
  }

  /**
   * 处理显示配置变化（来自DisplayConfig的更新）
   * 当窗口大小变化时（如从窗口切换到全屏），更新摄像机 zoom 保持显示范围一致
   */
  handleDisplayResize(config) {
    // 1. 更新显示配置
    this.displayConfig = config;

    // 2. 获取当前屏幕尺寸
    const width = this.scale.width;
    const height = this.scale.height;

    // 3. 更新摄像机 zoom（关键）- 保持垂直视野一致
    this.updateCameraZoom();

    // 4. 更新游戏UI位置
    if (this.gameUI) {
      this.gameUI.handleResize({ width, height });
    }

    // 注意：静音按钮使用 DOM 固定定位，自动适应屏幕变化，无需手动更新位置

    console.log('[GameScene] 显示配置已更新:', {
      screenSize: `${width}x${height}`,
      zoom: this.cameraConfig?.zoom?.toFixed(4)
    });
  }
}
