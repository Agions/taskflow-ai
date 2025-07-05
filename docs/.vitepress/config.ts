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
    
    // 侧边栏 - 确保完整结构
    sidebar: {
      '/guide/': [
        {
          text: '开始使用',
          collapsed: false,
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装指南', link: '/guide/installation' },
            { text: '基本使用', link: '/guide/basic-usage' },
            { text: '高级功能', link: '/guide/advanced-features' }
          ]
        },
        {
          text: '核心概念',
          collapsed: false,
          items: [
            { text: '系统架构', link: '/guide/architecture' },
            { text: 'MCP集成', link: '/guide/mcp-integration' },
            { text: '开发者指南', link: '/guide/developer-guide' },
            { text: '贡献指南', link: '/guide/contributing' }
          ]
        }
      ],
      
      '/api/': [
        {
          text: 'API 参考',
          collapsed: false,
          items: [
            { text: 'API概览', link: '/api/' },
            { text: '配置管理器', link: '/api/config-manager' },
            { text: 'PRD解析器', link: '/api/prd-parser' },
            { text: '任务管理器', link: '/api/task-manager' },
            { text: 'AI编排器', link: '/api/ai-orchestrator' },
            { text: '项目配置', link: '/api/project-config' }
          ]
        }
      ],
      
      '/user-guide/': [
        {
          text: '用户手册',
          collapsed: false,
          items: [
            { text: '用户指南', link: '/user-guide/user-manual' },
            { text: 'CLI命令', link: '/user-guide/cli-commands' },
            { text: '最佳实践', link: '/user-guide/best-practices' },
            { text: '工作流程', link: '/user-guide/workflows' }
          ]
        }
      ],
      
      '/reference/': [
        {
          text: '技术参考',
          collapsed: false,
          items: [
            { text: '配置选项', link: '/reference/configuration' },
            { text: 'CLI参考', link: '/reference/cli' },
            { text: '环境变量', link: '/reference/environment' },
            { text: '错误代码', link: '/reference/error-codes' }
          ]
        }
      ],
      
      '/troubleshooting/': [
        {
          text: '故障排除',
          collapsed: false,
          items: [
            { text: '常见问题', link: '/troubleshooting/common-issues' },
            { text: '安装问题', link: '/troubleshooting/installation' },
            { text: '配置问题', link: '/troubleshooting/configuration' },
            { text: '性能问题', link: '/troubleshooting/performance' }
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
    
    // 构建优化 - 修复terser问题和资源文件
    build: {
      minify: 'esbuild',
      chunkSizeWarningLimit: 1000,
      target: 'es2015',
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash].[ext]',
          chunkFileNames: 'assets/[name].[hash].js',
          entryFileNames: 'assets/[name].[hash].js'
        }
      }
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
