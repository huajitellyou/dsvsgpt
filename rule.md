---
alwaysApply: true
---

# Phaser 4 开发规范与项目架构指南

> **版本**: Phaser v4.0.0-rc.6  
> **项目**: Deepseek VS GPT  
> **最后更新**: 2026-02-21

---

## 1. 项目概述

本项目是一个基于 Phaser 4 的 2D 动作生存游戏，采用组件化架构和模块化设计。本文档定义了完整的开发规范，确保代码一致性、可维护性和可扩展性。

---

## 2. Phaser 4 核心规范

### 2.1 物理对象创建

```javascript
// ❌ 错误：先创建再添加物理
const sprite = this.add.sprite(x, y, 'key');
this.physics.add.existing(sprite);

// ✅ 正确：直接创建物理精灵
const sprite = this.physics.add.sprite(x, y, 'key');
```

### 2.2 场景生命周期管理

```javascript
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' }); // 必须定义 key
  }

  preload() {
    // 仅在 LoadingScene 中加载资源
    // GameScene 中只保留错误监听
    this.load.on('loaderror', (file) => {
      console.warn(`[Scene] 资源加载失败: ${file.key}`);
    });
  }

  create() {
    // 初始化游戏对象，按顺序：
    // 1. 音频系统
    // 2. 背景/环境
    // 3. 关卡管理器
    // 4. 粒子系统
    // 5. 玩家
    // 6. 敌人系统
    // 7. 相机
    // 8. UI
    // 9. 输入系统
  }

  update(time, delta) {
    // 每帧更新，禁止在此创建新对象
    // 只调用子系统的 update 方法
  }

  shutdown() {
    // 必须清理的资源：
    // - DOM UI 元素
    // - 事件监听
    // - 计时器
    // - 粒子系统
    // - 对象池
    // 注意：音频系统通常保持连续播放，不销毁
  }
}
```

### 2.3 音频系统使用

```javascript
// 获取单例实例
const audioSystem = AudioSystem.getInstance(this);

// 播放音效
audioSystem.playSFX('sfx_key');

// 浏览器要求用户交互后才能播放
this.input.once('pointerdown', () => {
  audioSystem.unlockAudio();
});
```

---

## 3. 项目架构规范

### 3.1 目录结构

```
src/
├── components/       # 可复用组件（非实体）
│   └── RageExplosionComponent.js
├── config/           # 游戏配置
│   ├── AssetConfig.js      # 资源路径配置
│   ├── GameConfig.js       # 核心游戏数值
│   └── LevelConfig.js      # 关卡配置
├── core/             # 核心系统
│   └── LevelManager.js     # 关卡管理
├── entities/         # 游戏实体
│   ├── base/               # 实体基类
│   │   ├── BaseEntity.js   # 所有实体基类
│   │   └── BaseEnemy.js    # 敌人基类
│   ├── enemies/            # 敌人类型
│   │   ├── EnemyFactory.js # 敌人工厂
│   │   ├── GPTEnemy.js
│   │   ├── ExplosiveEnemy.js
│   │   ├── TowerEnemy.js
│   │   └── TowerHeadEnemy.js
│   ├── weapons/            # 武器（预留）
│   ├── ArrowWeapon.js
│   ├── Projectile.js
│   ├── Player.js
│   ├── ExperienceOrb.js
│   └── TowerBullet.js
├── systems/          # 游戏系统
│   ├── AudioSystem.js
│   ├── SkillSystem.js
│   ├── CloudSystem.js
│   └── ExplosionParticleSystem.js
├── ui/               # UI组件
│   ├── mobile/             # 移动端控制
│   │   ├── MobileControls.js
│   │   ├── TouchButton.js
│   │   └── VirtualJoystick.js
│   ├── GameUI.js
│   ├── GameOverUI.js
│   ├── SkillSelectionUI.js
│   └── MuteButton.js
├── utils/            # 工具类
│   ├── AssetLoader.js
│   ├── DeviceDetector.js
│   ├── DisplayConfig.js
│   └── ObjectPool.js
├── scenes/           # Phaser场景
│   ├── LoadingScene.js
│   └── GameScene.js
└── main.js           # 入口文件
```

### 3.2 文件添加规范

