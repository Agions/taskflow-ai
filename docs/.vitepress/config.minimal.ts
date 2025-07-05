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
    // 网站标题
    siteTitle: 'TaskFlow AI',
    
    // 简化的导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/guide/getting-started' }
    ],
    
    // 简化的侧边栏
    sidebar: [
      {
        text: '开始使用',
        items: [
          { text: '介绍', link: '/' },
          { text: '快速开始', link: '/guide/getting-started' }
        ]
      }
    ],
    
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
    }
  },
  
  // 构建配置
  vite: {
    // 自定义 Vite 配置
    define: {
      __VUE_OPTIONS_API__: false,
      __VUE_PROD_DEVTOOLS__: false
    }
  }
})
