# 项目配置管理 API

## 概述

项目配置管理器负责TaskFlow AI在现有项目中的集成配置，包括项目初始化、配置管理、环境设置等功能。

## 🏗️ 核心接口

```typescript
interface ProjectConfigManager {
  // 项目初始化
  initializeProject(options: ProjectInitOptions): Promise<ProjectConfig>;
  validateProject(path: string): Promise<ValidationResult>;

  // 配置管理
  getConfig(): Promise<ProjectConfig>;
  updateConfig(updates: Partial<ProjectConfig>): Promise<ProjectConfig>;
  resetConfig(): Promise<void>;

  // 环境管理
  setEnvironment(env: Environment): Promise<void>;
  getEnvironment(): Promise<Environment>;

  // 项目信息
  getProjectInfo(): Promise<ProjectInfo>;
  detectProjectType(): Promise<ProjectType>;
}
```

## 📋 项目初始化

### initializeProject

在现有项目中初始化TaskFlow AI。

```typescript
async initializeProject(options: ProjectInitOptions): Promise<ProjectConfig>
```

**示例**:

```typescript
import { ProjectConfigManager } from 'taskflow-ai';

const configManager = new ProjectConfigManager();

// 基本初始化
const config = await configManager.initializeProject({
  projectPath: process.cwd(),
  configDir: '.taskflow',
  force: false,
});

// 高级初始化
const advancedConfig = await configManager.initializeProject({
  projectPath: '/path/to/project',
  configDir: '.taskflow',
  force: true,
  projectInfo: {
    name: '我的项目',
    type: 'web-app',
    description: '一个React Web应用',
  },
  teamInfo: {
    members: ['张三', '李四'],
    roles: ['developer', 'designer'],
  },
});
```

### validateProject

验证项目是否适合集成TaskFlow AI。

```typescript
async validateProject(path: string): Promise<ValidationResult>
```

**示例**:

```typescript
const validation = await configManager.validateProject('/path/to/project');

if (validation.isValid) {
  console.log('项目验证通过');
  console.log('检测到的项目类型:', validation.detectedType);
} else {
  console.log('验证失败:', validation.errors);
  console.log('建议:', validation.suggestions);
}
```

## ⚙️ 配置管理

### getConfig / updateConfig

获取和更新项目配置。

```typescript
// 获取当前配置
const config = await configManager.getConfig();

// 更新配置
const updatedConfig = await configManager.updateConfig({
  project: {
    name: '新项目名称',
    type: 'api',
  },
  ai: {
    primaryModel: 'deepseek',
    fallbackModels: ['zhipu', 'qwen'],
  },
});
```

## 🔧 类型定义

### ProjectConfig

```typescript
interface ProjectConfig {
  // 项目基本信息
  project: {
    name: string;
    type: ProjectType;
    description?: string;
    version?: string;
    workDir: string;
  };

  // AI配置
  ai: {
    primaryModel: string;
    fallbackModels: string[];
    multiModelEnabled: boolean;
  };

  // 团队配置
  team: {
    members: TeamMember[];
    roles: string[];
    defaultAssignee?: string;
  };

  // 工作流配置
  workflow: {
    defaultPriority: TaskPriority;
    autoAssignment: boolean;
    notificationsEnabled: boolean;
  };
}
```

### ProjectType

```typescript
enum ProjectType {
  WEB_APP = 'web-app',
  MOBILE_APP = 'mobile-app',
  API = 'api',
  DESKTOP_APP = 'desktop-app',
  LIBRARY = 'library',
  OTHER = 'other',
}
```

## 🎯 使用示例

### 完整项目集成

```typescript
async function integrateProject() {
  const configManager = new ProjectConfigManager();

  // 1. 验证项目
  const validation = await configManager.validateProject(process.cwd());
  if (!validation.isValid) {
    throw new Error('项目验证失败');
  }

  // 2. 初始化配置
  const config = await configManager.initializeProject({
    projectPath: process.cwd(),
    projectInfo: {
      name: 'My Web App',
      type: 'web-app',
    },
  });

  // 3. 配置AI模型
  await configManager.updateConfig({
    ai: {
      primaryModel: 'deepseek',
      fallbackModels: ['zhipu'],
      multiModelEnabled: true,
    },
  });

  console.log('项目集成完成');
}
```

## 📚 相关文档

- [配置管理 API](./config-manager.md) - 系统配置管理
- [类型定义](./types/config.md) - 配置相关类型