| 类型 | 应该放在 | 继承/实现 | 备注 |
|------|----------|-----------|------|
| 新敌人类型 | `src/entities/enemies/` | `BaseEnemy` | 需在 `EnemyFactory` 注册 |
| 新武器类型 | `src/entities/weapons/` | - | 参考 `ArrowWeapon` 模式 |
| 新游戏系统 | `src/systems/` | - | 单例模式优先 |
| 新UI组件 | `src/ui/` | - | DOM实现优先 |
| 移动端控制 | `src/ui/mobile/` | - | - |
| 新组件 | `src/components/` | - | 非实体功能组件 |
| 新工具类 | `src/utils/` | - | - |
| 新配置 | `src/config/` | - | - |
| 技能数据 | `assets/data/skills.json` | - | 同步更新 `SkillSystem.iconMap` |

---

## 4. 编码规范

### 4.1 命名约定

```javascript
// 类名：大驼峰
class Player extends BaseEntity { }
class SkillSystem { }

// 常量：全大写 + 下划线
const MAX_HEALTH = 100;
const DEFAULT_SPEED = 800;

// 实例属性：驼峰
this.currentHealth = 100;
this.isActive = true;
this.spawnTimer = null;

// 私有属性：下划线前缀（约定）
this._internalState = null;
this._cache = new Map();

// 方法名：驼峰
update(time, delta) { }
takeDamage(amount) { }
getHealth() { }

// 布尔属性：is/has/should 前缀
this.isDead = false;
this.isRolling = false;
this.hasShield = true;
this.shouldJump = false;

// 事件回调：handle/on 前缀
handlePlayerEnemyCollision() { }
onPlayerDamaged() { }
```

### 4.2 导入规范

```javascript
// 1. 第三方库
import { Scene } from 'phaser';

// 2. 核心配置
import { GameConfig } from '../config/GameConfig.js';

// 3. 基类
import { BaseEntity } from './base/BaseEntity.js';

// 4. 系统/工具
import { AudioSystem } from '../systems/AudioSystem.js';
import { ObjectPool } from '../utils/ObjectPool.js';

// 5. 其他实体/组件
import { ArrowWeapon } from './ArrowWeapon.js';
```

### 4.3 类结构规范

```javascript
/**
 * 类描述
 * 详细说明类的职责和使用方式
 */
export class MyClass extends BaseClass {
  // ========== 构造函数 ==========
  constructor(scene, x, y, texture, config = {}) {
    super(scene, x, y, texture);
    
    // 合并配置
    this.config = { ...GameConfig.default, ...config };
    
    // 初始化属性（按功能分组）
    // 1. 基础属性
    this.health = this.config.baseHealth;
    this.speed = this.config.baseSpeed;
    
    // 2. 状态属性
    this.isActive = true;
    this.isDead = false;
    
    // 3. 计时器/引用
    this.lastAttackTime = 0;
    this.target = null;
    
    // 4. 初始化
    this.init();
  }

  // ========== 生命周期方法 ==========
  init() {
    // 子类重写初始化逻辑
  }

  update(time, delta) {
    if (!this.isActive) return;
    super.update(time, delta);
    this.onUpdate(time, delta);
  }

  onUpdate(time, delta) {
    // 子类重写每帧逻辑
  }

  destroy() {
    // 清理资源
    this.cleanup();
    super.destroy();
  }

  // ========== 公共方法 ==========
  activate() { }
  deactivate() { }
  takeDamage(damage) { }

  // ========== 私有方法 ==========
  _calculateDamage() { }
  _updateVisuals() { }
}
```

### 4.4 注释规范

```javascript
/**
 * 方法描述
 * @param {number} damage - 伤害值
 * @param {BaseEnemy} attacker - 攻击者
 * @returns {boolean} 是否成功造成伤害
 */
takeDamage(damage, attacker) {
  // 检查无敌状态
  if (this.invulnerable) {
    return false; // 返回false表示未造成伤害
  }
  
  // 计算最终伤害
  const finalDamage = this._calculateFinalDamage(damage);
  
  /* 
   * 多行注释说明复杂逻辑
   * 1. 扣除生命值
   * 2. 触发受伤事件
   * 3. 检查死亡
   */
  this.health -= finalDamage;
  
  return true;
}
```

---

## 5. 实体类规范

### 5.1 基类使用

所有游戏实体必须继承 `BaseEntity`：

```javascript
import { BaseEntity } from './base/BaseEntity.js';
import { GameConfig } from '../../config/GameConfig.js';

export class MyEnemy extends BaseEntity {
  constructor(scene, x, y) {
    super(scene, x, y, 'textureKey');
    
    // 从配置读取数值
    const config = GameConfig.myEnemy;
    this.health = config.baseHealth;
    this.speed = config.baseSpeed;
    
    // 物理设置
    this.setCollideWorldBounds(true);
    this.setBounce(0.1);
    
    // 显示设置
    const displaySize = 120;
    this.setDisplaySize(displaySize, displaySize);
    this.body.setSize(displaySize, displaySize);
  }

  onUpdate(time, delta) {
    // 实现每帧更新逻辑
  }
}
```

