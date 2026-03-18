/**
 * 头部配置
 */

export const head = [
  ['link', { rel: 'icon', href: '/taskflow-ai/favicon.ico' }],
  ['link', { rel: 'icon', type: 'image/svg+xml', href: '/taskflow-ai/favicon.svg' }],
  ['meta', { name: 'theme-color', content: '#3c82f6' }],
  ['meta', { name: 'og:type', content: 'website' }],
  ['meta', { name: 'og:locale', content: 'zh-CN' }],
  ['meta', { name: 'og:site_name', content: 'TaskFlow AI' }],
  ['meta', { name: 'og:image', content: 'https://agions.github.io/taskflow-ai/og-image.png' }],
  ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  // 强制刷新缓存 - 企业级重构版本
  ['meta', { name: 'cache-control', content: 'no-cache, no-store, must-revalidate' }],
  ['meta', { name: 'pragma', content: 'no-cache' }],
  ['meta', { name: 'expires', content: '0' }],
  ['meta', { name: 'version', content: 'enterprise-refactor-2024' }]
];
