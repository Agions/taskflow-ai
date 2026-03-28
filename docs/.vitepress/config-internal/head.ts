/**
 * 头部配置
 * SEO 优化、社交媒体卡片
 */

export const head = [
  // Favicon
  ['link', { rel: 'icon', type: 'image/svg+xml', href: '/taskflow-ai/assets/logo.svg' }],
  ['link', { rel: 'apple-touch-icon', href: '/taskflow-ai/assets/logo.svg' }],
  
  // SEO Meta
  ['meta', { name: 'author', content: 'Agions Team' }],
  ['meta', { name: 'keywords', content: 'TaskFlow AI, AI, Task Management, PRD Parser, MCP, Model Context Protocol, DeepSeek, OpenAI, Claude, Cursor, Windsurf, CLI Tool, TypeScript' }],
  
  // Open Graph
  ['meta', { property: 'og:type', content: 'website' }],
  ['meta', { property: 'og:site_name', content: 'TaskFlow AI' }],
  ['meta', { property: 'og:title', content: 'TaskFlow AI - AI 思维流编排引擎' }],
  ['meta', { property: 'og:description', content: '从任务执行升级为思维编排 - 专为开发团队打造的下一代 AI 开发工具' }],
  ['meta', { property: 'og:image', content: 'https://agions.github.io/taskflow-ai/assets/og-image.png' }],
  ['meta', { property: 'og:url', content: 'https://agions.github.io/taskflow-ai/' }],
  
  // Twitter Card
  ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ['meta', { name: 'twitter:title', content: 'TaskFlow AI - AI 思维流编排引擎' }],
  ['meta', { name: 'twitter:description', content: '从任务执行升级为思维编排 - 专为开发团队打造的下一代 AI 开发工具' }],
  ['meta', { name: 'twitter:image', content: 'https://agions.github.io/taskflow-ai/assets/og-image.png' }],
  
  // 主题色
  ['meta', { name: 'theme-color', content: '#3b82f6' }],
  ['meta', { name: 'msapplication-TileColor', content: '#3b82f6' }],
  
  // Canonical URL
  ['link', { rel: 'canonical', href: 'https://agions.github.io/taskflow-ai/' }]
];
