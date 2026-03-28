<template>
  <div class="home-content">
    <!-- 快速开始 -->
    <section class="section">
      <h2>⚡ 快速开始</h2>
      <div class="code-group">
        <div class="tabs">
          <button :class="{ active: activeTab === 'npm' }" @click="activeTab = 'npm'">npm</button>
          <button :class="{ active: activeTab === 'source' }" @click="activeTab = 'source'">源码安装</button>
        </div>
        <div class="code-block">
          <pre v-if="activeTab === 'npm'"><code>npm install -g taskflow-ai</code></pre>
          <pre v-else><code>git clone https://github.com/Agions/taskflow-ai.git
cd taskflow-ai
npm install && npm run build</code></pre>
          <button class="copy-btn" @click="copyCode">复制</button>
        </div>
      </div>
    </section>

    <!-- 核心功能 -->
    <section class="section">
      <h2>🎯 核心功能</h2>
      <div class="feature-grid">
        <div class="feature-item">
          <h4>思维链分析</h4>
          <code>taskflow think "帮我分析用户登录功能需求"</code>
          <p>输出思维链分析，包含推理步骤、置信度</p>
        </div>
        <div class="feature-item">
          <h4>模型路由</h4>
          <code>taskflow model route "帮我写个排序算法"</code>
          <p>智能选择最适合的模型</p>
        </div>
        <div class="feature-item">
          <h4>工作流执行</h4>
          <code>taskflow flow run prd-to-code</code>
          <p>执行完整的 PRD → 代码工作流</p>
        </div>
        <div class="feature-item">
          <h4>Agent 自主执行</h4>
          <code>taskflow agent run executor "帮我创建一个 API"</code>
          <p>Agent 自主完成复杂任务</p>
        </div>
      </div>
    </section>

    <!-- 文档导航 -->
    <section class="section">
      <h2>📚 文档导航</h2>
      <div class="doc-grid">
        <div class="doc-card">
          <h3>🚀 入门指南</h3>
          <p>快速上手 TaskFlow AI</p>
          <ul>
            <li><a href="/guide/installation">安装指南</a></li>
            <li><a href="/guide/getting-started">快速开始</a></li>
            <li><a href="/guide/basic-usage">基础使用</a></li>
            <li><a href="/guide/project-requirements">项目需求</a></li>
          </ul>
        </div>
        <div class="doc-card">
          <h3>📖 用户手册</h3>
          <p>深入了解功能特性</p>
          <ul>
            <li><a href="/guide/advanced-features">高级特性</a></li>
            <li><a href="/user-guide/workflows">工作流指南</a></li>
            <li><a href="/user-guide/best-practices">最佳实践</a></li>
            <li><a href="/guide/examples">使用示例</a></li>
          </ul>
        </div>
        <div class="doc-card">
          <h3>🔌 编辑器集成</h3>
          <p>与 AI 编辑器无缝集成</p>
          <ul>
            <li><a href="/guide/mcp-setup">MCP 配置指南</a></li>
            <li><a href="/editor-config/cursor">Cursor 集成</a></li>
            <li><a href="/editor-config/windsurf-trae-integration">Windsurf/Trae</a></li>
            <li><a href="/editor-config/overview">编辑器概览</a></li>
          </ul>
        </div>
        <div class="doc-card">
          <h3>🛠️ API 参考</h3>
          <p>完整的 API 文档</p>
          <ul>
            <li><a href="/api/">API 概览</a></li>
            <li><a href="/reference/cli">CLI 命令</a></li>
            <li><a href="/reference/configuration">配置选项</a></li>
            <li><a href="/api-reference">完整 API</a></li>
          </ul>
        </div>
        <div class="doc-card">
          <h3>💻 开发者</h3>
          <p>参与项目开发</p>
          <ul>
            <li><a href="/development/developer-guide">开发者指南</a></li>
            <li><a href="/development/contributing">贡献指南</a></li>
            <li><a href="/guide/architecture">架构设计</a></li>
            <li><a href="/testing/">测试指南</a></li>
          </ul>
        </div>
        <div class="doc-card">
          <h3>🔧 故障排除</h3>
          <p>解决常见问题</p>
          <ul>
            <li><a href="/faq">常见问题</a></li>
            <li><a href="/troubleshooting/installation">安装问题</a></li>
            <li><a href="/troubleshooting/configuration">配置问题</a></li>
            <li><a href="/troubleshooting/performance">性能优化</a></li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 相关链接 -->
    <section class="section">
      <h2>🔗 相关链接</h2>
      <div class="link-grid">
        <div class="link-card">
          <h4>📦 资源</h4>
          <ul>
            <li><a href="https://github.com/Agions/taskflow-ai" target="_blank">GitHub 仓库</a></li>
            <li><a href="https://www.npmjs.com/package/taskflow-ai" target="_blank">NPM 包</a></li>
            <li><a href="/changelog">更新日志</a></li>
            <li><a href="/security">安全策略</a></li>
          </ul>
        </div>
        <div class="link-card">
          <h4>💬 社区</h4>
          <ul>
            <li><a href="https://github.com/Agions/taskflow-ai/issues" target="_blank">问题反馈</a></li>
            <li><a href="https://github.com/Agions/taskflow-ai/discussions" target="_blank">讨论区</a></li>
            <li><a href="/development/contributing">贡献指南</a></li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 统计数据 -->
    <section class="section stats">
      <div class="stat-item">
        <span class="stat-number">254+</span>
        <span class="stat-label">TypeScript 文件</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">106</span>
        <span class="stat-label">测试用例</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">813KB</span>
        <span class="stat-label">构建大小</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">MIT</span>
        <span class="stat-label">开源协议</span>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref('npm')

