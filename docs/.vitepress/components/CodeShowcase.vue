<template>
  <div class="code-showcase" ref="container">
    <div class="showcase-tabs">
      <button
        v-for="(tab, index) in tabs"
        :key="index"
        :class="['tab-btn', { active: activeTab === index }]"
        @click="activeTab = index"
        :style="{ animationDelay: `${index * 100}ms` }"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-text">{{ tab.title }}</span>
      </button>
    </div>
    
    <div class="code-window" :style="windowStyle">
      <div class="window-header">
        <div class="window-dots">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <span class="window-title">{{ currentTab.title }}</span>
        <button class="copy-btn" @click="copyCode" :class="{ copied }">
          <span v-if="!copied">📋</span>
          <span v-else>✅</span>
        </button>
      </div>
      
      <div class="code-content">
        <pre class="code-block"><code ref="codeBlock" class="language-typescript">{{ currentTab.code }}</code></pre>
        <div class="code-highlight" :style="highlightStyle"></div>
      </div>
      
      <div class="typing-indicator" v-if="isTyping">
        <span></span><span></span><span></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const tabs = [
  {
    icon: '🧠',
    title: '智能路由',
    code: `import { TaskFlow } from 'taskflow-ai'

const flow = new TaskFlow({
  routing: 'smart',
  models: ['deepseek', 'openai', 'anthropic']
})

const result = await flow.execute({
  task: '分析用户行为数据',
  context: { data: userMetrics }
})`
  },
  {
    icon: '⚡',
    title: '工作流编排',
    code: `const workflow = {
  nodes: [
    { id: 'parse', type: 'task', tool: 'prd-parser' },
    { id: 'generate', type: 'parallel', branches: [
      { tool: 'code-gen', model: 'gpt-4' },
      { tool: 'test-gen', model: 'claude' }
    ]},
    { id: 'review', type: 'agent-task', agent: 'reviewer' }
  ]
}

await flow.run(workflow)`
  },
  {
    icon: '🔌',
    title: 'MCP 集成',
    code: `import { MCPServer } from 'taskflow-ai/mcp'

const server = new MCPServer({
  name: 'taskflow-ai',
  tools: [
    'think', 'route', 'flow-run',
    'agent-run', 'code-review'
  ]
})

server.listen(8080)`
  }
]

const activeTab = ref(0)
const copied = ref(false)
const isTyping = ref(false)
const codeBlock = ref(null)

const currentTab = computed(() => tabs[activeTab.value])

const windowStyle = computed(() => ({
  '--tab-color': activeTab.value === 0 ? '#3b82f6' : activeTab.value === 1 ? '#8b5cf6' : '#10b981'
}))

const highlightStyle = computed(() => ({
  background: `linear-gradient(180deg, ${windowStyle.value['--tab-color']}20 0%, transparent 100%)`
}))

const copyCode = async () => {
  await navigator.clipboard.writeText(currentTab.value.code)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

watch(activeTab, () => {
  isTyping.value = true
  setTimeout(() => isTyping.value = false, 500)
})
</script>

<style scoped>
.code-showcase {
  margin: 2rem 0;
}

.showcase-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0;
  padding: 0 1rem;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  transition: all 0.3s ease;
  animation: fadeInDown 0.5s ease-out backwards;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tab-btn:hover {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.tab-btn.active {
  background: var(--vp-c-bg);
  color: var(--tf-primary);
  border-color: var(--vp-c-divider);
  border-bottom-color: var(--vp-c-bg);
  position: relative;
  z-index: 2;
}

.tab-icon {
  font-size: 1.1rem;
}

.code-window {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 0 12px 12px 12px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 8px 32px -8px rgba(0, 0, 0, 0.15);
}

.window-header {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.window-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.dot.red { background: #ff5f56; }
.dot.yellow { background: #ffbd2e; }
.dot.green { background: #27c93f; }

.window-title {
  flex: 1;
  text-align: center;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  font-weight: 500;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  transition: all 0.2s;
  font-size: 1rem;
}

.copy-btn:hover {
  background: var(--vp-c-bg);
}

.copy-btn.copied {
  animation: pulse 0.5s ease;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.code-content {
  position: relative;
  overflow: hidden;
}

.code-block {
  margin: 0;
  padding: 1.5rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9rem;
  line-height: 1.7;
  overflow-x: auto;
  color: var(--vp-c-text-1);
  background: transparent;
}

.code-highlight {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100px;
  pointer-events: none;
  opacity: 0.5;
  transition: opacity 0.3s;
}

.typing-indicator {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--tf-primary);
  animation: typingBounce 1.4s ease-in-out infinite;
}

.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
}
</style>