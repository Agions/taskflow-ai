/**
 * 导航栏配置
 */

export const nav = [
  { text: '首页', link: '/' },
  {
    text: '指南',
    items: [
      { text: '快速开始', link: '/guide/getting-started' },
      { text: '安装指南', link: '/guide/installation' },
      { text: '基本使用', link: '/guide/basic-usage' },
      { text: '高级功能', link: '/guide/advanced-features' }
    ]
  },
  {
    text: 'API参考',
    items: [
      { text: 'API概览', link: '/api/' },
      { text: '配置管理', link: '/api/config-manager' },
      { text: 'PRD解析器', link: '/api/prd-parser' },
      { text: '任务管理器', link: '/api/task-manager' },
      { text: 'AI编排器', link: '/api/ai-orchestrator' }
    ]
  },
  {
    text: '用户手册',
    items: [
      { text: '用户指南', link: '/user-guide/user-manual' },
      { text: 'CLI命令', link: '/user-guide/cli-commands' },
      { text: '最佳实践', link: '/user-guide/best-practices' },
      { text: '工作流程', link: '/user-guide/workflows' }
    ]
  },
  {
    text: '技术参考',
    items: [
      { text: '配置选项', link: '/reference/configuration' },
      { text: 'CLI参考', link: '/reference/cli' },
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
      { text: '贡献指南', link: '/guide/contributing' },
      { text: 'GitHub', link: 'https://github.com/agions/taskflow-ai' }
    ]
  }
];
