/**
 * 侧边栏配置
 * 清晰的层次结构，便于导航
 */

export const sidebar = {
  // 指南
  '/guide/': [
    {
      text: '🚀 快速入门',
      collapsed: false,
      items: [
        { text: '安装指南', link: '/guide/installation' },
        { text: '快速开始', link: '/guide/getting-started' },
        { text: '基础使用', link: '/guide/basic-usage' },
        { text: '项目需求', link: '/guide/project-requirements' },
      ],
    },
    {
      text: '📖 核心功能',
      collapsed: false,
      items: [
        { text: '高级特性', link: '/guide/advanced-features' },
        { text: '使用示例', link: '/guide/examples' },
        { text: '系统架构', link: '/guide/architecture' },
      ],
    },
    {
      text: '🔌 编辑器集成',
      collapsed: false,
      items: [
        { text: 'MCP 配置指南', link: '/guide/mcp-setup' },
        { text: 'MCP 集成说明', link: '/guide/mcp-integration' },
      ],
    },
  ],

  // API 参考
  '/api/': [
    {
      text: '📚 API 概览',
      collapsed: false,
      items: [
        { text: 'API 总览', link: '/api/' },
        { text: '完整 API 参考', link: '/api-reference' },
      ],
    },
    {
      text: '🔧 核心模块',
      collapsed: false,
      items: [
        { text: 'AI 编排器', link: '/api/ai-orchestrator' },
        { text: '配置管理器', link: '/api/config-manager' },
        { text: 'PRD 解析器', link: '/api/prd-parser' },
        { text: '任务管理器', link: '/api/task-manager' },
        { text: '任务编排', link: '/api/task-orchestration' },
        { text: '项目配置', link: '/api/project-config' },
      ],
    },
    {
      text: '📝 类型定义',
      collapsed: true,
      items: [
        { text: '配置类型', link: '/api/types/config' },
        { text: '核心类型', link: '/api/types/core' },
        { text: '模型类型', link: '/api/types/model' },
        { text: '任务类型', link: '/api/types/task' },
      ],
    },
  ],

  // 编辑器配置
  '/editor-config/': [
    {
      text: '🔌 编辑器集成',
      collapsed: false,
      items: [
        { text: '编辑器概览', link: '/editor-config/overview' },
        { text: 'Cursor 配置', link: '/editor-config/cursor' },
        { text: 'Windsurf/Trae', link: '/editor-config/windsurf-trae-integration' },
      ],
    },
  ],

  // 用户指南
  '/user-guide/': [
    {
      text: '📖 用户手册',
      collapsed: false,
      items: [
        { text: '用户指南', link: '/user-guide/user-manual' },
        { text: 'CLI 命令', link: '/user-guide/cli-commands' },
        { text: '工作流程', link: '/user-guide/workflows' },
        { text: '最佳实践', link: '/user-guide/best-practices' },
      ],
    },
  ],

  // 技术参考
  '/reference/': [
    {
      text: '📙 技术参考',
      collapsed: false,
      items: [
        { text: 'CLI 参考', link: '/reference/cli' },
        { text: '配置选项', link: '/reference/configuration' },
        { text: '环境变量', link: '/reference/environment' },
        { text: '错误代码', link: '/reference/error-codes' },
      ],
    },
  ],

  // 开发文档
  '/development/': [
    {
      text: '💻 开发文档',
      collapsed: false,
      items: [
        { text: '开发者指南', link: '/development/developer-guide' },
        { text: '贡献指南', link: '/development/contributing' },
      ],
    },
  ],

  // 测试
  '/testing/': [
    {
      text: '🧪 测试指南',
      collapsed: false,
      items: [{ text: '测试文档', link: '/testing/' }],
    },
  ],

  // 部署
  '/deployment/': [
    {
      text: '🚀 部署指南',
      collapsed: false,
      items: [{ text: '部署文档', link: '/deployment/' }],
    },
  ],

  // 故障排除
  '/troubleshooting/': [
    {
      text: '🔧 故障排除',
      collapsed: false,
      items: [
        { text: '常见问题', link: '/troubleshooting/common-issues' },
        { text: '安装问题', link: '/troubleshooting/installation' },
        { text: '配置问题', link: '/troubleshooting/configuration' },
        { text: '性能问题', link: '/troubleshooting/performance' },
      ],
    },
  ],

  // MCP
  '/mcp/': [
    {
      text: '🔌 MCP 集成',
      collapsed: false,
      items: [{ text: 'MCP 文档', link: '/mcp/' }],
    },
  ],
};
