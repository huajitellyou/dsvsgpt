import { BaseEnemy } from '../base/BaseEnemy.js';

/**
 * 小G - 普通敌人
 */
export class GPTEnemy extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'gpt');

    // 设置显示尺寸
    const displayWidth = 120;
    const displayHeight = 120;
    this.setDisplaySize(displayWidth, displayHeight);
    this.body.setSize(displayWidth, displayHeight);

    this.body.setGravityY(1000);
    this.setFlipX(true);
  }

  init() {
    // GPT特有的初始化
  }
}
