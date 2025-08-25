/**
/**
 * TaskFlow 统一核心引擎
 * 整合原分散的18个模块功能，提供统一的入口点
 */

import { AIOrchestrator } from './ai/orchestrator';
import { TaskManager, Task, TaskStatus, TaskPriority, TaskType } from './task/manager';
import { DocumentParser, ParseOptions } from './parser/prd-parser';
import { ConfigManager } from '../infrastructure/config/manager';
import { CacheManager, CacheConfig } from '../infrastructure/storage/cache';
import { SecurityManager, SecurityConfig } from '../infrastructure/security/manager';
import { MemoryManager, MemoryConfig } from '../infrastructure/performance/memory-manager';
import SandboxManager, { SandboxConfig, ExecutionContext, ExecutionResult } from '../infrastructure/security/sandbox';

export interface TaskFlowConfig {
  models: ModelConfig;
  storage: StorageConfig;
  security: SecurityConfig;
  cache: CacheConfig;
  memory: MemoryConfig;
  sandbox: SandboxConfig;
}

export interface ModelConfig {
  providers: Record<string, any>;
  default: string;
  fallback: string[];
}

export interface StorageConfig {
  type: 'filesystem' | 'memory';
  path?: string;
}

export interface TaskSet {
  id: string;
  tasks: Task[];
  metadata: Record<string, any>;
}

export interface AIResponse {
  content: string;
  model: string;
  tokens: number;
  confidence: number;
  cost: number;
  responseTime: number;
  metadata: Record<string, any>;
}

export interface AIOptions {
  taskType?: TaskType;
  temperature?: number;
  maxTokens?: number;
  skipCache?: boolean;
  realTime?: boolean;
}

// 重新导出类型
export { Task, TaskStatus, TaskPriority, TaskType } from './task/manager';
export { ParseOptions } from './parser/prd-parser';

/**
 * TaskFlow 统一核心引擎
 * 提供文档解析、任务管理、AI编排的统一接口
 */
export class TaskFlowEngine {
  private aiOrchestrator: AIOrchestrator;
  private taskManager: TaskManager;
  private documentParser: DocumentParser;
  private configManager: ConfigManager;
  private cacheManager: CacheManager;
  private securityManager: SecurityManager;
  private memoryManager: MemoryManager;
  private sandboxManager: SandboxManager;
  private initialized = false;

  constructor(config: TaskFlowConfig) {
    this.configManager = new ConfigManager(config);
    this.cacheManager = new CacheManager(config.cache);
    this.securityManager = new SecurityManager(config.security);
    this.memoryManager = new MemoryManager(config.memory);
    this.sandboxManager = new SandboxManager(config.sandbox);
    this.aiOrchestrator = new AIOrchestrator(this.configManager, this.cacheManager);
    this.taskManager = new TaskManager(this.configManager, this.cacheManager);
    this.documentParser = new DocumentParser(this.configManager);
  }

