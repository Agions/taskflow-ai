import { defineConfig } from 'vitepress'
import { nav, sidebar, themeConfig, head, vite, markdown } from './config'

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
    ...themeConfig,
    nav,
    sidebar
  },

  // Vite 配置
  vite,

  // 头部配置
  head,

  // Markdown配置
  markdown,

  // 站点地图
  sitemap: {
    hostname: 'https://agions.github.io/taskflow-ai/'
  }
})
