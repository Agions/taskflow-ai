# 贡献指南

感谢您对TaskFlow AI项目的关注！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 Bug报告和修复
- 💡 新功能建议和实现
- 📖 文档改进
- 🧪 测试用例添加
- 🎨 UI/UX改进
- 🌐 国际化支持

## 🚀 快速开始

### 开发环境准备

1. **系统要求**
   - Node.js 18.0.0 或更高版本
   - Git 2.0 或更高版本
   - 推荐使用 VSCode 或 Cursor 编辑器

2. **克隆项目**

   ```bash
   git clone https://github.com/agions/taskflow-ai.git
   cd taskflow-ai
   ```

3. **安装依赖**

   ```bash
   npm install
   ```

4. **构建项目**

   ```bash
   npm run build
   ```

5. **运行测试**

   ```bash
   npm test
   ```

6. **启动开发模式**
   ```bash
   npm run dev
   ```

### 项目结构

```
taskflow-ai/
├── src/                    # 源代码
│   ├── core/              # 核心模块
│   ├── models/            # AI模型集成
│   ├── parsers/           # PRD解析器
│   ├── planners/          # 任务规划器
│   ├── utils/             # 工具函数
│   └── types/             # TypeScript类型定义
├── tests/                 # 测试文件
├── docs/                  # 文档
├── examples/              # 示例代码
├── templates/             # 项目模板
└── bin/                   # 命令行工具
```

## 📋 贡献流程

### 1. 创建Issue

在开始开发之前，请先创建一个Issue来描述您要解决的问题或添加的功能：