### 5.2 敌人基类使用

所有敌人必须继承 `BaseEnemy`：

```javascript
import { BaseEnemy } from '../base/BaseEnemy.js';

export class CustomEnemy extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'textureKey', {
      // 可覆盖默认配置
      baseHealth: 150,
      baseSpeed: 200
    });
    
    // 自定义初始化
    this.customProperty = 'value';
  }

  init() {
    // 初始化逻辑
  }
}
```

### 5.3 敌人工厂注册

```javascript
// 在 EnemyFactory.js 中注册
import { CustomEnemy } from './CustomEnemy.js';

static enemyTypes = {
  'gpt': GPTEnemy,
  'explosive': ExplosiveEnemy,
  'tower': TowerEnemy,
  'custom': CustomEnemy  // 新敌人类型
};
```

---

## 6. 配置规范

### 6.1 GameConfig 结构

```javascript
export const GameConfig = {
  // 世界配置
  world: {
    width: 2400,
    height: 1200,
    groundY: 1100
  },

  // 实体配置
  player: {
    baseHealth: 100,
    baseSpeed: 800,
    // 成长参数
    growth: {
      healthPerLevel: 20,
      experienceNeeded: (level) => Math.floor(100 * Math.pow(1.2, level - 1))
    }
  },

  // 敌人类型配置
  enemyType: {
    baseHealth: 100,
    baseSpeed: 180,
    spawn: {
      initialCount: 1,
      minInterval: 1200
    },
    ai: {
      jumpThreshold: 120,
      jumpCooldown: 1500
    }
  }
};
```

### 6.2 配置使用原则

```javascript
// ✅ 正确：从配置读取
const speed = GameConfig.player.baseSpeed;

// ❌ 错误：硬编码数值
const speed = 800;
```

---

## 7. 技能系统规范

### 7.1 技能数据定义

```json
{
  "skills": [
    {
      "id": "skill_id",
      "name": "技能名称",
      "description": "技能描述",
      "maxLevel": 5,
      "isUnique": true,
      "effects": [
        {
          "type": "modify_stat",
          "stat": "damage",
          "value": 0.25
        }
      ]
    }
  ]
}
```

### 7.2 效果类型

| 类型 | 说明 | 参数 |
|------|------|------|
| `add_projectile` | 增加投射物 | `count`, `angleOffset` |
| `modify_stat` | 修改属性 | `stat`, `value`, `operation` |
| `add_pierce` | 增加穿透 | `count` |
| `heal` | 治疗 | `value`（百分比） |
| `rage_explosion` | 怒气爆发 | `explosionDamage`, `explosionRadius`, `chargeTime` |

### 7.3 图标映射同步

```javascript
// SkillSystem.js 和 SkillSelectionUI.js 中的 iconMap 必须同步
this.iconMap = {
  'triple_shot': '⚡',
  'rapid_fire': '🏹',
  // ... 与 skills.json 中的 id 对应
};
```

---

## 8. UI 开发规范

### 8.1 DOM 实现优先

```javascript
export class MyUI {
  constructor(scene) {
    this.scene = scene;
    this.element = null;
    this.init();
  }

  init() {
    // 获取 DOM 元素
    this.element = document.getElementById('my-ui');
    
    // 绑定事件
    this.boundHandler = this.handleClick.bind(this);
    this.element.addEventListener('click', this.boundHandler);
  }

  show() {
    this.element.classList.add('visible');
  }

  hide() {
    this.element.classList.remove('visible');
  }

  destroy() {
    // 必须移除事件监听
    this.element.removeEventListener('click', this.boundHandler);
    this.hide();
    this.element = null;
  }
}
```

### 8.2 UI 销毁时机

在 `GameScene.shutdown()` 中销毁所有 UI：

```javascript
shutdown() {
  if (this.gameUI) {
    this.gameUI.destroy();
    this.gameUI = null;
  }
  // ... 其他 UI
}
```

---

## 9. 性能优化规范

### 9.1 对象池使用

```javascript
import { ObjectPool } from '../utils/ObjectPool.js';

// 创建对象池
this.pool = new ObjectPool(this);
this.pool.createPool('projectiles', Projectile, 50);

// 获取对象
const projectile = this.pool.acquire('projectiles', x, y);

// 回收对象
projectile.on('recycle', () => {
  this.pool.release('projectiles', projectile);
});
```