const copyCode = async () => {
  const code = activeTab.value === 'npm' 
    ? 'npm install -g taskflow-ai'
    : `git clone https://github.com/Agions/taskflow-ai.git
cd taskflow-ai
npm install && npm run build`
  
  await navigator.clipboard.writeText(code)
}
</script>

<style scoped>
.home-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.section {
  margin: 3rem 0;
}

.section h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--tf-primary);
}

/* 代码组 */
.code-group {
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--vp-c-divider);
  padding: 0 1rem;
  gap: 0.5rem;
}

.tabs button {
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tabs button.active {
  color: var(--tf-primary);
  border-bottom-color: var(--tf-primary);
}

.code-block {
  position: relative;
  padding: 1rem 1.5rem;
}

.code-block pre {
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
}

.copy-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem 0.75rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.copy-btn:hover {
  border-color: var(--tf-primary);
  color: var(--tf-primary);
}

/* 功能网格 */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.feature-item {
  padding: 1.25rem;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
}

.feature-item h4 {
  margin: 0 0 0.75rem 0;
  color: var(--tf-primary);
}

.feature-item code {
  display: block;
  padding: 0.75rem;
  background: var(--vp-c-bg);
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  overflow-x: auto;
}

.feature-item p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

/* 文档网格 */
.doc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.doc-card {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  transition: all 0.3s;
}

.doc-card:hover {
  border-color: var(--tf-primary);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.1);
}

.doc-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.doc-card p {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.doc-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.doc-card li {
  padding: 0.35rem 0;
}

.doc-card a {
  color: var(--tf-primary);
  text-decoration: none;
}

.doc-card a:hover {
  text-decoration: underline;
}

/* 链接网格 */
.link-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.link-card {
  padding: 1.25rem;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
}

.link-card h4 {
  margin: 0 0 0.75rem 0;
  color: var(--tf-primary);
}

.link-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.link-card li {
  padding: 0.35rem 0;
}

.link-card a {
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.link-card a:hover {
  color: var(--tf-primary);
}

/* 统计数据 */
.stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  padding: 2rem;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  background: var(--tf-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

@media (max-width: 768px) {
  .doc-grid,
  .feature-grid {
    grid-template-columns: 1fr;
  }
  
  .stats {
    flex-wrap: wrap;
    gap: 1.5rem;
  }
  
  .stat-item {
    flex: 1 1 40%;
  }
}
</style>
