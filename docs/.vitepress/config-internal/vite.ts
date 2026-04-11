/**
 * Vite 配置
 */

export const vite = {
  // 自定义 Vite 配置
  define: {
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false,
  },

  // 服务器配置
  server: {
    host: true,
    port: 5173,
  },

  // 构建优化 - 简化配置避免冲突
  build: {
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    target: 'es2015',
  },
};
