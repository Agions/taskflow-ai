<template>
  <div class="home-content">
    <!-- 粒子背景 -->
    <ParticleBackground class="hero-particles" />

    <!-- Hero 区域增强 -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-pulse"></span>
          <span class="badge-text">🎉 v4.0 架构升级完成</span>
        </div>
        <h1 class="hero-title">
          从任务执行<br/>
          升级为<span class="gradient-text">思维编排</span>
        </h1>
        <p class="hero-subtitle">
          专为开发团队打造的下一代 AI 开发工具
        </p>
        <div class="hero-typing">
          支持 <TypingEffect :texts="['智能路由', '自主执行', '思维链分析', '多模型协同']" />
        </div>
        <div class="hero-actions">
          <a href="/guide/getting-started" class="btn btn-primary">
            <span class="btn-icon">🚀</span>
            快速开始
            <span class="btn-arrow">→</span>
          </a>
          <a href="https://github.com/Agions/taskflow-ai" target="_blank" class="btn btn-secondary">
            <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </section>

    <!-- 代码展示 -->
    <section class="section code-section">
      <div class="section-header">
        <span class="section-tag">⚡ 极简 API</span>
        <h2>几行代码，<span class="gradient-text">无限可能</span></h2>
      </div>
      <CodeShowcase />
    </section>

    <!-- 核心特性 - 浮动卡片 -->
    <section class="section features-section">
      <div class="section-header">
        <span class="section-tag">🎯 核心特性</span>
        <h2>为开发者<span class="gradient-text">精心设计</span></h2>
      </div>
      <div class="features-grid">
        <FloatingCard
          v-for="(feature, index) in features"
          :key="feature.title"
          :icon="feature.icon"
          :title="feature.title"
          :description="feature.description"
          :delay="index * 150"
          class="feature-card"
        />
      </div>
    </section>

    <!-- 统计数据 - 数字滚动 -->
    <section class="section stats-section">
      <div class="stats-grid">
        <div class="stat-item" v-for="stat in stats" :key="stat.label">
          <StatCounter :target="stat.value" :suffix="stat.suffix" />
          <span class="stat-label">{{ stat.label }}</span>
          <div class="stat-bar" :style="{ width: stat.percentage + '%' }"></div>
        </div>
      </div>
    </section>

    <!-- 架构亮点 -->
    <section class="section architecture-section">
      <div class="section-header">
        <span class="section-tag">🏗️ 架构亮点</span>
        <h2>v4.0 <span class="gradient-text">全面升级</span></h2>
      </div>
      <div class="arch-grid">
        <div class="arch-card" v-for="(item, index) in architecture" :key="item.title" :style="{ animationDelay: `${index * 100}ms` }">
          <div class="arch-icon">{{ item.icon }}</div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
          <div class="arch-tags">
            <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 文档导航 -->
    <section class="section docs-section">
      <div class="section-header">
        <span class="section-tag">📚 文档导航</span>
        <h2>开始<span class="gradient-text">探索</span></h2>
      </div>
      <div class="docs-grid">
        <div class="doc-category" v-for="category in docCategories" :key="category.title">
          <div class="doc-category-header">
            <span class="doc-category-icon">{{ category.icon }}</span>
            <h3>{{ category.title }}</h3>
          </div>
          <ul class="doc-links">
            <li v-for="link in category.links" :key="link.text">
              <a :href="link.href" class="doc-link">
                <span class="link-arrow">→</span>
                {{ link.text }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section cta-section">
      <div class="cta-card">
        <div class="cta-glow"></div>
        <h2>准备好开始了吗？</h2>
        <p>加入数千名开发者，体验下一代 AI 开发工具</p>
        <div class="cta-actions">
          <a href="/guide/getting-started" class="btn btn-primary btn-lg">
            🚀 立即开始
          </a>
          <a href="/DEVELOPER_GUIDE" class="btn btn-outline btn-lg">
            📖 开发者指南
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ParticleBackground from './ParticleBackground.vue'
import TypingEffect from './TypingEffect.vue'
import StatCounter from './StatCounter.vue'
import FloatingCard from './FloatingCard.vue'
import CodeShowcase from './CodeShowcase.vue'

const features = [
  {
    icon: '🧠',
    title: '思维链可视化',
    description: '展示 AI 推理的每一步，支持 Mermaid 流程图、思维导图等多种渲染格式，AI 自我审视优化结果'
  },
  {
    icon: '🤖',
    title: '多模型智能路由',
    description: '统一管理 DeepSeek、OpenAI、Anthropic 等多模型，smart/cost/speed 路由策略，级联降级，成本估算'
  },
  {
    icon: '⚡',
    title: '工作流引擎',
    description: 'YAML/JSON 声明式工作流，顺序/并行/条件分支/循环执行，SQLite 状态持久化，完整错误处理'
  },
  {
    icon: '🧩',
    title: '插件系统',
    description: '动态加载/卸载插件，钩子系统 (onInit, onTaskCreate 等)，内置 PRD/工作流/任务模板'
  },
  {
    icon: '🤝',
    title: '多 Agent 协作',
    description: '自主目标执行，AI 反思机制，多 Agent 消息传递和任务分发，短期/长期记忆系统'
  },
  {
    icon: '🔌',
    title: 'MCP 集成',
    description: '支持 Cursor、Windsurf、Trae、Claude Desktop，动态工具注册，企业级安全策略'
  }
]

const stats = [
  { value: 314, suffix: '', label: 'TypeScript 文件', percentage: 100 },
  { value: 93, suffix: '%', label: '测试覆盖率', percentage: 93 },
  { value: 3, suffix: '%', label: '代码重复率', percentage: 3 },
  { value: 36, suffix: '', label: '测试文件', percentage: 80 }
]

const architecture = [
  {
    icon: '📦',
    title: '统一类型系统',
    description: '消除 3 套重复 Agent 类型定义，统一 10 个类型文件',
    tags: ['TypeScript', 'Strict Mode']
  },
  {
    icon: '🧩',
    title: '扩展系统',
    description: '支持 4 种扩展类型：插件、Agent、工具、工作流',
    tags: ['Plugin', 'Registry']
  },
  {
    icon: '🛠️',
    title: '内置工具',
    description: '14 个开箱即用的工具，覆盖文件、Shell、HTTP、Git',
    tags: ['FileSystem', 'Network']
  },
  {
    icon: '🔄',
    title: '工作流节点',
    description: '8 种内置节点类型，支持自定义节点工厂',
    tags: ['Parallel', 'Condition']
  }
]

const docCategories = [
  {
    icon: '🚀',
    title: '入门指南',
    links: [
      { text: '安装指南', href: '/guide/installation' },
      { text: '快速开始', href: '/guide/getting-started' },
      { text: '基础使用', href: '/guide/basic-usage' },
      { text: '项目需求', href: '/guide/project-requirements' }
    ]
  },
  {
    icon: '📖',
    title: '用户手册',
    links: [
      { text: '高级特性', href: '/guide/advanced-features' },
      { text: '工作流指南', href: '/user-guide/workflows' },
      { text: '最佳实践', href: '/user-guide/best-practices' },
      { text: '使用示例', href: '/guide/examples' }
    ]
  },
  {
    icon: '🔌',
    title: '编辑器集成',
    links: [
      { text: 'MCP 配置指南', href: '/guide/mcp-setup' },
      { text: 'Cursor 集成', href: '/editor-config/cursor' },
      { text: 'Windsurf/Trae', href: '/editor-config/windsurf-trae-integration' },
      { text: '编辑器概览', href: '/editor-config/overview' }
    ]
  },
  {
    icon: '🛠️',
    title: 'API 参考',
    links: [
      { text: '完整 API 文档', href: '/API_REFERENCE' },
      { text: '开发者指南', href: '/DEVELOPER_GUIDE' },
      { text: 'CLI 命令', href: '/reference/cli' },
      { text: '配置选项', href: '/reference/configuration' }
    ]
  }
]
</script>

<style scoped>
.home-content {
  position: relative;
  overflow: hidden;
}

/* Hero Section */
.hero-section {
  position: relative;
  padding: 4rem 2rem 6rem;
  text-align: center;
  overflow: hidden;
}

.hero-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 9999px;
  margin-bottom: 2rem;
  font-size: 0.875rem;
  position: relative;
  overflow: hidden;
}

