import { GameConfig } from '../config/GameConfig.js';
import { RageExplosionComponent } from '../components/RageExplosionComponent.js';

/**
 * 技能系统
 * 管理玩家技能的获取、升级和效果应用
 * 技能数据从 assets/data/skills.json 加载
 */
export class SkillSystem {
  constructor(scene, player, arrowWeapon) {
    this.scene = scene;
    this.player = player;
    this.arrowWeapon = arrowWeapon;

    // 从JSON加载技能数据
    this.skillData = scene.cache.json.get('skills') || { skills: [] };

    // 玩家已拥有的技能等级
    this.playerSkills = new Map();

    // 已选择的唯一技能（选择后从可用池中移除）
    this.selectedUniqueSkills = new Set();

    // 初始化可用技能池
    this.availableSkills = this.skillData.skills.map(s => s.id);

    // 技能图标映射
    this.iconMap = {
      'triple_shot': '⚡',
      'rapid_fire': '🏹',
      'power_shot': '💥',
      'piercing': '🔥',
      'speed_boost': '👟',
      'health_up': '💚',
      'life_steal': '❤️',
      'exp_boost': '⭐',
      'roll_damage_boost': '🌀'
    };
  }

  /**
   * 获取随机技能选项
   * @param {number} count - 选项数量
   * @returns {Object[]}
   */
  getRandomSkills(count = 3) {
    const options = [];
    const available = this.availableSkills.filter(id => {
      // 如果已选择过唯一技能，则排除
      if (this.selectedUniqueSkills.has(id)) {
        return false;
      }

      const skill = this.getSkillData(id);
      const currentLevel = this.playerSkills.get(id) || 0;
      return skill && currentLevel < skill.maxLevel;
    });

    const shuffled = [...available].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const skillId = shuffled[i];
      const skill = this.getSkillData(skillId);
      const currentLevel = this.playerSkills.get(skillId) || 0;

      options.push({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        icon: this.iconMap[skill.id] || '?',
        currentLevel,
        isMaxed: currentLevel >= skill.maxLevel
      });
    }

    return options;
  }

  /**
   * 获取技能数据
   * @param {string} skillId - 技能ID
   * @returns {Object}
   */
  getSkillData(skillId) {
    return this.skillData.skills.find(s => s.id === skillId);
  }

  /**
   * 应用技能
   * @param {string} skillId - 技能ID
   */
  applySkill(skillId) {
    const skill = this.getSkillData(skillId);
    if (!skill) return false;

    const currentLevel = this.playerSkills.get(skillId) || 0;
    if (currentLevel >= skill.maxLevel) return false;

    // 升级
    this.playerSkills.set(skillId, currentLevel + 1);

    // 如果是唯一技能，标记为已选择
    if (skill.isUnique) {
      this.selectedUniqueSkills.add(skillId);
    }

    // 应用效果
    this.applySkillEffects(skill);

    return true;
  }

  /**
   * 应用技能效果
   * @param {Object} skill - 技能数据
   */
  applySkillEffects(skill) {
    if (!skill.effects) return;

    skill.effects.forEach(effect => {
      switch (effect.type) {
        case 'add_projectile':
          this.applyAddProjectile(effect);
          break;
        case 'modify_stat':
          this.applyModifyStat(effect);
          break;
        case 'add_pierce':
          this.applyAddPierce(effect);
          break;
        case 'heal':
          this.applyHeal(effect);
          break;
        case 'rage_explosion':
          this.applyRageExplosion(effect);
          break;
        default:
          console.warn(`Unknown effect type: ${effect.type}`);
      }
    });
  }

  /**
   * 应用增加投射物效果
   */
  applyAddProjectile(effect) {
    if (this.arrowWeapon && this.arrowWeapon.enableTripleShot) {
      this.arrowWeapon.enableTripleShot();
    }
  }

  /**
   * 应用属性修改效果
   */
  applyModifyStat(effect) {
    const { stat, value, operation } = effect;

    switch (stat) {
      case 'fireRate':
        if (this.arrowWeapon) {
          this.arrowWeapon.increaseArrowSpeed(Math.abs(value));
        }
        break;
      case 'damage':
        if (this.player) {
          const bonus = Math.floor(this.player.baseAttack * value);
          this.player.currentAttack += bonus;
        }
        break;
      case 'speed':
        if (this.player) {
          this.player.speed *= (1 + value);
        }
        break;
      case 'maxHealth':
        if (this.player) {
          this.player.maxHealth += value;
          this.player.currentHealth += value;
        }
        break;
      case 'experienceMultiplier':
        if (this.player) {
          this.player.experienceMultiplier += value;
        }
        break;
      case 'rollDamage':
        if (this.player) {
          this.player.addRollDamageBonus(value);
        }
        break;
    }
  }

  /**
   * 应用穿透效果
   */
  applyAddPierce(effect) {
    if (this.arrowWeapon) {
      this.arrowWeapon.addPierce(effect.count || 1);
    }
  }

  /**
   * 应用治疗效果
   */
  applyHeal(effect) {
    if (this.player) {
      const healAmount = Math.floor(this.player.maxHealth * effect.value);
      this.player.heal(healAmount);
    }
  }

  /**
   * 应用怒气爆发效果
   */
  applyRageExplosion(effect) {
    if (this.player) {
      // 创建并启动怒气爆发组件
      const rageComponent = new RageExplosionComponent(this.scene, this.player);
      this.player.setRageExplosionComponent(rageComponent);
      rageComponent.startCharging();
    }
  }

  /**
   * 获取技能等级
   * @param {string} skillId - 技能ID
   * @returns {number}
   */
  getSkillLevel(skillId) {
    return this.playerSkills.get(skillId) || 0;
  }

  /**
   * 重置所有技能
   */
  reset() {
    this.playerSkills.clear();
    this.selectedUniqueSkills.clear();
  }
}
