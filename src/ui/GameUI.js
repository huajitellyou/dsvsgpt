/**
 * 游戏UI管理类 - 基于DOM实现
 * 透明简洁风格，无边框，直接显示在游戏画面上
 */
export class GameUI {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.elements = {};
    this.visible = true;
    
    this.createUI();
  }

  createUI() {
    // 检查是否已存在UI容器
    this.container = document.getElementById('game-ui-container');
    if (this.container) {
      this.container.innerHTML = '';
    } else {
      // 创建UI容器
      this.container = document.createElement('div');
      this.container.id = 'game-ui-container';
      document.body.appendChild(this.container);
    }

    // 创建血条区域（左上角）
    this.createHealthBar();
    
    // 创建信息面板（右上角）
    this.createInfoPanel();
    
    // 创建操作说明（底部中央）
    this.createInstructions();

    // 初始隐藏（等待游戏开始）
    this.hide();
  }

  createHealthBar() {
    const healthContainer = document.createElement('div');
    healthContainer.className = 'ui-health-container';

    // 血条标签
    const healthLabel = document.createElement('div');
    healthLabel.className = 'ui-health-label';
    healthLabel.textContent = '❤ 生命值';
    healthContainer.appendChild(healthLabel);

    // 血条背景
    const healthBarBg = document.createElement('div');
    healthBarBg.className = 'ui-health-bar-bg';

    // 血条填充
    const healthBarFill = document.createElement('div');
    healthBarFill.className = 'ui-health-bar-fill';
    healthBarFill.id = 'health-bar-fill';
    healthBarBg.appendChild(healthBarFill);

    // 血量文字 - 放在进度条内
    const healthText = document.createElement('div');
    healthText.className = 'ui-health-text';
    healthText.id = 'health-text';
    healthText.textContent = '100/100';
    healthBarBg.appendChild(healthText);

    healthContainer.appendChild(healthBarBg);

    this.container.appendChild(healthContainer);
    this.elements.healthBarFill = healthBarFill;
    this.elements.healthText = healthText;
  }

  createInfoPanel() {
    const infoPanel = document.createElement('div');
    infoPanel.className = 'ui-info-panel';

    // 得分
    const scoreEl = document.createElement('div');
    scoreEl.className = 'ui-info-item ui-score';
    scoreEl.innerHTML = '<span class="ui-label">得分:</span> <span id="score-value">0</span>';
    infoPanel.appendChild(scoreEl);

    // 等级
    const levelEl = document.createElement('div');
    levelEl.className = 'ui-info-item ui-level';
    levelEl.innerHTML = '<span class="ui-label">等级:</span> <span id="level-value">1</span>';
    infoPanel.appendChild(levelEl);

    // 经验 - 进度条形式
    const expContainer = document.createElement('div');
    expContainer.className = 'ui-exp-container';

    const expBarBg = document.createElement('div');
    expBarBg.className = 'ui-exp-bar-bg';

    const expBarFill = document.createElement('div');
    expBarFill.className = 'ui-exp-bar-fill';
    expBarFill.id = 'exp-bar-fill';

    const expText = document.createElement('div');
    expText.className = 'ui-exp-text';
    expText.id = 'exp-text';
    expText.textContent = '0/100';

    expBarBg.appendChild(expBarFill);
    expBarBg.appendChild(expText);
    expContainer.appendChild(expBarBg);
    infoPanel.appendChild(expContainer);

    // 攻击力
    const attackEl = document.createElement('div');
    attackEl.className = 'ui-info-item ui-attack';
    attackEl.innerHTML = '<span class="ui-label">攻击力:</span> <span id="attack-value">50</span>';
    infoPanel.appendChild(attackEl);

    this.container.appendChild(infoPanel);

    this.elements.score = document.getElementById('score-value');
    this.elements.level = document.getElementById('level-value');
    this.elements.expBarFill = document.getElementById('exp-bar-fill');
    this.elements.expText = document.getElementById('exp-text');
    this.elements.attack = document.getElementById('attack-value');
  }

  createInstructions() {
    const instructions = document.createElement('div');
    instructions.className = 'ui-instructions';
    instructions.id = 'ui-instructions';
    
    const isTouchDevice = this.scene.game.displayConfig?.isTouch || 
                         ('ontouchstart' in window && window.innerWidth < 1024);
    
    if (isTouchDevice) {
      instructions.innerHTML = '使用虚拟摇杆移动，跳跃按钮跳跃';
    } else {
      instructions.innerHTML = 'A/D 移动 | 空格/↑ 跳跃（可二连跳） | 鼠标左键发射箭矢';
    }
    
    this.container.appendChild(instructions);
    this.elements.instructions = instructions;
    
    // 移动端隐藏操作说明
    if (isTouchDevice) {
      instructions.style.display = 'none';
    }
  }

  update(player) {
    if (!player || !this.visible) return;
    
    // 更新血条
    const health = player.getHealth();
    const maxHealth = player.getMaxHealth();
    const healthPercent = (health / maxHealth) * 100;
    
    if (this.elements.healthBarFill) {
      this.elements.healthBarFill.style.width = `${healthPercent}%`;
      
      // 根据血量改变颜色
      let color;
      if (healthPercent > 60) {
        color = '#00ff66'; // 绿色
      } else if (healthPercent > 30) {
        color = '#ffcc00'; // 黄色
      } else {
        color = '#ff3333'; // 红色
      }
      this.elements.healthBarFill.style.background = `linear-gradient(to right, ${color}, ${color}dd)`;
    }
    
    if (this.elements.healthText) {
      this.elements.healthText.textContent = `${health}/${maxHealth}`;
    }
    
    // 更新其他信息
    if (this.elements.score) {
      this.elements.score.textContent = player.getScore();
    }
    
    if (this.elements.level) {
      this.elements.level.textContent = player.getLevel();
    }
    
    if (this.elements.expBarFill && this.elements.expText) {
      const expPercent = (player.getExperience() / player.getExpToNextLevel()) * 100;
      this.elements.expBarFill.style.width = `${expPercent}%`;
      this.elements.expText.textContent = `${player.getExperience()}/${player.getExpToNextLevel()}`;
    }
    
    if (this.elements.attack) {
      this.elements.attack.textContent = player.getAttackPower();
    }
  }

  show() {
    this.visible = true;
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  hide() {
    this.visible = false;
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  showInstructions() {
    if (this.elements.instructions) {
      this.elements.instructions.style.display = 'block';
    }
  }

  hideInstructions() {
    if (this.elements.instructions) {
      this.elements.instructions.style.display = 'none';
    }
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.elements = {};
  }

  /**
   * 处理窗口大小变化
   * @param {Object} gameSize - 游戏尺寸对象 { width, height }
   */
  handleResize(gameSize) {
    // DOM UI 自动适应屏幕，无需手动调整位置
    // 但可以在这里处理一些响应式样式调整
    const width = gameSize.width;
    const height = gameSize.height;

    // 根据屏幕尺寸调整UI字体大小
    if (this.container) {
      const isSmallScreen = width < 600 || height < 400;
      if (isSmallScreen) {
        this.container.classList.add('small-screen');
      } else {
        this.container.classList.remove('small-screen');
      }
    }
  }
}