### 9.2 对象激活/停用

```javascript
// 停用（而非销毁）
deactivate() {
  this.setActive(false);
  this.setVisible(false);
  if (this.body) {
    this.body.enable = false;
  }
}

// 激活（复用）
activate() {
  this.setActive(true);
  this.setVisible(true);
  if (this.body) {
    this.body.enable = true;
  }
}
```

### 9.3 update 方法规范

```javascript
update(time, delta) {
  // ❌ 禁止在 update 中创建新对象
  const temp = new Phaser.Math.Vector2(); // 错误！
  
  // ✅ 正确：只更新状态
  this.x += this.velocityX * delta;
  
  // ✅ 正确：调用子系统 update
  this.weapon.update();
}
```

### 9.4 资源清理

```javascript
shutdown() {
  // 1. 移除事件监听
  this.events.off('event-name');
  this.input.off('pointerdown');
  
  // 2. 停止计时器
  if (this.timer) {
    this.timer.remove();
    this.timer = null;
  }
  
  // 3. 停止音频（如需）
  this.sound.stopAll();
  
  // 4. 清理对象池
  this.pool.clearAll();
  
  // 5. 调用父类
  super.shutdown();
}
```

---

## 10. 代码审查规则

### 10.1 强制规则（必须遵守）

- [ ] 所有实体类必须继承 `BaseEntity` 或 `BaseEnemy`
- [ ] 所有数值必须从 `GameConfig` 读取，禁止硬编码
- [ ] 技能数据必须与 `skills.json` 同步，包括 `iconMap`
- [ ] 禁止在 `update()` 中创建新对象
- [ ] 物理对象必须使用 `this.physics.add.sprite()` 创建
- [ ] 所有 DOM UI 必须在 `shutdown()` 中销毁
- [ ] 所有事件监听必须正确移除
- [ ] 所有计时器必须正确清理

### 10.2 推荐规则（建议遵守）

- [ ] 使用 JSDoc 注释公共方法
- [ ] 方法参数不超过 4 个
- [ ] 类行数不超过 400 行
- [ ] 方法行数不超过 50 行
- [ ] 避免深层嵌套（不超过 3 层）

### 10.3 架构审查触发条件

**以下情况必须调用架构分析师审查：**

1. 新增/删除文件或目录
2. 修改类继承关系
3. 新增游戏系统或管理器
4. 修改数据流或事件系统
5. 重构现有功能
6. 新增技能效果类型
7. 修改物理碰撞逻辑

**以下情况无需审查：**

1. 仅修改数值（攻击力、速度等）
2. 修改 UI 样式或位置
3. 修复简单的 bug
4. 添加注释或日志
5. 修改音效/音乐

---

## 11. 调试与日志规范

### 11.1 日志格式

```javascript
// 场景日志
console.log('[GameScene] 玩家创建完成');
console.warn('[EnemyFactory] 未知敌人类型:', type);
console.error('[SkillSystem] 应用技能失败:', skillId);

// 性能日志
console.log('[Performance] 对象池状态:', this.pool.getStats('projectiles'));
```

### 11.2 错误处理

```javascript
try {
  this.skillSystem.applySkill(skillId);
} catch (e) {
  console.error('Error applying skill:', e);
  // 恢复游戏状态
  this.physics.resume();
  this.isPaused = false;
}
```

---

## 12. 参考资源

- **Phaser 4 文档**: https://docs.phaser.io/api-documentation/4.0.0-rc.6/api-documentation
- **项目架构文档**: `.trae/documents/项目架构重构方案.md`
- **技能数据**: `assets/data/skills.json`

---

## 附录：快速参考

### A. 创建新敌人的步骤

1. 在 `src/entities/enemies/` 创建新文件
2. 继承 `BaseEnemy`
3. 在 `GameConfig` 中添加配置
4. 在 `EnemyFactory` 中注册
5. 在 `GameScene` 中添加生成逻辑（如需要）

### B. 创建新技能的步骤

1. 在 `skills.json` 中添加技能数据
2. 在 `SkillSystem.iconMap` 中添加图标
3. 在 `SkillSelectionUI.iconMap` 中添加图标
4. 如需新效果类型，在 `SkillSystem.applySkillEffects` 中实现

### C. 创建新场景的步骤

1. 在 `src/scenes/` 创建新文件
2. 继承 `Phaser.Scene`
3. 在 `main.js` 中注册场景
4. 实现 `preload`, `create`, `update`, `shutdown`
