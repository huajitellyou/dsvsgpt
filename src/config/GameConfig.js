/**
 * 游戏核心配置
 * 所有游戏参数的集中管理中心
 */
export const GameConfig = {
  // 世界配置
  world: {
    width: 2400,
    height: 1200,
    groundY: 1100,
    groundHeight: 100
  },

  // 玩家配置
  player: {
    baseHealth: 100,
    baseSpeed: 800,
    baseJumpPower: 1700,
    baseAttack: 30,
    attackCooldown: 250,
    invincibilityDuration: 1000,
    startXOffset: 0.5,  // 世界宽度的百分比
    startYOffset: 500,  // 距离地面的高度

    // 成长参数
    growth: {
      healthPerLevel: 20,
      attackPerLevel: 5,
      speedPerLevel: 20,
      experienceMultiplier: 1.2,
      experienceNeeded: (level) => Math.floor(100 * Math.pow(1.2, level - 1))
    }
  },

  // 敌人配置
  enemy: {
    baseHealth: 100,
    baseSpeed: 180,
    baseDamage: 10,
    baseExperience: 10,

    // 成长参数
    growth: {
      healthMultiplier: 1.1,
      damageMultiplier: 1.05,
      experienceMultiplier: 1.1,
      interval: 15000  // 成长间隔（毫秒）
    },

    // 生成参数
    spawn: {
      initialCount: 1,        // 初始生成敌人数量减少为1
      initialDelay: 5000,     // 初始生成间隔5秒
      minInterval: 1200,      // 最快1.2秒一个
      maxInterval: 3000,
      delayDecrease: 80       // 逐渐加速，但减速幅度变小
    },

    // 对玩家伤害计算参数
    damageToPlayer: {
      baseDamage: 15,
      levelMultiplier: 6
    },

    // AI配置
    ai: {
      jumpThreshold: 120,        // 触发跳跃的垂直距离阈值（像素）
      walkOffPlatformDelay: 300, // 走下平台的碰撞禁用时间（毫秒）
      jumpCooldown: 1500,        // 跳跃冷却时间（毫秒，从2000缩短）
      jumpProbability: 0.03,     // 随机跳跃概率（从0.02提高）
      platformEdgeThreshold: 40  // 平台边缘检测阈值（像素）
    }
  },

  // 爆炸敌人配置
  explosiveEnemy: {
    baseHealth: 150,        // 比基础敌人高
    baseSpeed: 105,         // 150 * 0.7 比基础敌人慢
    baseDamage: 10,
    baseExperience: 15,
    explosionDamage: 60,    // 爆炸伤害
    explosionRadius: 250,   // 爆炸范围（像素）

    // 成长参数
    growth: {
      healthMultiplier: 1.15,
      damageMultiplier: 1.05,
      experienceMultiplier: 1.1,
      interval: 15000  // 成长间隔（毫秒）
    },

    // 生成参数（普通敌人的2倍）
    spawn: {
      initialDelay: 10000,    // 初始生成间隔10秒（普通敌人的2倍）
      minInterval: 2400,      // 最快2.4秒一个（普通敌人的2倍）
      delayDecrease: 160
    }
  },

  // 塔状敌人配置
  towerEnemy: {
    baseHealth: 200,        // 较高的血量
    baseSpeed: 0,           // 不移动
    baseDamage: 10,
    baseExperience: 25,
    rotationSpeed: 90,      // 塔头旋转速度（度/秒）
    fireInterval: 4000,     // 射击间隔（毫秒）- 4秒发射一次
    bulletSpeed: 400,       // 子弹飞行速度

    // 成长参数
    growth: {
      healthMultiplier: 1.1,
      damageMultiplier: 1.05,
      experienceMultiplier: 1.1,
      interval: 15000
    },

    // 生成参数
    spawn: {
      initialDelay: 12000,  // 初始生成间隔12秒
      minInterval: 6000,    // 最快6秒一个
      delayDecrease: 500,
      minDistanceFromPlayer: 500  // 距离玩家最小距离
    }
  },

  // 塔头敌人配置（击败塔后生成）
  towerHeadEnemy: {
    health: 200,
    maxSpeed: 350,          // 最大滚动速度
    acceleration: 600,      // 加速度
    friction: 300,          // 摩擦力
    damage: 20,             // 碰撞伤害
    rotationSpeed: 360,     // 滚动旋转速度（度/秒）
    baseExperience: 15
  },

  // 塔子弹配置
  towerBullet: {
    size: 80,               // 子弹大小（像素）
    flySpeed: 500,          // 飞行速度
    rollSpeed: 350,         // 滚动最大速度
    rollAcceleration: 800,  // 滚动加速度
    damage: 15,             // 滚动阶段伤害
    initialRollDistance: 500 // 初始滚动距离（像素）
  },

  // 经验球配置
  experience: {
    baseValue: 10,
    magnetDistance: 150,
    pickupDistance: 30,
    lifetime: 10000,
    countPerEnemy: 3,
    spreadRadius: 30
  },

  // 武器配置
  weapon: {
    arrow: {
      baseSpeed: 1680,
      baseDamage: 10,
      baseRange: 1000,
      fireRate: 250,
      scale: 1.0
    }
  },

  // 相机配置
  camera: {
    zoom: 1,
    lerpX: 0.08,
    lerpY: 0.08,
    followOffsetY: -100,
    backgroundColor: '#87CEEB'
  },

  // UI配置
  ui: {
    skillSelection: {
      cardsCount: 3,
      animationDuration: 300
    }
  },

  // 音频配置
  audio: {
    bgm: {
      volume: 0.5,
      loop: true,
      muteKey: 'deepseek_vs_gpt_muted'
    },
    sfx: {
      volume: 0.7
    }
  },

  // 爆炸效果配置
  explosionEffects: {
    explosiveEnemy: {
      coreParticles: 15,        // 核心粒子数
      sparkParticles: 15,       // 火花粒子数
      smokeParticles: 10,       // 烟雾粒子数
      duration: 800,            // 效果持续时间(ms)
      colors: {
        core: [0xFFA500, 0xFF8C00, 0xFFD700],     // 橙黄色调
        spark: [0xFFFFFF, 0xFFFF00, 0xFFAA00],    // 白黄色调
        smoke: [0x555555, 0x777777, 0x999999]     // 灰色调
      },
      gravity: {
        core: 0,      // 核心粒子无重力
        spark: 300,   // 火花粒子下落
        smoke: -80    // 烟雾粒子上升
      },
      flash: true,              // 是否开启闪光
      flashDuration: 200,       // 闪光持续时间(ms)
      flashIntensity: 0.3       // 闪光强度(0-1)
    }
  },

  // 怒气爆发技能配置
  rageExplosion: {
    explosionDamage: 100,      // 爆炸伤害
    explosionRadius: 600,      // 爆炸范围（像素）
    chargeTime: 9000,          // 积攒时间（毫秒）
    tintColor: 0xFF0000,       // 红色色调
    tintAlpha: 0.5             // 半透明透明度
  },

  // 翻滚技能配置
  roll: {
    baseDamage: 30,           // 基础伤害
    damagePerLevel: 5,        // 每级增加伤害
    duration: 500,            // 持续时间（毫秒）
    cooldown: 500,            // 冷却时间（毫秒）
    distance: 800,            // 移动距离（像素）
    rotations: 2,             // 旋转周数
    invulnerable: true        // 是否无敌
  }
};