- 🐛 **Bug报告**: 使用 [Bug报告模板](https://github.com/agions/taskflow-ai/issues/new?template=bug_report.md)
- 💡 **功能请求**: 使用 [功能请求模板](https://github.com/agions/taskflow-ai/issues/new?template=feature_request.md)
- 📖 **文档改进**: 使用 [文档改进模板](https://github.com/agions/taskflow-ai/issues/new?template=documentation.md)

### 2. Fork和分支

```bash
# 1. Fork项目到您的GitHub账户
# 2. 克隆您的Fork
git clone https://github.com/YOUR_USERNAME/taskflow-ai.git
cd taskflow-ai

# 3. 添加上游仓库
git remote add upstream https://github.com/agions/taskflow-ai.git

# 4. 创建功能分支
git checkout -b feature/your-feature-name
# 或者修复分支
git checkout -b fix/your-bug-fix
```

### 3. 开发和测试

```bash
# 开发过程中保持代码同步
git fetch upstream
git rebase upstream/main

# 运行测试确保代码质量
npm test
npm run lint
npm run type-check

# 构建项目
npm run build
```

### 4. 提交代码

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
# 提交格式
git commit -m "type(scope): description"

# 示例
git commit -m "feat(parser): add JSON format support"
git commit -m "fix(cli): resolve config loading issue"
git commit -m "docs(readme): update installation guide"
```

**提交类型**:

- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 5. 创建Pull Request

```bash
# 推送到您的Fork
git push origin feature/your-feature-name

# 在GitHub上创建Pull Request
```

**PR要求**:

- 清晰的标题和描述
- 关联相关的Issue
- 包含测试用例
- 通过所有CI检查
- 代码审查通过

## 🧪 测试指南

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- --testPathPattern=parser

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

### 编写测试

我们使用Jest作为测试框架：

```javascript
// tests/parser.test.ts
import { PRDParser } from '../src/parsers/PRDParser';

describe('PRDParser', () => {
  let parser: PRDParser;

  beforeEach(() => {
    parser = new PRDParser();
  });

  test('should parse markdown PRD correctly', async () => {
    const content = `
# 项目标题
## 功能需求
- 功能1
- 功能2
    `;

    const result = await parser.parse(content, 'markdown');

    expect(result.success).toBe(true);
    expect(result.data.title).toBe('项目标题');
    expect(result.data.features).toHaveLength(2);
  });
});
```

## 📝 代码规范

### TypeScript规范

```typescript
// 使用明确的类型定义
interface TaskData {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
}

// 使用枚举定义常量
enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

// 使用泛型提高代码复用性
class ServiceResponse<T> {
  constructor(
    public success: boolean,
    public data?: T,
    public error?: string
  ) {}
}
```

### 代码风格

我们使用ESLint和Prettier来保持代码风格一致：

```bash
# 检查代码风格
npm run lint

# 自动修复代码风格问题
npm run lint:fix

# 格式化代码
npm run format
```

### 命名规范

- **文件名**: 使用PascalCase (如: `PRDParser.ts`)
- **类名**: 使用PascalCase (如: `TaskFlowService`)
- **方法名**: 使用camelCase (如: `parsePRD`)
- **常量**: 使用UPPER_SNAKE_CASE (如: `DEFAULT_CONFIG`)
- **接口**: 使用PascalCase，可选择I前缀 (如: `ITaskData` 或 `TaskData`)

## 📖 文档贡献

### 文档类型

1. **API文档**: 在代码中使用JSDoc注释
2. **用户文档**: Markdown格式，位于`docs/`目录
3. **示例代码**: 位于`examples/`目录
4. **README**: 项目主要说明文档

### 文档规范

````typescript
/**
 * 解析PRD文档内容
 * @param content - PRD文档内容
 * @param fileType - 文件类型 (markdown, json, text)
 * @param options - 解析选项
 * @returns 解析结果
 * @example
 * ```typescript
 * const result = await service.parsePRD(content, 'markdown');
 * if (result.success) {
 *   console.log(result.data);
 * }
 * ```
 */
async parsePRD(
  content: string,
  fileType: FileType = FileType.MARKDOWN,
  options?: ParseOptions
): Promise<ServiceResponse<PRDParseResult>>
````

## 🐛 Bug报告

### 报告Bug前的检查

1. 搜索现有Issues，确认问题未被报告
2. 确保使用的是最新版本
3. 查看[故障排除文档](docs/troubleshooting.md)

### Bug报告模板

```markdown
**Bug描述**
简洁清晰地描述bug是什么。

**重现步骤**

1. 执行 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

**期望行为**
清晰简洁地描述您期望发生什么。

**实际行为**
清晰简洁地描述实际发生了什么。

**环境信息**

- OS: [例如 macOS 12.0]
- Node.js版本: [例如 18.0.0]
- TaskFlow AI版本: [例如 1.0.0]

**附加信息**
添加任何其他有关问题的上下文信息。
```

## 💡 功能建议

### 建议新功能前的考虑

1. 功能是否符合项目目标
2. 是否有足够的用户需求
3. 实现复杂度和维护成本
4. 是否与现有功能冲突

### 功能请求模板

```markdown
**功能描述**
清晰简洁地描述您想要的功能。

**问题背景**
描述这个功能要解决什么问题。

**解决方案**
描述您希望如何实现这个功能。

**替代方案**
描述您考虑过的其他解决方案。

**附加信息**
添加任何其他相关信息或截图。
```

## 🏆 贡献者认可

我们重视每一个贡献，所有贡献者都会被记录在：

- [贡献者列表](https://github.com/agions/taskflow-ai/graphs/contributors)
- [CHANGELOG.md](CHANGELOG.md)
- 项目README.md

### 贡献类型

- 🐛 **Bug修复**: 修复项目中的bug
- ✨ **新功能**: 添加新的功能特性
- 📖 **文档**: 改进项目文档
- 🧪 **测试**: 添加或改进测试用例
- 🎨 **设计**: UI/UX改进
- 🌐 **国际化**: 多语言支持
- 🔧 **工具**: 改进开发工具和流程

## 📞 获取帮助

如果您在贡献过程中遇到问题，可以通过以下方式获取帮助：

- 💬 [GitHub Discussions](https://github.com/Agions/taskflow-ai/issues)
- 🐛 [创建Issue](https://github.com/agions/taskflow-ai/issues/new)

## 📄 许可证

通过贡献代码，您同意您的贡献将在[MIT许可证](LICENSE)下授权。

---

再次感谢您的贡献！每一个贡献都让TaskFlow AI变得更好。🚀