.badge-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--tf-success);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.2;
  margin: 0 0 1.5rem;
  color: var(--vp-c-text-1);
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--vp-c-text-2);
  margin: 0 0 1rem;
}

.hero-typing {
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  margin-bottom: 2rem;
  min-height: 2rem;
}

.gradient-text {
  background: var(--tf-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: var(--tf-gradient);
  color: white;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.btn-secondary:hover {
  border-color: var(--tf-primary);
  color: var(--tf-primary);
}

.btn-outline {
  background: transparent;
  color: var(--vp-c-text-1);
  border: 2px solid var(--vp-c-divider);
}

.btn-outline:hover {
  border-color: var(--tf-primary);
  color: var(--tf-primary);
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

.btn-arrow {
  transition: transform 0.3s;
}

.btn:hover .btn-arrow {
  transform: translateX(4px);
}

.github-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Sections */
.section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-tag {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 9999px;
  font-size: 0.875rem;
  color: var(--tf-primary);
  margin-bottom: 1rem;
}

.section-header h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
}

/* Code Section */
.code-section {
  padding-top: 2rem;
}

/* Features */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 1.5rem;
}

/* Stats */
.stats-section {
  background: var(--vp-c-bg-soft);
  border-radius: 24px;
  margin: 2rem auto;
  padding: 3rem 2rem;
  border: 1px solid var(--vp-c-divider);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.stat-item {
  text-align: center;
  position: relative;
}

.stat-label {
  display: block;
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
  margin-top: 0.5rem;
}

.stat-bar {
  height: 3px;
  background: var(--tf-gradient);
  border-radius: 3px;
  margin: 1rem auto 0;
  max-width: 120px;
  transition: width 1.5s ease-out;
}

/* Architecture */
.arch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}

.arch-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  padding: 2rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.6s ease-out backwards;
}

