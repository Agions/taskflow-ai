# TaskFlow AI 测试指南

## 📋 概述

本文档提供了TaskFlow AI项目的完整测试指南，包括单元测试、集成测试、端到端测试和性能测试的最佳实践。

## 🧪 测试框架

### 核心测试工具

- **Jest**: 单元测试和集成测试框架
- **TypeScript**: 类型安全的测试代码
- **Supertest**: API测试
- **Mock**: 模拟外部依赖

### 测试结构

```
tests/
├── unit/                 # 单元测试
│   ├── core/            # 核心模块测试
│   ├── commands/        # CLI命令测试
│   └── utils/           # 工具函数测试
├── integration/         # 集成测试
│   ├── api/            # API集成测试
│   ├── models/         # AI模型集成测试
│   └── workflows/      # 工作流测试
├── e2e/                # 端到端测试
│   ├── cli/            # CLI端到端测试
│   └── scenarios/      # 场景测试
├── performance/        # 性能测试
├── fixtures/           # 测试数据
└── helpers/            # 测试辅助工具
```

## 🔧 测试环境设置

### 1. 安装测试依赖

```bash
# 安装开发依赖
npm install --save-dev \
  jest \
  @types/jest \
  ts-jest \
  supertest \
  @types/supertest \
  jest-mock-extended

# 安装测试工具
npm install --save-dev \
  @jest/globals \
  jest-environment-node \
  jest-junit
```

### 2. Jest配置

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
};
```

### 3. 测试环境变量

```bash
# .env.test
NODE_ENV=test
LOG_LEVEL=error

# 测试用的API密钥（使用mock或测试账号）
DEEPSEEK_API_KEY=test_key
ZHIPU_API_KEY=test_key
QWEN_API_KEY=test_key

# 测试数据库
TEST_DB_PATH=./tests/fixtures/test.db
```

## 📝 单元测试

### 1. 测试命名规范

```typescript
// tests/unit/core/parser/prd-parser.test.ts
describe('PRDParser', () => {
  describe('parseDocument', () => {
    it('should parse markdown document successfully', () => {
      // 测试实现
    });

    it('should handle invalid document format', () => {
      // 测试实现
    });

    it('should throw error for empty document', () => {
      // 测试实现
    });
  });
});
```

### 2. 模拟外部依赖

```typescript
// tests/unit/core/models/deepseek.test.ts
import { DeepSeekProvider } from '../../../../src/core/models/providers/deepseek';
import { jest } from '@jest/globals';

// 模拟axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DeepSeekProvider', () => {
  let provider: DeepSeekProvider;

  beforeEach(() => {
    provider = new DeepSeekProvider({
      apiKey: 'test-key',
      baseURL: 'https://api.deepseek.com',
    });
  });

  it('should make successful API call', async () => {
    // 设置mock响应
    mockedAxios.post.mockResolvedValue({
      data: {
        choices: [
          {
            message: { content: 'Test response' },
          },
        ],
      },
    });

    const result = await provider.chat({
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result.content).toBe('Test response');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/chat/completions'),
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Hello' }],
      })
    );
  });
});
```

### 3. 测试数据管理

```typescript
// tests/fixtures/sample-data.ts
export const samplePRD = `
# 项目需求文档

## 功能需求
1. 用户登录功能
2. 数据展示功能
3. 报表生成功能

## 非功能需求
- 性能要求：响应时间 < 2秒
- 安全要求：数据加密传输
`;

export const expectedTasks = [
  {
    id: 'task-1',
    title: '实现用户登录功能',
    description: '开发用户认证和授权系统',
    priority: 'high',
    estimatedHours: 16,
  },
];
```

## 🔗 集成测试

### 1. API集成测试

```typescript
// tests/integration/api/command-handler.test.ts
import request from 'supertest';
import { app } from '../../../src/app';

