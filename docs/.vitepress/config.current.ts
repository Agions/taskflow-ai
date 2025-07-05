import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'TaskFlow AI',
  description: 'TaskFlow AI - 智能PRD文档解析与任务管理助手',
  
  // 基础配置
  base: '/taskflow-ai/',
  lang: 'zh-CN',
  
  // 忽略死链接检查
  ignoreDeadLinks: true,
  
  // 主题配置
  themeConfig: {
    // 网站标题和Logo
    logo: '/taskflow-ai/assets/logo.svg',
    siteTitle: 'TaskFlow AI',
    
    // 导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: '参考', link: '/reference/configuration' },
      {
        text: '更多',
        items: [
          { text: '常见问题', link: '/faq' },
          { text: '故障排除', link: '/troubleshooting/common-issues' },
          { text: '更新日志', link: '/changelog' },
          { text: 'GitHub', link: 'https://github.com/agions/taskflow-ai' }
        ]
      }
    ],
    
    // 侧边栏
    sidebar: {
      '/guide/': [
        {
          text: '开始使用',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装指南', link: '/guide/installation' },
            { text: '基本使用', link: '/guide/basic-usage' },
            { text: '高级功能', link: '/guide/advanced-features' }
          ]
        },
        {
          text: '核心概念',
          items: [
            { text: 'PRD解析', link: '/guide/prd-parsing' },
            { text: '任务管理', link: '/guide/task-management' },
            { text: 'AI模型集成', link: '/guide/ai-integration' }
          ]
        }
      ],
      
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '概览', link: '/api/' },
            { text: '配置管理', link: '/api/config-manager' },
            { text: 'PRD解析器', link: '/api/prd-parser' },
            { text: '任务管理器', link: '/api/task-manager' },
            { text: 'AI服务', link: '/api/ai-service' }
          ]
        }
      ],
      
      '/reference/': [
        {
          text: '参考文档',
          items: [
            { text: '配置选项', link: '/reference/configuration' },
            { text: 'CLI命令', link: '/reference/cli' },
            { text: '环境变量', link: '/reference/environment' }
          ]
        }
      ],
      
      '/editor-config/': [
        {
          text: '编辑器配置',
          items: [
            { text: '概览', link: '/editor-config/' },
            { text: 'VS Code', link: '/editor-config/vscode' },
            { text: 'Cursor', link: '/editor-config/cursor' },
            { text: 'WebStorm', link: '/editor-config/webstorm' }
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
      copyright: 'Copyright © 2024 TaskFlow AI'
    },
    
    // 搜索
    search: {
      provider: 'local'
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
    }
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
    
    // 构建优化
    build: {
      minify: 'terser',
      chunkSizeWarningLimit: 1000
    }
  },
  
  // 头部配置
  head: [
    ['link', { rel: 'icon', href: '/taskflow-ai/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3c82f6' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'zh-CN' }],
    ['meta', { name: 'og:site_name', content: 'TaskFlow AI' }],
    ['meta', { name: 'og:image', content: 'https://agions.github.io/taskflow-ai/og-image.png' }]
  ],
  
  // Markdown配置
  markdown: {
    lineNumbers: true,
    config: (md) => {
      // 可以在这里添加markdown插件
    }
  }
})
