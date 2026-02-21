/**
 * 设备检测工具类
 * 集中管理所有设备相关检测逻辑
 */
export class DeviceDetector {
  /**
   * 检测是否为移动设备
   * @returns {boolean}
   */
  static isMobile() {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth < 1024;
    return mobileKeywords.test(userAgent) || (hasTouch && isSmallScreen);
  }

  /**
   * 检测是否为横屏模式
   * @returns {boolean}
   */
  static isLandscape() {
    if (screen.orientation && screen.orientation.type) {
      return screen.orientation.type.includes('landscape');
    }
    return window.innerWidth > window.innerHeight;
  }
}
