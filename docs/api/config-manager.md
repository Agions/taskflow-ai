# 配置管理 API

## 概述

配置管理器负责TaskFlow AI的系统配置管理，包括AI模型配置、用户设置、性能参数等。

## 🏗️ 核心接口

```typescript
interface ConfigManager {
  // 基本配置操作
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  unset(key: string): Promise<void>;
  has(key: string): Promise<boolean>;

  // 批量操作
  getAll(): Promise<Record<string, any>>;
  setMultiple(config: Record<string, any>): Promise<void>;

  // 配置验证
  validate(config?: Record<string, any>): Promise<ValidationResult>;

  // 环境管理
  setEnvironment(env: string): Promise<void>;
  getEnvironment(): Promise<string>;

  // 配置模板
  exportTemplate(excludeSecrets?: boolean): Promise<ConfigTemplate>;
  importTemplate(template: ConfigTemplate, merge?: boolean): Promise<void>;
}
```

## ⚙️ 基本操作

### get / set

获取和设置配置值。

```typescript
import { ConfigManager } from 'taskflow-ai';

const config = new ConfigManager();

// 设置AI模型配置
await config.set('models.deepseek.apiKey', 'your-api-key');
await config.set('models.deepseek.endpoint', 'https://api.deepseek.com');

// 获取配置值
const apiKey = await config.get('models.deepseek.apiKey');
const allModels = await config.get('models');

// 设置复杂配置
await config.set('multiModel', {
  enabled: true,
  primary: 'deepseek',
  fallback: ['zhipu', 'qwen'],
  loadBalancing: true,
});
```

### 批量操作

```typescript
// 批量设置配置
await config.setMultiple({
  'logging.level': 'debug',
  'performance.cacheSize': 100,
  'team.defaultAssignee': '张三',
});

// 获取所有配置
const allConfig = await config.getAll();
console.log('当前配置:', allConfig);
```

## 🔧 配置结构

### 标准配置键

```typescript
// AI模型配置
'models.deepseek.apiKey';
'models.deepseek.endpoint';
'models.zhipu.apiKey';
'models.qwen.apiKey';

// 多模型配置
'multiModel.enabled';
'multiModel.primary';
'multiModel.fallback';
'multiModel.loadBalancing';

// 项目配置
'project.name';
'project.type';
'project.workDir';

// 团队配置
'team.members';
'team.defaultAssignee';

// 性能配置
'performance.cacheSize';
'performance.timeout';
'performance.concurrency';

// 日志配置
'logging.level';
'logging.file';
'logging.maxSize';
```

## 🎯 使用示例

### 完整配置设置

```typescript
async function setupConfiguration() {
  const config = new ConfigManager();

  // AI模型配置
  await config.setMultiple({
    'models.deepseek.apiKey': process.env.DEEPSEEK_API_KEY,
    'models.zhipu.apiKey': process.env.ZHIPU_API_KEY,
    'multiModel.enabled': true,
    'multiModel.primary': 'deepseek',
    'multiModel.fallback': ['zhipu', 'qwen'],
  });

  // 项目配置
  await config.setMultiple({
    'project.name': 'My Project',
    'project.type': 'web-app',
    'team.members': ['张三', '李四', '王五'],
  });

  // 性能优化
  await config.setMultiple({
    'performance.cacheSize': 200,
    'performance.timeout': 30000,
    'logging.level': 'info',
  });

  // 验证配置
  const validation = await config.validate();
  if (!validation.isValid) {
    console.error('配置验证失败:', validation.errors);
  }
}
```

### 环境配置管理

```typescript
// 开发环境配置
await config.setEnvironment('development');
await config.setMultiple({
  'logging.level': 'debug',
  'performance.cacheSize': 50,
});

// 生产环境配置
await config.setEnvironment('production');
await config.setMultiple({
  'logging.level': 'error',
  'performance.cacheSize': 500,
});
```

## 🌐 MCP 配置管理

> **重要说明**: TaskFlow AI 遵循标准 MCP 协议，服务由编辑器自动启动和管理。ConfigManager 专注于配置文件的生成、验证和测试。

### generateMCPConfig(editor: EditorType): Promise&lt;MCPConfig&gt;

为指定编辑器生成MCP配置。

```typescript
const mcpConfig = await config.generateMCPConfig('cursor');
console.log('生成的MCP配置:', mcpConfig);
```

### validateMCPConfig(config: MCPConfig): Promise&lt;ValidationResult&gt;

验证MCP配置的有效性。

```typescript
const result = await config.validateMCPConfig(mcpConfig);
if (!result.valid) {
  console.error('MCP配置错误:', result.errors);
}
```

### exportMCPConfig(editor: EditorType): Promise&lt;string&gt;

导出MCP配置为JSON字符串。

```typescript
const configJson = await config.exportMCPConfig('windsurf');
```

### importMCPConfig(editor: EditorType, config: string): Promise&lt;void&gt;

导入MCP配置。

```typescript
await config.importMCPConfig('vscode', configJson);
```

### testMCPConfiguration(editor: EditorType): Promise&lt;TestResult&gt;

测试MCP配置的有效性。

```typescript
const result = await config.testMCPConfiguration('cursor');
if (result.valid) {
  console.log('配置有效');
} else {
  console.error('配置错误:', result.errors);
}
```

### getMCPCapabilities(): Promise&lt;MCPCapabilities&gt;

获取MCP服务支持的能力。

```typescript
const capabilities = await config.getMCPCapabilities();
console.log('支持的能力:', capabilities);
```

## 🎯 MCP 使用示例

### 完整MCP配置流程

```typescript
async function setupMCPIntegration() {
  const config = new ConfigManager();

  // 1. 生成所有编辑器的MCP配置
  const editors: EditorType[] = ['windsurf', 'trae', 'cursor', 'vscode'];

  for (const editor of editors) {
    const mcpConfig = await config.generateMCPConfig(editor);

    // 验证配置
    const validation = await config.validateMCPConfig(mcpConfig);
    if (!validation.valid) {
      console.error(`${editor} MCP配置无效:`, validation.errors);
      continue;
    }

    console.log(`✅ ${editor} MCP配置生成成功`);
  }

  // 2. 测试配置有效性
  for (const editor of editors) {
    const result = await config.testMCPConfiguration(editor);
    if (result.valid) {
      console.log(`✅ ${editor} 配置测试通过`);
    } else {
      console.warn(`⚠️ ${editor} 配置测试失败:`, result.errors);
    }
  }

  // 3. 获取MCP能力
  const capabilities = await config.getMCPCapabilities();
  console.log('MCP支持的能力:', capabilities);
}
```

### MCP配置类型定义

```typescript
interface MCPConfig {
  editor: EditorType
  serverConfig: MCPServerConfig
  capabilities: MCPCapabilities
  environment: Record&lt;string, string&gt;
}

interface MCPServerConfig {
  command: string
  args: string[]
  timeout?: number
  retries?: number
}

interface MCPCapabilities {
  resources: boolean
  tools: boolean
  prompts: boolean
  streaming: boolean
}

type EditorType = 'windsurf' | 'trae' | 'cursor' | 'vscode'

interface TestResult {
  valid: boolean
  errors?: string[]
  warnings?: string[]
}

interface ValidationResult {
  valid: boolean
  errors?: string[]
  warnings?: string[]
}
```

## 📚 相关文档

- [MCP 集成指南](../guide/mcp-integration.md) - MCP 集成详细说明
- [MCP 配置参考](../reference/mcp-configuration.md) - MCP 配置参考
- [项目配置管理 API](./project-config.md) - 项目集成配置
- [类型定义](./types/config.md) - 配置相关类型