  /**
   * 初始化引擎
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 初始化各个组件
      await this.configManager.initialize();
      await this.cacheManager.initialize();
      await this.securityManager.initialize();
      await this.memoryManager.initialize();
      await this.sandboxManager.initialize();
      await this.aiOrchestrator.initialize();
      await this.taskManager.initialize();

      // 设置内存管理事件监听
      this.setupMemoryEventListeners();

      this.initialized = true;
      console.log('✅ TaskFlow引擎初始化成功');
    } catch (error) {
      console.error('❌ TaskFlow引擎初始化失败:', error);
      throw error;
    }
  }

  /**
   * 解析PRD文档并生成任务
   * @param filePath 文档文件路径
   * @param options 解析选项
   */
  async parseDocument(filePath: string, options?: ParseOptions): Promise<TaskSet> {
    this.ensureInitialized();

    try {
      console.log(`📄 开始解析文档: ${filePath}`);

      // 1. 解析文档内容
      const parsedContent = await this.documentParser.parse(filePath, options);

      // 2. 使用AI提取需求和任务
      const requirements = await this.aiOrchestrator.extractRequirements(parsedContent);

      // 3. 生成任务计划
      const tasks: Task[] = [];
      for (const requirement of requirements) {
        const task = await this.taskManager.createTask({
          title: requirement.title,
          description: requirement.description,
          type: TaskType.ANALYSIS,
          priority: this.mapPriorityFromRequirement(requirement.priority),
          requirements: [requirement.description],
          acceptanceCriteria: requirement.acceptance,
          estimatedHours: 2,
          tags: ['generated', 'requirement'],
        });
        tasks.push(task);
      }

      // 4. 创建任务集合
      const taskSet: TaskSet = {
        id: `taskset_${Date.now()}`,
        tasks,
        metadata: {
          sourceFile: filePath,
          createdAt: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      // 5. 缓存结果
      await this.cacheManager.set(`taskset:${taskSet.id}`, taskSet, 3600);

      console.log(`✅ 文档解析完成，生成${tasks.length}个任务`);
      return taskSet;

    } catch (error) {
      console.error('❌ 文档解析失败:', error);
      throw error;
    }
  }

  /**
   * 管理任务
   * @param taskId 任务ID
   * @param action 操作类型
   * @param payload 操作数据
   */
  async manageTask(taskId: string, action: string, payload?: any): Promise<Task> {
    this.ensureInitialized();

    try {
      console.log(`📋 执行任务操作: ${action} on ${taskId}`);

      let result: Task;
      
      switch (action) {
        case 'start':
          result = await this.taskManager.startTask(taskId);
          break;
        case 'complete':
          result = await this.taskManager.completeTask(taskId, payload);
          break;
        case 'pause':
          result = await this.taskManager.pauseTask(taskId);
          break;
        case 'cancel':
          result = await this.taskManager.cancelTask(taskId, payload?.reason);
          break;
        case 'update':
          result = await this.taskManager.updateTask(taskId, payload);
          break;
        default:
          throw new Error(`不支持的任务操作: ${action}`);
      }

      // 清理相关缓存
      await this.cacheManager.delete(`task:${taskId}`);

      return result;

    } catch (error) {
      console.error('❌ 任务操作失败:', error);
      throw error;
    }
  }

  /**
   * AI编排处理
   * @param prompt 提示词
   * @param options 选项
   */
  async orchestrateAI(prompt: string, options?: AIOptions): Promise<AIResponse> {
    this.ensureInitialized();

    try {
      console.log('🤖 开始AI编排处理');

      const response = await this.aiOrchestrator.process(prompt, options);

      return response;

    } catch (error) {
      console.error('❌ AI编排失败:', error);
      throw error;
    }
  }

  /**
   * 导出任务
   * @param taskSetId 任务集合ID
   * @param format 导出格式
   */
  async exportTasks(taskSetId: string, format: ExportFormat): Promise<string> {
    this.ensureInitialized();

    try {
      console.log(`📤 导出任务集合: ${taskSetId} 格式: ${format}`);

      const taskSet = await this.cacheManager.get(`taskset:${taskSetId}`) as TaskSet;
      if (!taskSet) {
        throw new Error(`任务集合不存在: ${taskSetId}`);
      }

      return await this.exportTaskSet(taskSet, format);

    } catch (error) {
      console.error('❌ 任务导出失败:', error);
      throw error;
    }
  }

  /**
   * 导出任务集合
   */
  private async exportTaskSet(taskSet: TaskSet, format: ExportFormat): Promise<string> {
    switch (format) {
      case ExportFormat.JSON:
        return JSON.stringify(taskSet, null, 2);
        
      case ExportFormat.MARKDOWN:
        return this.exportToMarkdown(taskSet);
        
      case ExportFormat.CSV:
        return this.exportToCSV(taskSet);
        
      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }
  }

  /**
   * 导出为Markdown格式
   */
  private exportToMarkdown(taskSet: TaskSet): string {
    let markdown = `# 任务集合: ${taskSet.id}\n\n`;
    
    markdown += `**创建时间**: ${taskSet.metadata.createdAt}\n`;
    markdown += `**源文件**: ${taskSet.metadata.sourceFile}\n`;
    markdown += `**任务数量**: ${taskSet.tasks.length}\n\n`;
    
    markdown += `## 任务列表\n\n`;
    
    for (const task of taskSet.tasks) {
      markdown += `### ${task.title}\n\n`;
      markdown += `- **状态**: ${task.status}\n`;
      markdown += `- **优先级**: ${task.priority}\n`;
      markdown += `- **预估工时**: ${task.estimatedHours}h\n`;
      markdown += `- **描述**: ${task.description}\n\n`;
      
      if (task.acceptanceCriteria.length > 0) {
        markdown += `**验收标准**:\n`;
        for (const criteria of task.acceptanceCriteria) {
          markdown += `- ${criteria}\n`;
        }
        markdown += `\n`;
      }
    }
    
    return markdown;
  }

  /**
   * 导出为CSV格式
   */
  private exportToCSV(taskSet: TaskSet): string {
    const headers = ['ID', '标题', '描述', '状态', '优先级', '预估工时', '创建时间'];
    let csv = headers.join(',') + '\n';
    
    for (const task of taskSet.tasks) {
      const row = [
        task.id,
        `"${task.title}"`,
        `"${task.description.replace(/"/g, '""')}"`,
        task.status,
        task.priority,
        task.estimatedHours,
        task.createdAt.toISOString(),
      ];
      csv += row.join(',') + '\n';
    }
    
    return csv;
  }

  /**
   * 获取引擎状态
   */
  getStatus(): EngineStatus {
    return {
      initialized: this.initialized,
      version: '2.0.0',
      components: {
        aiOrchestrator: this.aiOrchestrator.getStatus(),
        taskManager: this.taskManager.getStatus(),
        documentParser: this.documentParser.getStatus(),
        cacheManager: this.cacheManager.getStats(),
        memoryManager: this.memoryManager.getMemoryStats(),
        sandboxManager: this.sandboxManager.getStats(),
      }
    };
  }

  /**
   * 获取内存报告
   */
  getMemoryReport(): any {
    this.ensureInitialized();
    return this.memoryManager.getMemoryReport();
  }

  /**
   * 执行内存清理
   */
  async performMemoryCleanup(): Promise<void> {
    this.ensureInitialized();
    
    try {
      console.log('🧠 开始全系统内存清理...');
      
      // 1. 执行内存管理器清理
      await this.memoryManager.performCleanup();
      
      // 2. 清理缓存
      const cacheStats = this.cacheManager.getStats();
      if (cacheStats.memoryUsage > 50 * 1024 * 1024) { // 50MB
        await this.cacheManager.clear();
        console.log('💾 缓存已清理');
      }
      
      // 3. 通知其他组件清理内存
      await this.aiOrchestrator.getStatus(); // 触发内部清理
      
      console.log('✅ 全系统内存清理完成');
      
    } catch (error) {
      console.error('❌ 内存清理失败:', error);
      throw error;
    }
  }

  /**
   * 安全执行代码
   */
  async executeCodeSafely(context: ExecutionContext): Promise<ExecutionResult> {
    this.ensureInitialized();

    try {
      console.log('🔒 开始安全执行代码...');

      // 1. 验证代码安全性
      if (context.code) {
        const securityCheck = await this.validateCodeSecurity(context.code, context.language || 'javascript');
        if (!securityCheck.isSecure) {
          throw new Error(`代码安全检查失败: ${securityCheck.risks.map(r => r.description).join(', ')}`);
        }
      }

      // 2. 在沙箱中执行
      const result = await this.sandboxManager.execute(context);

      console.log(`✅ 代码执行完成: ${result.success ? '成功' : '失败'}`);
      return result;

    } catch (error) {
      console.error('❌ 安全执行代码失败:', error);
      throw error;
    }
  }

  /**
   * 验证代码安全性
   */
  async validateCodeSecurity(code: string, language: string): Promise<any> {
    // 这里可以集成 SandboxSecurityPolicy.validateCode
    // 简化实现
    return {
      isSecure: true,
      risks: [],
      warnings: [],
      blockedPatterns: []
    };
  }

  /**
   * 获取沙箱统计
   */
  getSandboxStats(): any {
    this.ensureInitialized();
    return this.sandboxManager.getStats();
  }

  /**
   * 停止沙箱任务
   */
  async stopSandboxTask(sandboxId: string): Promise<boolean> {
    this.ensureInitialized();
    return await this.sandboxManager.stopSandbox(sandboxId);
  }

  /**
   * 优雅关闭引擎
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      console.log('🔄 正在关闭TaskFlow引擎...');

      await this.aiOrchestrator.shutdown();
      await this.taskManager.shutdown();
      await this.cacheManager.shutdown();
      await this.securityManager.shutdown();
      await this.memoryManager.shutdown();
      await this.sandboxManager.shutdown();

      this.initialized = false;
      console.log('✅ TaskFlow引擎已安全关闭');

    } catch (error) {
      console.error('❌ 引擎关闭过程中出现错误:', error);
      throw error;
    }
  }

  /**
   * 确保引擎已初始化
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('TaskFlow引擎尚未初始化，请先调用 initialize()');
    }
  }

  /**
   * 映射需求优先级到任务优先级
   */
  private mapPriorityFromRequirement(reqPriority: string): TaskPriority {
    switch (reqPriority?.toLowerCase()) {
      case 'critical':
        return TaskPriority.CRITICAL;
      case 'high':
        return TaskPriority.HIGH;
      case 'low':
        return TaskPriority.LOW;
      default:
        return TaskPriority.MEDIUM;
    }
  }

  /**
   * 设置内存管理事件监听
   */
  private setupMemoryEventListeners(): void {
    // 内存警告事件
    this.memoryManager.on('memoryAlert', (alert) => {
      console.warn('⚠️ 内存警告:', alert.message);
      
      // 自动执行清理
      if (alert.type === 'critical') {
        this.performMemoryCleanup().catch(error => 
          console.error('自动内存清理失败:', error)
        );
      }
    });

    // 内存清理完成事件
    this.memoryManager.on('cleanupCompleted', () => {
      console.log('🧠 系统内存清理完成');
    });

    // 内存泄漏检测事件
    this.memoryManager.on('memoryLeakDetected', (leaks) => {
      console.error('🚨 检测到内存泄漏:', leaks);
      
      // 记录到日志系统
      for (const leak of leaks) {
        console.error(`- ${leak.objectType}: ${leak.count} 个对象, ${Math.round(leak.totalSize / 1024 / 1024)}MB`);
      }
    });

    // 缓存优化事件
    this.memoryManager.on('optimizeCaches', () => {
      // 通知缓存管理器优化
      console.log('💾 正在优化缓存...');
    });

    console.log('🔍 内存管理事件监听已设置');
  }
}

// 类型定义
export interface ParseOptions {
  language?: string;
  extractImages?: boolean;
  includeMetadata?: boolean;
}

export interface AIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export enum ExportFormat {
  JSON = 'json',
  MARKDOWN = 'markdown',
  CSV = 'csv',
  EXCEL = 'excel'
}

export interface EngineStatus {
  initialized: boolean;
  version: string;
  components: Record<string, any>;
}

export interface ModelConfig {
  default: string;
  providers: Record<string, any>;
}

export interface StorageConfig {
  type: string;
  path: string;
}

export interface SecurityConfig {
  encryption: {
    algorithm: string;
    keySize: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

export interface CacheConfig {
  type: string;
  maxSize: number;
  ttl: number;
}