.arch-card:hover {
  transform: translateY(-4px);
  border-color: var(--tf-primary);
  box-shadow: 0 12px 32px -8px rgba(59, 130, 246, 0.2);
}

.arch-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.arch-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.75rem;
}

.arch-card p {
  color: var(--vp-c-text-2);
  margin: 0 0 1rem;
  line-height: 1.6;
}

.arch-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  padding: 0.25rem 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  color: var(--tf-primary);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Docs */
.docs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}

.doc-category {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s;
}

.doc-category:hover {
  border-color: var(--tf-primary);
}

.doc-category-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.doc-category-icon {
  font-size: 1.5rem;
}

.doc-category h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.doc-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.doc-links li {
  margin: 0.5rem 0;
}

.doc-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--vp-c-text-2);
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.doc-link:hover {
  background: var(--vp-c-bg);
  color: var(--tf-primary);
}

.link-arrow {
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.2s;
}

.doc-link:hover .link-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* CTA */
.cta-section {
  padding: 2rem 2rem 6rem;
}

.cta-card {
  position: relative;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 24px;
  padding: 4rem 2rem;
  text-align: center;
  overflow: hidden;
}

.cta-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(59, 130, 246, 0.1) 0%,
    transparent 50%
  );
  pointer-events: none;
}

.cta-card h2 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 1rem;
  position: relative;
  z-index: 1;
}

.cta-card p {
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  margin: 0 0 2rem;
  position: relative;
  z-index: 1;
}

.cta-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.25rem;
  }

  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .btn {
    justify-content: center;
  }

  .section-header h2 {
    font-size: 1.75rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
