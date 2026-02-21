import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: true,
    open: true
  },
  // 使用相对路径，支持任意部署环境
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 确保所有资源都被正确处理
    assetsInlineLimit: 0
  },
  // 将 assets 文件夹作为 public 目录
  // 构建时会自动复制到 dist 目录
  publicDir: 'assets'
});
