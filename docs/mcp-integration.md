# TaskFlow AI MCP 集成指南

本文档介绍如何在TaskFlow AI中集成和使用MCP（Model Context Protocol）服务器。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install @modelcontextprotocol/sdk
```

### 2. 基本配置

```typescript
import { TaskFlowEngine } from '@core/engine';
import { MCPServerManager } from '@integrations/mcp/server-manager';

const config = {
  mcp: {
    servers: {
      filesystem: {
        command: 'node',
        args: ['./src-new/integrations/mcp/tools/builtin/filesystem.js'],
        env: {}
      },
      git: {
        command: 'node', 
        args: ['./src-new/integrations/mcp/tools/builtin/git.js'],
        env: {}
      }
    }
  }
};

const engine = new TaskFlowEngine(config);
await engine.initialize();
```

### 3. 使用MCP工具

```typescript
// 获取可用工具列表
const tools = await engine.getMCPTools();

// 调用文件系统工具
const result = await engine.callMCPTool('filesystem', 'read_file', {
  path: '/path/to/file.txt'
});

// 调用Git工具
const status = await engine.callMCPTool('git', 'git_status', {
  path: '/path/to/repository'
});
```

## 📋 支持的内置工具

### 文件系统工具 (filesystem)

提供文件和目录操作功能：

- `read_file` - 读取文件内容
- `write_file` - 写入文件内容  
- `list_directory` - 列出目录内容
- `create_directory` - 创建目录
- `delete_file` - 删除文件或目录

#### 示例

```typescript
// 读取文件
const content = await engine.callMCPTool('filesystem', 'read_file', {
  path: './README.md'
});

// 写入文件
await engine.callMCPTool('filesystem', 'write_file', {
  path: './output.txt',
  content: 'Hello, World!'
});

// 列出目录
const files = await engine.callMCPTool('filesystem', 'list_directory', {
  path: './src'
});
```

### Git工具 (git)

提供版本控制操作功能：

- `git_status` - 获取仓库状态
- `git_log` - 查看提交历史
- `git_diff` - 查看文件差异
- `git_add` - 添加文件到暂存区
- `git_commit` - 提交变更
- `git_branch` - 分支操作
- `git_merge` - 合并分支

#### 示例

```typescript
// 获取Git状态
const status = await engine.callMCPTool('git', 'git_status', {
  path: './'
});

// 查看提交历史
const log = await engine.callMCPTool('git', 'git_log', {
  path: './',
  count: 5,
  oneline: true
});

// 提交变更
await engine.callMCPTool('git', 'git_add', {
  path: './',
  all: true
});

await engine.callMCPTool('git', 'git_commit', {
  path: './',
  message: 'feat: 添加新功能'
});
```

## 🔧 自定义MCP服务器

### 创建服务器

```javascript
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

class CustomMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'custom-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // 注册工具
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'hello_world',
            description: '输出Hello World',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: '名称',
                  default: 'World'
                }
              }
            }
          }
        ]
      };
    });

    // 处理工具调用
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'hello_world') {
        return {
          content: [
            {
              type: 'text',
              text: `Hello, ${args.name || 'World'}!`
            }
          ]
        };
      }

      throw new Error(`未知工具: ${name}`);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// 启动服务器
const server = new CustomMCPServer();
server.run();
```

### 注册自定义服务器

```typescript
import { MCPServerManager } from '@integrations/mcp/server-manager';

const serverManager = new MCPServerManager(configManager, toolRegistry);

// 添加自定义服务器
await serverManager.addServer('custom-server', {
  command: 'node',
  args: ['./path/to/custom-server.js'],
  env: {},
  autoStart: true
});
```

## 🌐 远程MCP服务器

### WebSocket连接

```typescript
import { RemoteMCPServerManager } from '@integrations/mcp/remote-server';

const remoteManager = new RemoteMCPServerManager(configManager, cacheManager);

// 添加远程服务器
await remoteManager.addServer({
  id: 'remote-ai-server',
  name: '远程AI服务器',
  endpoint: 'wss://api.example.com/mcp',
  protocol: 'websocket',
  authentication: {
    type: 'api_key',
    credentials: {
      apiKey: 'your-api-key'
    }
  },
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  healthCheck: {
    enabled: true,
    interval: 60000,
    timeout: 10000
  }
});
```

### HTTP连接

```typescript
await remoteManager.addServer({
  id: 'http-service',
  name: 'HTTP服务',
  endpoint: 'https://api.example.com/mcp',
  protocol: 'http',
  authentication: {
    type: 'jwt',
    credentials: {
      token: 'your-jwt-token'
    }
  },
  timeout: 15000,
  retryAttempts: 2,
  retryDelay: 2000
});
```

## 🛡️ 安全管理

### 安全策略配置

```typescript
import { MCPSecurityManager } from '@integrations/mcp/security-manager';

