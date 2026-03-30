import { defineConfig } from 'vitepress'
import { nav, sidebar, themeConfig, head, vite, markdown } from './config-internal'

export default defineConfig({
  // 站点信息
  title: 'TaskFlow AI',
  titleTemplate: ':title | TaskFlow AI',
  description: 'TaskFlow AI - 智能PRD文档解析与任务管理助手，专为开发团队设计的AI驱动任务编排工具',

  // 部署配置
  base: '/taskflow-ai/',
  lang: 'zh-CN',
  
  // 构建配置
  cleanUrls: false,
  ignoreDeadLinks: true,
  lastUpdated: true,
  
  // 资源配置
  assetsDir: 'assets',
  cacheDir: '.vitepress/cache',

  // 主题配置（合并 nav、sidebar）
  themeConfig: {
    ...themeConfig,
    nav,
    sidebar
  },

  // Vite 配置
  vite,

  // 头部配置
  head,

  // Markdown 配置
  markdown,

  // 站点地图
  sitemap: {
    hostname: 'https://agions.github.io/taskflow-ai/',
    lastmodDateOnly: true
  },

  // 多语言支持 (预留)
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN'
    }
  },

  // 构建钩子
  transformHead({ pageData }) {
    const frontmatter = pageData.frontmatter
    if (frontmatter.title) {
      return [
        ['title', `${frontmatter.title} | TaskFlow AI`]
      ]
    }
  }
})
