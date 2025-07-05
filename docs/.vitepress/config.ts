import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'TaskFlow AI',
  description: '智能PRD文档解析与任务管理助手',
  
  // 基础配置
  base: '/taskflow-ai/',
  lang: 'zh-CN',

  // 忽略死链接检查
  ignoreDeadLinks: true,

  // Vue配置 - 处理模板语法冲突
  vue: {
    template: {
      compilerOptions: {
        // 自定义元素处理
        isCustomElement: (tag) => tag.includes('-') || tag.startsWith('v-')
      }
    }
  },


  
  // 主题配置
  themeConfig: {
    // 网站标题和Logo
    logo: '/assets/logo.svg',
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
          text: '开发指南',
          items: [
            { text: '开发者指南', link: '/guide/developer-guide' },
            { text: '贡献指南', link: '/guide/contributing' },
            { text: '架构设计', link: '/guide/architecture' }
          ]
        }
      ],
      
      '/user-guide/': [
        {
          text: '用户手册',
          items: [
            { text: '用户手册', link: '/user-guide/user-manual' },
            { text: 'CLI命令', link: '/user-guide/cli-commands' },
            { text: '工作流程', link: '/user-guide/workflows' },
            { text: '最佳实践', link: '/user-guide/best-practices' }
          ]
        }
      ],
      
      '/api/': [
        {
          text: 'API 文档',
          items: [
            { text: 'API 概述', link: '/api/' },
            { text: 'PRD 解析器', link: '/api/prd-parser' },
            { text: '任务管理器', link: '/api/task-manager' },
            { text: 'AI 编排器', link: '/api/ai-orchestrator' },
            { text: '项目配置管理', link: '/api/project-config' },
            { text: '配置管理', link: '/api/config-manager' }
          ]
        },
        {
          text: '类型定义',
          items: [
            { text: '核心类型', link: '/api/types/core' },
            { text: '任务类型', link: '/api/types/task' },
            { text: '配置类型', link: '/api/types/config' },
            { text: '模型类型', link: '/api/types/model' }
          ]
        }
      ],
      
      '/reference/': [
        {
          text: '参考文档',
          items: [
            { text: '配置参考', link: '/reference/configuration' },
            { text: 'CLI 参考', link: '/reference/cli' },
            { text: '环境变量', link: '/reference/environment' },
            { text: '错误代码', link: '/reference/error-codes' }
          ]
        }
      ],
      
      '/troubleshooting/': [
        {
          text: '故障排除',
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
    
    // 编辑链接
    editLink: {
      pattern: 'https://github.com/agions/taskflow-ai/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },
    
    // 最后更新时间
    lastUpdated: {
      text: '最后更新',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },
    
    // 搜索
    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
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
                  navigateText: '切换'
                }
              }
            }
          }
        }
      }
    },
    
    // 大纲配置
    outline: {
      level: [2, 3],
      label: '页面导航'
    },
    
    // 返回顶部
    returnToTopLabel: '返回顶部',
    
    // 侧边栏菜单标签
    sidebarMenuLabel: '菜单',
    
    // 深色模式切换标签
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  },
  
  // Markdown 配置
  markdown: {
    // 代码块主题
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },

    // 代码块行号
    lineNumbers: true,

    // 允许HTML标签
    html: true,

    // 代码块复制按钮
    codeTransformers: [
      // 添加复制按钮
    ]
  },
  
  // 头部配置
  head: [
    // Favicon
    ['link', { rel: 'icon', href: '/taskflow-ai/favicon.ico' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/taskflow-ai/logo.svg' }],
    
    // Meta tags
    ['meta', { name: 'theme-color', content: '#00D2FF' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'zh_CN' }],
    ['meta', { name: 'og:title', content: 'TaskFlow AI | 智能PRD文档解析与任务管理助手' }],
    ['meta', { name: 'og:site_name', content: 'TaskFlow AI' }],
    ['meta', { name: 'og:image', content: '/taskflow-ai/og-image.png' }],
    ['meta', { name: 'og:url', content: 'https://agions.github.io/taskflow-ai/' }],
    ['meta', { name: 'og:description', content: '智能PRD文档解析与任务管理助手，支持多个国产大模型，提供企业级的任务管理解决方案。' }],
    
    // Twitter Card
    // ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    // ['meta', { name: 'twitter:image', content: '/taskflow-ai/og-image.png' }],
    
    // Google Analytics (可选)
    // ['script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID' }],
    // ['script', {}, `window.dataLayer = window.dataLayer || [];
    //   function gtag(){dataLayer.push(arguments);}
    //   gtag('js', new Date());
    //   gtag('config', 'GA_MEASUREMENT_ID');`]
  ],
  
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
      fs: {
        allow: ['..']
      }
    },
    
    // 构建配置
    build: {
      minify: 'terser',
      chunkSizeWarningLimit: 1000
    }
  },
  
  // 站点地图
  sitemap: {
    hostname: 'https://agions.github.io/taskflow-ai/'
  },
  
  // 清理 URL
  cleanUrls: true,
  

  
  // MPA 模式（如果需要）
  mpa: false,
  
  // 缓存目录
  cacheDir: './.vitepress/cache',
  
  // 输出目录
  outDir: './.vitepress/dist'
})
