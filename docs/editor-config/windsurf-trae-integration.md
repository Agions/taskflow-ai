# Windsurf和Trae编辑器集成指南

TaskFlow AI v1.2.0 新增了对 Windsurf 和 Trae 编辑器的完整支持，并集成了 MCP (Model Context Protocol) 服务，实现了智能的多模型任务编排和实时协作功能。

## 🎯 新功能概览

### 1. 编辑器支持扩展
- ✅ **Windsurf**: 完整的AI配置和MCP服务集成
- ✅ **Trae**: 智能工作流和任务管理集成
- ✅ **MCP服务**: 统一的模型上下文协议支持
- ✅ **多模型协作**: 智能任务分解和模型选择

### 2. 核心特性
- 🤖 **智能任务分解**: 类似AugmentCode的复杂任务拆分
- 🔄 **多模型协作**: 自动选择最适合的AI模型
- 📊 **实时状态同步**: 任务进度和状态实时更新
- 🔗 **依赖关系管理**: 智能的任务依赖分析
- 🎯 **负载均衡**: 自动模型负载均衡和故障转移

## 🚀 快速开始

### 安装和初始化

```bash
# 创建新项目（默认启用所有支持的编辑器）
taskflow init

# 或者指定特定编辑器
taskflow init --editor windsurf,trae 

# 为现有项目添加编辑器配置
taskflow init --force
```

### 生成的文件结构

```
my-project/
├── .windsurf/                 # Windsurf编辑器配置
│   ├── settings.json          # 主配置文件
│   ├── mcp.json              # MCP服务配置
│   └── ai-config.json        # AI助手配置
├── .trae/                    # Trae编辑器配置
│   ├── config.json           # 主配置文件
│   ├── mcp.json              # MCP服务配置
│   └── workflows.json        # 工作流配置
├── .taskflow/                # TaskFlow数据目录
│   ├── config.json           # 项目配置
│   └── tasks.json            # 任务数据
└── taskflow.config.json      # 全局配置
```

## 🔧 Windsurf编辑器集成

### 配置特性

Windsurf配置包含以下核心功能：

#### 1. AI助手配置
```json
{
  "ai": {
    "enabled": true,
    "provider": "taskflow-ai",
    "features": {
      "codeCompletion": true,
      "codeGeneration": true,
      "taskDecomposition": true,
      "projectAnalysis": true,
      "multiModelOrchestration": true
    }
  }
}
```

#### 2. 多模型策略
```json
{
  "orchestration": {
    "strategy": "intelligent",
    "models": {
      "codeGeneration": {
        "primary": "deepseek",
        "fallback": ["qwen", "zhipu"]
      },
      "taskPlanning": {
        "primary": "qwen",
        "fallback": ["wenxin", "spark"]
      },
      "documentation": {
        "primary": "moonshot",
        "fallback": ["qwen", "zhipu"]
      }
    }
  }
}
```

#### 3. 智能任务分解
```json
{
  "features": {
    "smartTaskBreakdown": {
      "enabled": true,
      "maxDepth": 3,
      "autoAssignment": true,
      "dependencyTracking": true
    }
  }
}
```

### 使用方法

1. **启动Windsurf编辑器**
2. **打开项目目录**
3. **TaskFlow AI会自动激活**，提供以下功能：
   - 智能代码补全和生成
   - 自动任务分解和规划
   - 实时项目状态同步
   - 多模型协作处理

## 🎨 Trae编辑器集成

### 工作流配置

Trae编辑器专注于工作流自动化和任务管理：

#### 1. 智能任务分解工作流
```json
{
  "name": "Smart Task Decomposition",
  "trigger": "on_prd_change",
  "actions": [
    {
      "type": "taskflow_parse_prd",
      "config": {
        "autoGenerate": true,
        "multiModel": true,
        "assignees": "auto"
      }
    },
    {
      "type": "taskflow_generate_tasks",
      "config": {
        "depth": 3,
        "dependencies": true,
        "estimates": true
      }
    }
  ]
}
```

