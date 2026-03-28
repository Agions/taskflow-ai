import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // 自定义布局插槽
    })
  },
  enhanceApp({ app, router, siteData }) {
    // 注册全局组件
  }
} satisfies Theme
