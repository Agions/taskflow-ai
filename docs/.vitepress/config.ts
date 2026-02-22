import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'TaskFlow AI',
  description: 'TaskFlow AI - 智能PRD文档解析与任务管理助手，专为开发团队设计的AI驱动任务编排工具',

  // GitHub Pages 优化配置
  base: '/taskflow-ai/',
  lang: 'zh-CN',
  cleanUrls: false,
  ignoreDeadLinks: true,
  lastUpdated: true,

  // 确保资源正确加载
  assetsDir: 'assets',
  cacheDir: '.vitepress/cache',



  // 主题配置
  themeConfig: {
    // 网站标题和Logo
    logo: '/assets/logo.svg',
    siteTitle: 'TaskFlow AI',

    // 导航栏 - 确保专业版本
    nav: [
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
    ],

    // 侧边栏 - 专业版结构
    sidebar: {
      '/guide/': [
        {
          text: '🚀 快速入门',
          collapsed: false,
          items: [
            { text: '安装指南', link: '/guide/installation' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '基础使用', link: '/guide/basic-usage' },
            { text: '项目需求', link: '/guide/project-requirements' }
          ]
        },
        {
          text: '📖 核心功能',
          collapsed: false,
          items: [
            { text: '高级特性', link: '/guide/advanced-features' },
            { text: '使用示例', link: '/guide/examples' },
            { text: '系统架构', link: '/guide/architecture' }
          ]
        },
        {
          text: '🔌 编辑器集成',
          collapsed: false,
          items: [
            { text: 'MCP 配置指南', link: '/guide/mcp-setup' },
            { text: 'MCP 集成说明', link: '/guide/mcp-integration' }
          ]
        }
      ],

      '/api/': [
        {
          text: '📚 API 概览',
          collapsed: false,
          items: [
            { text: 'API 总览', link: '/api/' },
            { text: '完整 API 参考', link: '/api-reference' }
          ]
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
            { text: '项目配置', link: '/api/project-config' }
          ]
        },
        {
          text: '📝 类型定义',
          collapsed: true,
          items: [
            { text: '配置类型', link: '/api/types/config' },
            { text: '核心类型', link: '/api/types/core' },
            { text: '模型类型', link: '/api/types/model' },
            { text: '任务类型', link: '/api/types/task' }
          ]
        }
      ],

      '/editor-config/': [
        {
          text: '🔌 编辑器集成',
          collapsed: false,
          items: [
            { text: '编辑器概览', link: '/editor-config/overview' },
            { text: 'Cursor 配置', link: '/editor-config/cursor' },
            { text: 'Windsurf/Trae', link: '/editor-config/windsurf-trae-integration' }
          ]
        }
      ],

      '/user-guide/': [
        {
          text: '📖 用户手册',
          collapsed: false,
          items: [
            { text: '用户指南', link: '/user-guide/user-manual' },
            { text: 'CLI 命令', link: '/user-guide/cli-commands' },
            { text: '工作流程', link: '/user-guide/workflows' },
            { text: '最佳实践', link: '/user-guide/best-practices' }
          ]
        }
      ],

      '/reference/': [
        {
          text: '📙 技术参考',
          collapsed: false,
          items: [
            { text: 'CLI 参考', link: '/reference/cli' },
            { text: '配置选项', link: '/reference/configuration' },
            { text: '环境变量', link: '/reference/environment' },
            { text: '错误代码', link: '/reference/error-codes' }
          ]
        }
      ],

      '/development/': [
        {
          text: '💻 开发文档',
          collapsed: false,
          items: [
            { text: '开发者指南', link: '/development/developer-guide' },
            { text: '贡献指南', link: '/development/contributing' }
          ]
        },
        {
          text: '🧪 测试与部署',
          collapsed: false,
          items: [
            { text: '测试指南', link: '/testing/' },
            { text: '部署指南', link: '/deployment/' }
          ]
        }
      ],

      '/troubleshooting/': [
        {
          text: '🔧 故障排除',
          collapsed: false,
          items: [
            { text: '常见问题', link: '/troubleshooting/common-issues' },
            { text: '安装问题', link: '/troubleshooting/installation' },
            { text: '配置问题', link: '/troubleshooting/configuration' },
            { text: '性能问题', link: '/troubleshooting/performance' }
          ]
        }
      ],

      '/examples/': [
        {
          text: '📦 示例文档',
          collapsed: false,
          items: [
            { text: 'PRD 示例', link: '/examples/example-prd' }
          ]
        }
      ]
    },

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/agions/taskflow-ai' }
    ],

    // 页脚
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Agions'
    },

    // 搜索
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
          }
        }
      }
    },

    // 编辑链接
    editLink: {
      pattern: 'https://github.com/agions/taskflow-ai/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    // 最后更新时间
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },

    // 文档页脚导航
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    // 大纲配置
    outline: {
      level: [2, 3],
      label: '页面导航'
    },

    // 返回顶部
    returnToTopLabel: '返回顶部'
  },

  // 构建配置
  vite: {
    // 自定义 Vite 配置
    define: {
      __VUE_OPTIONS_API__: false,
      __VUE_PROD_DEVTOOLS__: false
    },

    // 服务器配置
    server: {
      host: true,
      port: 5173
    },

    // 构建优化 - 简化配置避免冲突
    build: {
      minify: 'esbuild',
      chunkSizeWarningLimit: 1000,
      target: 'es2015'
    }
  },

  // 头部配置
  head: [
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
  ],

  // Markdown配置
  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  },

  // 站点地图
  sitemap: {
    hostname: 'https://agions.github.io/taskflow-ai/'
  }
})
