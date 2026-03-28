/**
 * 导航栏配置
 * 专业、清晰、层次分明
 */

export const nav = [
  { 
    text: '首页', 
    link: '/' 
  },
  {
    text: '指南',
    items: [
      { text: '快速开始', link: '/guide/getting-started' },
      { text: '安装指南', link: '/guide/installation' },
      { text: '基本使用', link: '/guide/basic-usage' },
      { text: '高级功能', link: '/guide/advanced-features' },
      { text: '系统架构', link: '/guide/architecture' }
    ]
  },
  {
    text: 'API 参考',
    items: [
      { text: 'API 概览', link: '/api/' },
      { text: 'AI 编排器', link: '/api/ai-orchestrator' },
      { text: '配置管理器', link: '/api/config-manager' },
      { text: 'PRD 解析器', link: '/api/prd-parser' },
      { text: '任务管理器', link: '/api/task-manager' },
      { text: '完整 API', link: '/api-reference' }
    ]
  },
  {
    text: '集成',
    items: [
      { text: 'MCP 配置', link: '/guide/mcp-setup' },
      { text: 'Cursor', link: '/editor-config/cursor' },
      { text: 'Windsurf/Trae', link: '/editor-config/windsurf-trae-integration' },
      { text: '编辑器概览', link: '/editor-config/overview' }
    ]
  },
  {
    text: '参考',
    items: [
      { text: 'CLI 命令', link: '/reference/cli' },
      { text: '配置选项', link: '/reference/configuration' },
      { text: '环境变量', link: '/reference/environment' },
      { text: '错误代码', link: '/reference/error-codes' }
    ]
  },
  {
    text: '更多',
    items: [
      { text: '常见问题', link: '/faq' },
      { text: '故障排除', link: '/troubleshooting/common-issues' },
      { text: '更新日志', link: '/changelog' },
      { text: '贡献指南', link: '/development/contributing' },
      { text: '─'.repeat(12), link: '' },
      { text: 'GitHub', link: 'https://github.com/agions/taskflow-ai' },
      { text: 'NPM', link: 'https://www.npmjs.com/package/taskflow-ai' }
    ]
  }
];
