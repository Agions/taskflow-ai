/**
 * 主题配置
 */

export const themeConfig = {
  // 网站标题和Logo
  logo: '/assets/logo.svg',
  siteTitle: 'TaskFlow AI',

  // 社交链接
  socialLinks: [
    { icon: 'github', link: 'https://github.com/agions/taskflow-ai' },
    { icon: { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 1.608l-9.9 4.02v10.392l9.9 4.372 9.9-4.372V5.628L12 1.608zm0 2.19l7.2 2.928v7.348L12 16.698l-7.2-2.624V6.726L12 3.798z"/></svg>' }, link: 'https://www.npmjs.com/package/taskflow-ai' }
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
};