#### 2. 多模型代码生成工作流
```json
{
  "name": "Multi-Model Code Generation",
  "trigger": "on_task_start",
  "actions": [
    {
      "type": "taskflow_multi_model_orchestration",
      "config": {
        "strategy": "best_for_task",
        "fallback": true,
        "quality_check": true
      }
    }
  ]
}
```

#### 3. 进度同步工作流
```json
{
  "name": "Progress Sync",
  "trigger": "on_file_save",
  "actions": [
    {
      "type": "taskflow_update_task_status",
      "config": {
        "auto_detect": true,
        "sync_team": true
      }
    }
  ]
}
```

## 🔗 MCP服务集成

### 可用工具

TaskFlow AI MCP服务提供以下工具：

#### 1. PRD解析工具
```typescript
taskflow_parse_prd({
  content: "# 产品需求文档\n...",
  format: "markdown",
  options: {
    extractSections: true,
    extractFeatures: true,
    prioritize: true
  }
})
```

#### 2. 任务生成工具
```typescript
taskflow_generate_tasks({
  requirements: ["用户认证", "数据展示", "报表生成"],
  projectType: "Web Application",
  complexity: "medium",
  maxDepth: 3
})
```

#### 3. 多模型协作工具
```typescript
taskflow_multi_model_orchestration({
  task: "实现用户管理系统",
  taskType: "code_generation",
  context: {
    projectType: "Web Application",
    technologies: ["React", "Node.js"],
    priority: "high"
  },
  options: {
    useMultipleModels: true,
    qualityCheck: true,
    fallbackEnabled: true
  }
})
```

#### 4. 智能任务分解工具
```typescript
taskflow_smart_task_breakdown({
  complexTask: "开发完整的电商平台",
  targetGranularity: "medium",
  estimateEffort: true,
  generateDependencies: true
})
```

#### 5. 任务状态管理工具
```typescript
taskflow_update_task_status({
  taskId: "task_123",
  status: "in_progress",
  progress: 75,
  notes: "功能开发进行中"
})
```

#### 6. 项目状态查询工具
```typescript
taskflow_get_project_status({
  projectPath: ".",
  includeDetails: true,
  includeMetrics: true
})
```

### MCP服务启动

MCP服务会在编辑器启动时自动运行：

```bash
# 手动启动MCP服务（调试用）
node dist/mcp/server.js

# 或使用npm脚本
npm run mcp:start
```

## 🤖 多模型协作功能

### 智能模型选择

TaskFlow AI会根据任务类型自动选择最适合的模型：

| 任务类型 | 主要模型 | 备用模型 | 特点 |
|---------|---------|---------|------|
| 代码生成 | DeepSeek | Qwen, Zhipu | 专业代码能力 |
| 任务规划 | Qwen | Wenxin, Spark | 逻辑推理能力 |
| 文档编写 | Moonshot | Qwen, Zhipu | 长文本处理 |
| 测试设计 | Zhipu | DeepSeek, Qwen | 质量保证 |
| 代码审核 | DeepSeek | Zhipu, Qwen | 代码理解 |

### 任务分解策略

复杂任务会被智能分解为可执行的子任务：

```typescript
// 示例：开发用户管理系统
const complexTask = {
  description: "开发完整的用户管理系统",
  type: "code_generation"
};

// 自动分解为：
const subtasks = [
  {
    title: "需求分析",
    estimatedHours: 4,
    recommendedModel: "qwen"
  },
  {
    title: "核心代码实现", 
    estimatedHours: 12,
    recommendedModel: "deepseek",
    dependencies: ["需求分析"]
  },
  {
    title: "测试代码编写",
    estimatedHours: 6,
    recommendedModel: "zhipu",
    dependencies: ["核心代码实现"]
  },
  {
    title: "技术文档",
    estimatedHours: 4,
    recommendedModel: "moonshot",
    dependencies: ["核心代码实现"]
  }
];
```

### 执行计划生成

系统会自动生成最优的执行计划：

```typescript
const executionPlan = [
  {
    step: 1,
    tasks: ["需求分析"],
    parallelExecution: false,
    estimatedDuration: 4
  },
  {
    step: 2,
    tasks: ["核心代码实现"],
    parallelExecution: false,
    estimatedDuration: 12
  },
  {
    step: 3,
    tasks: ["测试代码编写", "技术文档"],
    parallelExecution: true,
    estimatedDuration: 6
  }
];
```

