/**
 * 技能选择UI - 基于DOM实现
 * 透明简洁风格，保持原有动效（入场动画、hover效果、stagger延迟）
 */
export class SkillSelectionUI {
  constructor(scene) {
    this.scene = scene;
    this.isVisible = false;
    this.onSkillSelected = null;

    // DOM元素引用
    this.overlay = null;
    this.cards = [];
    this.boundHandleClick = this.handleCardClick.bind(this);

    // 技能图标映射 (与 skills.json 中的 id 对应)
    this.iconMap = {
      'triple_shot': '⚡',
      'rapid_fire': '🏹',
      'power_shot': '⚔️',
      'piercing': '🔥',
      'speed_boost': '👟',
      'health_up': '💚',
      'life_steal': '❤️',
      'exp_boost': '⭐',
      'rage_explosion': '💢',
      'roll_damage_boost': '🌀'
    };

    this.init();
  }

  /**
   * 初始化UI - 获取DOM元素并绑定事件
   */
  init() {
    // 获取遮罩层
    this.overlay = document.getElementById('skill-selection-overlay');
    if (!this.overlay) {
      console.error('Skill selection overlay not found in DOM');
      return;
    }

    // 获取技能卡片
    const cardElements = this.overlay.querySelectorAll('.skill-card');
    this.cards = Array.from(cardElements).map((cardEl, index) => ({
      element: cardEl,
      index: index,
      skillId: null,
      iconEl: cardEl.querySelector('.skill-icon'),
      nameEl: cardEl.querySelector('.skill-name'),
      descEl: cardEl.querySelector('.skill-description')
    }));

    // 绑定点击事件
    this.cards.forEach(card => {
      card.element.addEventListener('click', this.boundHandleClick);
    });

    console.log('SkillSelectionUI DOM initialized');
  }

  /**
   * 处理卡片点击
   */
  handleCardClick(event) {
    const cardElement = event.currentTarget;
    const index = parseInt(cardElement.dataset.index);
    const card = this.cards[index];

    console.log('Card clicked:', index, 'skillId:', card?.skillId);

    if (card && card.skillId && this.onSkillSelected) {
      console.log('Selecting skill:', card.skillId);
      this.onSkillSelected(index);
    }
  }

  /**
   * 重置卡片动画 - 移除并重新添加animation类以触发动画
   */
  resetCardAnimations() {
    this.cards.forEach(card => {
      card.element.style.animation = 'none';
      // 强制重绘
      void card.element.offsetHeight;
      card.element.style.animation = '';
    });
  }

  /**
   * 显示技能选择界面
   */
  show(skills, onSelect) {
    console.log('SkillSelectionUI.show called');

    if (!this.overlay) {
      console.error('Overlay not initialized');
      return;
    }

    this.onSkillSelected = (index) => {
      const card = this.cards[index];
      if (card && card.skillId && onSelect) {
        console.log('Skill selected:', card.skillId);
        onSelect(card.skillId);
      }
      this.hide();
    };

    // 更新卡片数据
    for (let i = 0; i < 3; i++) {
      const card = this.cards[i];
      const skill = skills[i];

      if (skill && card) {
        card.skillId = skill.id;
        card.nameEl.textContent = skill.name;
        card.descEl.textContent = skill.description;
        card.iconEl.textContent = this.iconMap[skill.id] || '?';
      }
    }

    // 重置动画状态
    this.resetCardAnimations();

    // 显示遮罩层
    this.isVisible = true;
    this.overlay.classList.add('visible');

    console.log('Skill selection UI shown');
  }

  /**
   * 隐藏技能选择界面
   */
  hide() {
    console.log('SkillSelectionUI.hide called');

    this.isVisible = false;
    this.onSkillSelected = null;

    if (this.overlay) {
      this.overlay.classList.remove('visible');
    }

    console.log('Skill selection UI hidden');
  }

  /**
   * 销毁UI - 清理事件监听
   */
  destroy() {
    console.log('SkillSelectionUI.destroy called');

    // 移除事件监听
    this.cards.forEach(card => {
      card.element.removeEventListener('click', this.boundHandleClick);
    });

    this.hide();
    this.cards = [];
    this.overlay = null;

    console.log('Skill selection UI destroyed');
  }
}