const securityManager = new MCPSecurityManager(configManager, cacheManager);

// 评估服务器安全性
const assessment = await securityManager.assessServerSecurity({
  serverId: 'external-server',
  sourceUrl: 'https://github.com/example/mcp-server',
  certificate: '-----BEGIN CERTIFICATE-----...',
  signature: 'base64-signature',
  metadata: {
    publicKey: '-----BEGIN PUBLIC KEY-----...'
  },
  requestedPermissions: ['file:read', 'network:http']
});

if (assessment.trusted) {
  console.log(`信任级别: ${assessment.trustLevel}`);
  console.log(`授予权限:`, assessment.permissions);
} else {
  console.log('服务器不受信任');
  console.log('安全风险:', assessment.risks);
}
```

### 受信任源配置

```typescript
const securityPolicy = {
  id: 'production',
  name: '生产环境安全策略',
  trustedSources: [
    {
      id: 'github-official',
      type: 'domain',
      value: 'github.com',
      trustLevel: 'high'
    },
    {
      id: 'company-cert',
      type: 'certificate',
      value: 'sha256:abc123...',
      trustLevel: 'absolute'
    }
  ],
  restrictions: [
    {
      type: 'network',
      rules: {
        allowedDomains: ['*.github.com', '*.npmjs.com'],
        deniedDomains: ['*.suspicious.com']
      }
    }
  ]
};
```

## 📊 性能监控

### 启动监控

```typescript
import { MCPPerformanceMonitor } from '@integrations/mcp/performance-monitor';

const monitor = new MCPPerformanceMonitor(configManager, cacheManager, {
  collectInterval: 5000,
  alertThresholds: {
    cpu: 80,
    memory: 85,
    latency: 1000,
    errorRate: 5
  }
});

// 开始监控服务器
monitor.startMonitoring('filesystem');
monitor.startMonitoring('git');

// 监听警报
monitor.on('alert', (alert) => {
  console.log(`⚠️ 性能警报: ${alert.message}`);
  console.log(`服务器: ${alert.serverId}, 当前值: ${alert.currentValue}`);
});
```

### 获取性能报告

```typescript
// 获取实时指标
const metrics = await monitor.getRealTimeMetrics('filesystem');
console.log('CPU使用率:', metrics.cpu.usage);
console.log('内存使用率:', metrics.memory.usage);
console.log('平均延迟:', metrics.latency.avg);

// 生成诊断报告
const report = await monitor.generateDiagnosticReport('filesystem');
console.log('健康状态:', report.summary.status);
console.log('性能评分:', report.summary.score);
console.log('瓶颈分析:', report.performance.bottlenecks);
console.log('优化建议:', report.performance.recommendations);
```

## 🔄 生命周期管理

### 服务器生命周期

```typescript
import { MCPServerLifecycleManager } from '@integrations/mcp/lifecycle-manager';

const lifecycleManager = new MCPServerLifecycleManager(
  configManager, 
  cacheManager,
  {
    autoRestart: true,
    maxRestartAttempts: 3,
    restartDelay: 5000,
    healthCheckInterval: 30000
  }
);

// 启动服务器
await lifecycleManager.startServer('custom-server', {
  command: 'node',
  args: ['./custom-server.js'],
  env: { NODE_ENV: 'production' }
});

// 监听生命周期事件
lifecycleManager.on('serverStarted', (serverId, process) => {
  console.log(`✅ 服务器启动: ${serverId} (PID: ${process.pid})`);
});

lifecycleManager.on('serverExited', (serverId, code, signal) => {
  console.log(`🔄 服务器退出: ${serverId} (代码: ${code})`);
});

lifecycleManager.on('resourceThresholdExceeded', (serverId, type, value) => {
  console.log(`⚠️ 资源阈值超出: ${serverId} ${type} = ${value}`);
});
```

### 进程监控

```typescript
// 获取进程信息
const process = lifecycleManager.getServerProcess('custom-server');
console.log('进程状态:', process.status);
console.log('运行时间:', process.uptime);
console.log('重启次数:', process.restartCount);