## 📊 任务状态管理

### 状态跟踪

TaskFlow AI提供完整的任务状态管理：

```typescript
enum TaskStatus {
  PENDING = 'pending',        // 待处理
  IN_PROGRESS = 'in_progress', // 进行中
  COMPLETED = 'completed',     // 已完成
  BLOCKED = 'blocked',        // 阻塞中
  CANCELLED = 'cancelled'     // 已取消
}
```

### 进度监控

实时监控项目整体进度：

```typescript
const stats = {
  total: 15,           // 总任务数
  completed: 8,        // 已完成
  in_progress: 4,      // 进行中
  pending: 2,          // 待处理
  blocked: 1,          // 阻塞中
  overallProgress: 53.3 // 整体进度%
};
```

### 依赖关系管理

自动检查和管理任务依赖：

```typescript
const dependencies = taskManager.checkTaskDependencies('task_123');
// {
//   canStart: false,
//   blockedBy: ['task_456', 'task_789']
// }
```

## 🔧 配置和自定义

### 模型配置

在 `taskflow.config.json` 中配置AI模型：

```json
{
  "ai": {
    "models": {
      "default": "qwen",
      "multiModel": {
        "enabled": true,
        "primary": "qwen",
        "fallback": ["deepseek", "zhipu", "moonshot"]
      }
    },
    "orchestration": {
      "strategy": "intelligent",
      "loadBalancing": true,
      "healthCheck": true
    }
  }
}
```

### 工作流自定义

在 `.trae/workflows.json` 中自定义工作流：

```json
{
  "workflows": [
    {
      "name": "Custom Code Review",
      "trigger": "on_pull_request",
      "actions": [
        {
          "type": "taskflow_multi_model_orchestration",
          "config": {
            "taskType": "review",
            "models": ["deepseek", "zhipu"],
            "criteria": ["security", "performance", "maintainability"]
          }
        }
      ]
    }
  ]
}
```

## 🚀 最佳实践

### 1. 项目初始化
```bash
# 使用默认配置（包含所有支持的编辑器）
taskflow init --template web-app --typescript --testing

# 或者指定特定编辑器
taskflow init --editor windsurf,trae,cursor --template web-app --typescript --testing
```

### 2. 任务规划
- 使用PRD解析工具自动生成初始任务
- 利用智能任务分解处理复杂需求
- 设置合理的任务依赖关系

### 3. 多模型使用
- 让系统自动选择最适合的模型
- 启用质量检查和故障转移
- 监控模型性能指标

### 4. 团队协作
- 启用实时状态同步
- 使用工作流自动化常见操作
- 定期查看项目状态报告

## 🔍 故障排除

### 常见问题

1. **MCP服务无法启动**
   ```bash
   # 检查Node.js版本
   node --version  # 需要 >= 16.0.0
   
   # 重新安装依赖
   npm install
   
   # 手动启动MCP服务
   npm run mcp:start
   ```

2. **编辑器配置未生效**
   ```bash
   # 重新生成配置
   taskflow init . --editor windsurf,trae --force
   
   # 检查配置文件
   cat .windsurf/settings.json
   cat .trae/config.json
   ```

3. **任务状态同步问题**
   ```bash
   # 检查任务数据
   cat .taskflow/tasks.json
   
   # 重置任务状态
   taskflow tasks reset
   ```

### 调试模式

启用调试模式获取详细日志：

```bash
# 设置调试环境变量
export DEBUG=taskflow:*
export LOG_LEVEL=debug

# 启动服务
npm run dev
```

## 📚 API参考

详细的API文档请参考：
- [MCP服务API](./mcp-api-reference.md)
- [多模型协作API](./multi-model-api.md)
- [任务管理API](./task-management-api.md)

## 🎯 下一步

- 探索[高级配置选项](./advanced-configuration.md)
- 学习[自定义工作流](./custom-workflows.md)
- 查看[性能优化指南](./performance-optimization.md)
- 参与[社区讨论](https://github.com/Agions/taskflow-ai/issues)