describe('Command Handler API', () => {
  it('should parse PRD document', async () => {
    const response = await request(app)
      .post('/api/parse')
      .send({
        content: samplePRD,
        type: 'markdown',
      })
      .expect(200);

    expect(response.body).toHaveProperty('tasks');
    expect(response.body.tasks).toHaveLength(3);
  });
});
```

### 2. 模型集成测试

```typescript
// tests/integration/models/model-coordinator.test.ts
describe('ModelCoordinator Integration', () => {
  let coordinator: ModelCoordinator;

  beforeAll(async () => {
    coordinator = new ModelCoordinator();
    await coordinator.initialize();
  });

  it('should coordinate multiple models for complex task', async () => {
    const result = await coordinator.processRequest({
      type: 'complex_analysis',
      content: 'Analyze this complex requirement...',
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('analysis');
    expect(result.metadata.modelsUsed).toContain('deepseek');
  });
});
```

## 🎯 端到端测试

### 1. CLI端到端测试

```typescript
// tests/e2e/cli/parse-command.test.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';

const execAsync = promisify(exec);

describe('Parse Command E2E', () => {
  const testDir = './tests/temp';

  beforeEach(async () => {
    await fs.ensureDir(testDir);
    await fs.writeFile(`${testDir}/test-prd.md`, samplePRD);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should parse PRD and generate tasks', async () => {
    const { stdout } = await execAsync(
      `node dist/cli.js parse ${testDir}/test-prd.md --output ${testDir}/tasks.json`
    );

    expect(stdout).toContain('解析完成');

    const tasks = await fs.readJson(`${testDir}/tasks.json`);
    expect(tasks).toHaveProperty('tasks');
    expect(tasks.tasks.length).toBeGreaterThan(0);
  });
});
```

### 2. 工作流测试

```typescript
// tests/e2e/scenarios/full-workflow.test.ts
describe('Full Workflow E2E', () => {
  it('should complete full PRD to task workflow', async () => {
    // 1. 初始化项目
    await execAsync('taskflow init --force');

    // 2. 解析PRD
    await execAsync('taskflow parse docs/sample-prd.md');

    // 3. 生成可视化
    await execAsync('taskflow visualize --format svg');

    // 4. 验证输出
    expect(await fs.pathExists('taskflow/tasks.json')).toBe(true);
    expect(await fs.pathExists('taskflow/gantt.svg')).toBe(true);
  });
});
```

## ⚡ 性能测试

### 1. 基准测试

```typescript
// tests/performance/parsing-benchmark.test.ts
describe('Parsing Performance', () => {
  it('should parse large PRD within time limit', async () => {
    const largePRD = generateLargePRD(10000); // 10k lines

    const startTime = Date.now();
    const result = await prdParser.parse(largePRD);
    const endTime = Date.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(5000); // 5秒内完成
    expect(result.tasks.length).toBeGreaterThan(0);
  });
});
```

### 2. 内存使用测试

```typescript
// tests/performance/memory-usage.test.ts
describe('Memory Usage', () => {
  it('should not exceed memory limit during processing', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // 处理大量数据
    for (let i = 0; i < 100; i++) {
      await prdParser.parse(samplePRD);
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // 内存增长不应超过100MB
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
  });
});
```

## 📊 测试覆盖率

### 1. 覆盖率目标

- **语句覆盖率**: >= 80%
- **分支覆盖率**: >= 75%
- **函数覆盖率**: >= 85%
- **行覆盖率**: >= 80%

### 2. 覆盖率报告

```bash
# 生成覆盖率报告
npm run test:coverage

# 查看HTML报告
open coverage/lcov-report/index.html

# CI中的覆盖率检查
npm run test:coverage -- --coverageThreshold='{"global":{"statements":80,"branches":75,"functions":85,"lines":80}}'
```

## 🚀 测试执行

### 1. 本地测试

```bash
# 运行所有测试
npm test

# 运行特定类型的测试
npm run test:unit
npm run test:integration
npm run test:e2e

# 监听模式
npm run test:watch

# 调试模式
npm run test:debug
```

### 2. CI/CD测试

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18, 20]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 🔍 测试最佳实践

### 1. 测试原则

- **独立性**: 每个测试应该独立运行
- **可重复性**: 测试结果应该一致
- **快速性**: 单元测试应该快速执行
- **清晰性**: 测试意图应该明确

### 2. 测试技巧

```typescript
// 使用describe.each进行参数化测试
describe.each([
  ['markdown', sampleMarkdown],
  ['html', sampleHTML],
  ['text', sampleText],
])('parseDocument with %s format', (format, content) => {
  it('should parse successfully', () => {
    const result = parser.parse(content, format);
    expect(result).toBeDefined();
  });
});

// 使用beforeEach和afterEach进行清理
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(async () => {
  await cleanup();
});
```

## 📚 相关文档

- [开发指南](../guide/developer-guide.md)
- [API文档](../api/)
- [部署指南](../deployment/index.md)
- [故障排除](../troubleshooting/common-issues.md)
