# 贡献指南

## 🤝 欢迎贡献

感谢您对TaskFlow AI项目的关注！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 报告Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- 🎨 UI/UX改进
- 🌐 多语言支持
- 📊 性能优化

## 🚀 快速开始

### 环境准备

确保您的开发环境满足以下要求：

```bash
# Node.js 版本要求
node --version  # >= 18.0.0

# 包管理器
npm --version   # >= 8.0.0
# 或
yarn --version  # >= 1.22.0
```

### 项目设置

1. **Fork 项目**
   ```bash
   # 在GitHub上Fork项目到您的账户
   # 然后克隆到本地
   git clone https://github.com/YOUR_USERNAME/taskflow-ai.git
   cd taskflow-ai
   ```

2. **安装依赖**
   ```bash
   # 安装项目依赖
   npm install
   
   # 安装文档依赖
   cd docs
   npm install
   cd ..
   ```

3. **配置开发环境**
   ```bash
   # 复制环境配置模板
   cp .env.example .env
   
   # 编辑配置文件，添加必要的API密钥
   vim .env
   ```

4. **运行开发服务器**
   ```bash
   # 启动主项目开发服务器
   npm run dev
   
   # 启动文档开发服务器（新终端）
   cd docs
   npm run dev
   ```

## 📋 开发流程

### 1. 创建功能分支

```bash
# 从main分支创建新的功能分支
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# 或者修复bug
git checkout -b fix/bug-description
```

### 2. 开发规范

#### 代码风格

我们使用严格的代码质量标准：

```bash
# 代码格式化
npm run format

# 代码检查
npm run lint

# 类型检查
npm run type-check

# 运行所有检查
npm run check-all
```

#### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
# 功能添加
git commit -m "feat: 添加多模型智能选择功能"

# Bug修复
git commit -m "fix: 修复PRD解析中的编码问题"

# 文档更新
git commit -m "docs: 更新API使用示例"

# 性能优化
git commit -m "perf: 优化任务查询性能"

# 重构
git commit -m "refactor: 重构配置管理模块"

# 测试
git commit -m "test: 添加任务管理器单元测试"

# 构建相关
git commit -m "build: 更新依赖版本"

# CI/CD
git commit -m "ci: 优化GitHub Actions工作流"
```

#### TypeScript 规范

```typescript
// ✅ 好的例子
interface TaskConfig {
  readonly id: string
  name: string
  priority: TaskPriority
  estimatedHours?: number
}

// 使用严格类型，避免any
function processTask(config: TaskConfig): Promise<ProcessResult> {
  // 实现逻辑
}

// ❌ 避免的写法
function processTask(config: any): any {
  // 避免使用any类型
}
```

### 3. 测试要求

#### 单元测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- task-manager.test.ts

# 运行测试并生成覆盖率报告
npm run test:coverage
```

#### 测试编写规范

```typescript
// 测试文件示例: src/__tests__/task-manager.test.ts
import { TaskManager, TaskStatus } from '../task-manager'

describe('TaskManager', () => {
  let taskManager: TaskManager
  
  beforeEach(() => {
    taskManager = new TaskManager()
  })
  
  describe('createTask', () => {
    it('should create a task with valid data', async () => {
      const taskData = {
        name: '测试任务',
        description: '这是一个测试任务',
        priority: 'high' as const
      }
      
      const task = await taskManager.createTask(taskData)
      
      expect(task.id).toBeDefined()
      expect(task.name).toBe(taskData.name)
      expect(task.status).toBe(TaskStatus.NOT_STARTED)
    })
    
    it('should throw error with invalid data', async () => {
      await expect(
        taskManager.createTask({ name: '' })
      ).rejects.toThrow('任务名称不能为空')
    })
  })
})
```

### 4. 文档贡献

#### 文档结构

```
docs/
├── guide/           # 使用指南
├── user-guide/      # 用户手册
├── api/             # API文档
├── reference/       # 参考文档
├── troubleshooting/ # 故障排除
└── examples/        # 示例代码
```

#### 文档编写规范

