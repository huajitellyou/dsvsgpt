/**
 * 游戏结束UI - 基于DOM实现
 * 透明简洁风格，保持与技能选择界面一致的设计语言
 */
export class GameOverUI {
  constructor(scene) {
    this.scene = scene;
    this.isVisible = false;
    this.onRestart = null;

    // DOM元素引用
    this.overlay = null;
    this.scoreEl = null;
    this.levelEl = null;
    this.restartBtn = null;
    this.boundHandleRestart = this.handleRestart.bind(this);

    this.init();
  }

  /**
   * 初始化UI - 获取DOM元素并绑定事件
   */
  init() {
    // 获取遮罩层
    this.overlay = document.getElementById('game-over-overlay');
    if (!this.overlay) {
      console.error('Game over overlay not found in DOM');
      return;
    }

    // 获取统计数据元素
    this.scoreEl = document.getElementById('game-over-score');
    this.levelEl = document.getElementById('game-over-level');

    // 获取重新开始按钮
    this.restartBtn = document.getElementById('game-over-restart');
    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', this.boundHandleRestart);
    }

    console.log('GameOverUI DOM initialized');
  }

  /**
   * 处理重新开始按钮点击
   */
  handleRestart() {
    console.log('Restart button clicked');

    if (this.onRestart) {
      this.onRestart();
    }

    this.hide();
  }

  /**
   * 重置动画 - 重新触发动画
   */
  resetAnimations() {
    const content = this.overlay?.querySelector('.game-over-content');
    if (content) {
      content.style.animation = 'none';
      // 强制重绘
      void content.offsetHeight;
      content.style.animation = '';
    }
  }

  /**
   * 显示游戏结束界面
   * @param {Object} stats - 游戏统计数据
   * @param {number} stats.score - 最终得分
   * @param {number} stats.level - 达到等级
   * @param {Function} onRestart - 重新开始回调函数
   */
  show(stats, onRestart) {
    console.log('GameOverUI.show called', stats);

    if (!this.overlay) {
      console.error('Overlay not initialized');
      return;
    }

    this.onRestart = onRestart;

    // 更新统计数据
    if (this.scoreEl && stats.score !== undefined) {
      this.scoreEl.textContent = stats.score.toString();
    }

    if (this.levelEl && stats.level !== undefined) {
      this.levelEl.textContent = stats.level.toString();
    }

    // 重置动画状态
    this.resetAnimations();

    // 显示遮罩层
    this.isVisible = true;
    this.overlay.classList.add('visible');

    console.log('Game over UI shown');
  }

  /**
   * 隐藏游戏结束界面
   */
  hide() {
    console.log('GameOverUI.hide called');

    this.isVisible = false;
    this.onRestart = null;

    if (this.overlay) {
      this.overlay.classList.remove('visible');
    }

    console.log('Game over UI hidden');
  }

  /**
   * 销毁UI - 清理事件监听
   */
  destroy() {
    console.log('GameOverUI.destroy called');

    // 移除事件监听
    if (this.restartBtn) {
      this.restartBtn.removeEventListener('click', this.boundHandleRestart);
    }

    this.hide();
    this.overlay = null;
    this.scoreEl = null;
    this.levelEl = null;
    this.restartBtn = null;

    console.log('Game over UI destroyed');
  }
}