// 获取进程指标
const metrics = await lifecycleManager.getProcessMetrics('custom-server');
console.log('内存使用:', metrics.memoryUsage);
console.log('CPU使用:', metrics.cpuUsage);
console.log('连接数:', metrics.connections);
```

## 💡 最佳实践

### 1. 错误处理

```typescript
try {
  const result = await engine.callMCPTool('filesystem', 'read_file', {
    path: '/nonexistent/file.txt'
  });
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('文件不存在');
  } else {
    console.error('读取文件失败:', error.message);
  }
}
```

### 2. 批量操作

```typescript
// 批量文件操作
const files = ['file1.txt', 'file2.txt', 'file3.txt'];
const results = await Promise.all(
  files.map(file => 
    engine.callMCPTool('filesystem', 'read_file', { path: file })
      .catch(error => ({ error: error.message, file }))
  )
);

results.forEach((result, index) => {
  if (result.error) {
    console.error(`读取 ${files[index]} 失败:`, result.error);
  } else {
    console.log(`${files[index]} 内容长度:`, result.content[0].text.length);
  }
});
```

### 3. 缓存优化

```typescript
// 使用缓存避免重复调用
const cacheKey = `git_status_${repoPath}`;
let status = await cacheManager.get(cacheKey);

if (!status) {
  status = await engine.callMCPTool('git', 'git_status', { path: repoPath });
  await cacheManager.set(cacheKey, status, 60); // 缓存1分钟
}
```

### 4. 超时处理

```typescript
// 设置调用超时
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('操作超时')), 30000)
);

try {
  const result = await Promise.race([
    engine.callMCPTool('slow-operation', 'long_task', {}),
    timeoutPromise
  ]);
} catch (error) {
  if (error.message === '操作超时') {
    console.log('操作超时，请稍后重试');
  } else {
    console.error('操作失败:', error);
  }
}
```

## 🐛 故障排除

### 常见问题

1. **服务器启动失败**
   ```bash
   # 检查服务器配置
   npx taskflow-mcp server status <server-id>
   
   # 查看服务器日志
   npx taskflow-mcp server logs <server-id>
   ```

2. **工具调用超时**
   - 检查网络连接
   - 增加超时时间
   - 验证服务器性能

3. **权限被拒绝**
   - 检查安全策略配置
   - 验证服务器证书
   - 确认权限请求合理性

### 调试模式

```bash
# 启用详细日志
DEBUG=taskflow:mcp* npm start

# 启用性能分析
TASKFLOW_PROFILE=true npm start
```

## 📚 API参考

### MCPServerManager

```typescript
class MCPServerManager {
  async startServer(serverId: string, config: MCPServerConfig): Promise<void>
  async stopServer(serverId: string): Promise<void>
  async restartServer(serverId: string): Promise<void>
  async listTools(serverId: string): Promise<MCPTool[]>
  async callTool(serverId: string, toolName: string, params: any): Promise<any>
  getServerStatus(serverId: string): ServerStatus | null
  getAllServerStatuses(): ServerStatus[]
}
```

### MCPSecurityManager

```typescript
class MCPSecurityManager {
  async assessServerSecurity(context: SecurityContext): Promise<SecurityAssessment>
  async validateCertificate(certificate: string): Promise<SecurityRisk[]>
  async validateSignature(context: SecurityContext): Promise<SecurityRisk[]>
}
```

### MCPPerformanceMonitor

```typescript
class MCPPerformanceMonitor {
  startMonitoring(serverId: string): void
  stopMonitoring(serverId: string): void
  async getRealTimeMetrics(serverId: string): Promise<PerformanceMetrics>
  async generateDiagnosticReport(serverId: string): Promise<DiagnosticReport>
  getAlerts(serverId: string, activeOnly?: boolean): PerformanceAlert[]
}
```

## 🤝 贡献指南

欢迎贡献新的MCP工具和功能改进！

### 开发环境设置

```bash
git clone https://github.com/your-org/taskflow-ai
cd taskflow-ai
npm install
npm run build
npm test
```

### 添加新工具

1. 在 `src-new/integrations/mcp/tools/builtin/` 创建新工具文件
2. 实现MCP服务器协议
3. 添加相应的测试
4. 更新文档

### 提交规范

- feat: 新功能
- fix: 错误修复
- docs: 文档更新
- test: 测试相关
- refactor: 重构

---

更多详细信息请参考 [TaskFlow AI 官方文档](https://taskflow-ai.github.io/docs/)。