```markdown
# 标题使用H1，每个文档只有一个H1

## 主要章节使用H2

### 子章节使用H3

#### 详细说明使用H4

**重要内容使用粗体**

`代码片段使用反引号`

```typescript
// 代码块指定语言
interface Example {
  property: string
}
```

> 提示信息使用引用块

⚠️ **注意**: 重要提醒使用emoji和粗体
```

## 🔍 代码审查

### Pull Request 流程

1. **创建PR**
   ```bash
   # 推送分支到您的fork
   git push origin feature/your-feature-name
   
   # 在GitHub上创建Pull Request
   # 选择 base: main <- compare: feature/your-feature-name
   ```

2. **PR描述模板**
   ```markdown
   ## 变更描述
   简要描述本次变更的内容和目的。
   
   ## 变更类型
   - [ ] Bug修复
   - [ ] 新功能
   - [ ] 文档更新
   - [ ] 性能优化
   - [ ] 重构
   - [ ] 其他: ___________
   
   ## 测试
   - [ ] 已添加单元测试
   - [ ] 已添加集成测试
   - [ ] 手动测试通过
   - [ ] 文档已更新
   
   ## 检查清单
   - [ ] 代码遵循项目规范
   - [ ] 提交信息符合规范
   - [ ] 没有TypeScript错误
   - [ ] 没有ESLint错误
   - [ ] 测试覆盖率满足要求
   
   ## 相关Issue
   Closes #123
   ```

3. **代码审查标准**
   - 代码质量和可读性
   - 测试覆盖率
   - 文档完整性
   - 性能影响
   - 安全考虑

## 🐛 Bug报告

### 报告模板

使用以下模板报告Bug：

```markdown
## Bug描述
清晰简洁地描述遇到的问题。

## 复现步骤
1. 执行命令 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

## 期望行为
描述您期望发生的行为。

## 实际行为
描述实际发生的行为。

## 环境信息
- OS: [e.g. macOS 12.0]
- Node.js版本: [e.g. 18.17.0]
- TaskFlow AI版本: [e.g. 1.2.0]
- 浏览器: [e.g. Chrome 91.0]

## 附加信息
添加任何其他有助于解决问题的信息，如截图、日志等。
```

## 💡 功能建议

### 建议模板

```markdown
## 功能描述
清晰简洁地描述建议的功能。

## 问题背景
描述这个功能要解决的问题或改进的场景。

## 解决方案
描述您希望的解决方案。

## 替代方案
描述您考虑过的其他替代方案。

## 附加信息
添加任何其他相关信息或截图。
```

## 🏆 贡献者认可

### 贡献类型

我们认可以下类型的贡献：

- 💻 **代码贡献**: 功能开发、Bug修复
- 📖 **文档贡献**: 文档编写、翻译
- 🎨 **设计贡献**: UI/UX设计、图标设计
- 🐛 **测试贡献**: 测试用例、Bug报告
- 💡 **想法贡献**: 功能建议、架构建议
- 🌐 **翻译贡献**: 多语言支持
- 📢 **推广贡献**: 社区推广、教程制作

### 贡献者权益

- 在项目README中列出贡献者
- 获得项目贡献者徽章
- 参与项目重要决策讨论
- 优先获得新功能预览
- 技术交流和学习机会

## 📞 获取帮助

如果您在贡献过程中遇到问题：

1. **查看文档**: [完整文档](https://agions.github.io/taskflow-ai/)
2. **搜索Issue**: [GitHub Issues](https://github.com/agions/taskflow-ai/issues)
3. **参与讨论**: [GitHub Discussions](https://github.com/agions/taskflow-ai/discussions)
4. **联系维护者**: 在相关Issue中@维护者

## 📜 行为准则

我们致力于为所有人提供友好、安全和欢迎的环境。请遵循以下准则：

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

## 📄 许可证

通过贡献代码，您同意您的贡献将在与项目相同的许可证下授权。

---

**感谢您的贡献！** 🎉

每一个贡献都让TaskFlow AI变得更好，我们期待与您一起构建更优秀的PRD解析和任务管理工具。
