/**
 * TaskFlow AI 核心服务
 * 整合 PRD 解析、任务管理和 AI 编排功能
 */

import { Logger } from '../infra/logger';
import { ConfigManager } from '../infra/config';

import { TaskManager } from '../core/task/task-manager';
import { ModelCoordinator } from '../core/models/coordinator';

import { Task, TaskStatus, TaskPriority, TaskType } from '../types/task';
import { ModelType } from '../types/config';
import { MessageRole } from '../types/model';

/**
 * 任务创建参数
 */
export interface TaskCreateParams {
  title: string;
  description: string;
  priority?: 'high' | 'medium' | 'low';
  assignee?: string;
}

/**
 * 任务查询参数
 */
export interface TaskQueryParams {
  status?: string;
  priority?: string;
  assignee?: string;
}

/**
 * AI 查询选项
 */
export interface AIQueryOptions {
  model?: string;
  context?: string;
  temperature?: number;
}

/**
 * PRD 解析结果
 */
export interface PRDParseResult {
  title: string;
  description: string;
  tasks: Array<{
    title: string;
    description: string;
    priority: TaskPriority;
    estimatedHours?: number;
    dependencies?: string[];
  }>;
  metadata: {
    parsedAt: string;
    model: string;
    confidence: number;
  };
}

/**
 * 代码分析结果
 */
export interface CodeAnalysisResult {
  quality: {
    score: number;
    issues: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      line?: number;
      column?: number;
    }>;
  };
  structure: {
    complexity: number;
    maintainability: number;
    testability: number;
  };
  suggestions: string[];
}

/**
 * TaskFlow 核心服务类
 */
export class TaskFlowCore {
  private logger: Logger;
  private config: ConfigManager;

  private taskManager: TaskManager;
  private modelCoordinator: ModelCoordinator;
  private initialized: boolean = false;

  constructor(logger: Logger) {
    this.logger = logger;
    this.config = new ConfigManager('taskflow');
    this.modelCoordinator = new ModelCoordinator(this.config);

    this.taskManager = new TaskManager(logger, this.config);
  }

  /**
   * 初始化核心服务
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.logger.info('初始化 TaskFlow 核心服务...');

      // 配置管理器已在构造函数中初始化

      // 其他组件暂时不需要初始化，因为它们在构造函数中已经准备就绪
      this.initialized = true;
      this.logger.info('TaskFlow 核心服务初始化完成');

    } catch (error) {
      this.logger.error('TaskFlow 核心服务初始化失败:', { error });
      throw error;
    }
  }

  /**
   * 解析 PRD 文档
   * @param content PRD 内容
   * @param format 文档格式
   * @param model AI 模型
   * @returns 解析结果
   */
  public async parsePRD(
    content: string, 
    format: string = 'markdown', 
    model: string = 'zhipu'
  ): Promise<PRDParseResult> {
    this.ensureInitialized();

    try {
      this.logger.info(`解析 PRD 文档，格式: ${format}, 模型: ${model}`);

      // 使用 ModelCoordinator 解析 PRD
      const parseResult = await this.modelCoordinator.parsePRD(content, {
        modelType: this.convertToModelType(model)
      });

      // 解析AI返回的JSON结果
      let parsedData: {
        title?: string;
        description?: string;
        sections?: unknown[];
        tasks?: Array<{
          title: string;
          description: string;
          priority: string;
          type: string;
          dependencies: string[];
        }>;
      };
      try {
        parsedData = JSON.parse(parseResult.content);
      } catch (error) {
        // 如果解析失败，创建一个基本结构
        parsedData = {
          title: '解析的PRD文档',
          description: parseResult.content.substring(0, 200) + '...',
          sections: []
        };
      }

      // 转换为标准格式
      const result: PRDParseResult = {
        title: parsedData.title || '未命名项目',
        description: parsedData.description || '',
        tasks: this.extractTasksFromSections(parsedData.sections || []),
        metadata: {
          parsedAt: new Date().toISOString(),
          model,
          confidence: 0.8
        }
      };

      this.logger.info(`PRD 解析完成，生成 ${result.tasks.length} 个任务`);
      return result;

    } catch (error) {
      this.logger.error('PRD 解析失败:', { error });
      throw new Error(`PRD 解析失败: ${(error as Error).message}`);
    }
  }

  /**
   * 创建任务
   * @param params 任务参数
   * @returns 创建的任务
   */
  public async createTask(params: TaskCreateParams): Promise<Task> {
    this.ensureInitialized();

    try {
      this.logger.info(`创建任务: ${params.title}`);

      // 转换优先级
      const priority = this.convertPriority(params.priority);

      // 创建任务
      const task = this.taskManager.addTask({
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        name: params.title,
        title: params.title,
        description: params.description,
        priority,
        assignee: params.assignee,
        status: TaskStatus.TODO,
        type: TaskType.FEATURE,
        dependencies: [],
        subtasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: []
      });

      this.logger.info(`任务创建成功: ${task.id}`);
      return task;

    } catch (error) {
      this.logger.error('任务创建失败:', { error });
      throw new Error(`任务创建失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取任务列表
   * @param params 查询参数
   * @returns 任务列表
   */
  public async getTasks(params: TaskQueryParams = {}): Promise<Task[]> {
    this.ensureInitialized();

    try {
      this.logger.info('获取任务列表');

      // 构建查询条件
      const query: {
        status?: TaskStatus | TaskStatus[];
        type?: string | string[];
        assignee?: string;
        priority?: string | string[];
      } = {};
      
      if (params.status) {
        query.status = this.convertStatus(params.status);
      }
      
      if (params.priority) {
        query.priority = this.convertPriority(params.priority);
      }
      
      if (params.assignee) {
        query.assignee = params.assignee;
      }

      // 获取任务
      const tasks = this.taskManager.filterTasks(query);

      this.logger.info(`获取到 ${tasks.length} 个任务`);
      return tasks;

    } catch (error) {
      this.logger.error('获取任务列表失败:', { error });
      throw new Error(`获取任务列表失败: ${(error as Error).message}`);
    }
  }

  /**
   * 分析代码
   * @param code 代码内容
   * @param language 编程语言
   * @param analysisType 分析类型
   * @returns 分析结果
   */
  public async analyzeCode(
    code: string, 
    language?: string, 
    analysisType: string = 'quality'
  ): Promise<CodeAnalysisResult> {
    this.ensureInitialized();

    try {
      this.logger.info(`分析代码，语言: ${language}, 类型: ${analysisType}`);

      // 使用模型协调器分析代码
      const analysisResult = await this.modelCoordinator.chat([
        {
          role: MessageRole.USER,
          content: `请分析以下${language || ''}代码的${analysisType}，返回JSON格式结果：
{
  "quality": {"score": 0.8, "issues": []},
  "structure": {"complexity": 0.5, "maintainability": 0.8, "testability": 0.7},
  "suggestions": ["建议1", "建议2"]
}

代码：
\`\`\`${language || ''}
${code}
\`\`\``
        }
      ], ModelType.DEEPSEEK);

      // 解析分析结果
      let analysisData: {
        quality?: {
          score: number;
          issues: Array<{ type: 'error' | 'warning' | 'info'; message: string; line?: number; column?: number; }>;
        };
        structure?: { complexity: number; maintainability: number; testability: number };
        suggestions?: string[];
      };
      try {
        analysisData = JSON.parse(analysisResult.content);
      } catch (error) {
        // 如果解析失败，使用默认值
        analysisData = {
          quality: { score: 0.8, issues: [] },
          structure: { complexity: 0.5, maintainability: 0.8, testability: 0.7 },
          suggestions: [analysisResult.content]
        };
      }

      const result: CodeAnalysisResult = {
        quality: {
          score: analysisData.quality?.score || 0.8,
          issues: analysisData.quality?.issues || []
        },
        structure: {
          complexity: analysisData.structure?.complexity || 0.5,
          maintainability: analysisData.structure?.maintainability || 0.8,
          testability: analysisData.structure?.testability || 0.7
        },
        suggestions: analysisData.suggestions || [analysisResult.content]
      };

      this.logger.info('代码分析完成');
      return result;

    } catch (error) {
      this.logger.error('代码分析失败:', { error });
      throw new Error(`代码分析失败: ${(error as Error).message}`);
    }
  }

  /**
   * AI 查询
   * @param prompt 查询提示
   * @param options 查询选项
   * @returns AI 响应
   */
  public async queryAI(prompt: string, options: AIQueryOptions = {}): Promise<string> {
    this.ensureInitialized();

    try {
      this.logger.info(`AI 查询，模型: ${options.model || 'auto'}`);

      // 选择合适的模型
      const model = this.selectModel(options.model, prompt);

      // 调用模型协调器
      const response = await this.modelCoordinator.chat([
        {
          role: MessageRole.USER,
          content: prompt
        }
      ], this.convertToModelType(model), {
        temperature: options.temperature || 0.7
      });

      this.logger.info('AI 查询完成');
      return response.content;

    } catch (error) {
      this.logger.error('AI 查询失败:', { error });
      throw new Error(`AI 查询失败: ${(error as Error).message}`);
    }
  }

  /**
   * 确保服务已初始化
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('TaskFlow 核心服务未初始化');
    }
  }

  /**
   * 转换优先级
   */
  private convertPriority(priority?: string): TaskPriority {
    switch (priority) {
      case 'high':
        return TaskPriority.HIGH;
      case 'low':
        return TaskPriority.LOW;
      case 'medium':
      default:
        return TaskPriority.MEDIUM;
    }
  }

  /**
   * 转换状态
   */
  private convertStatus(status: string): TaskStatus {
    switch (status) {
      case 'pending':
        return TaskStatus.PENDING;
      case 'in_progress':
        return TaskStatus.IN_PROGRESS;
      case 'completed':
        return TaskStatus.COMPLETED;
      case 'cancelled':
        return TaskStatus.CANCELLED;
      default:
        return TaskStatus.PENDING;
    }
  }

  /**
   * 智能选择模型
   */
  private selectModel(preferredModel?: string, prompt?: string): string {
    if (preferredModel && preferredModel !== 'auto') {
      return preferredModel;
    }

    // 智能模型选择逻辑
    if (prompt) {
      // 检测中文内容
      if (/[\u4e00-\u9fa5]/.test(prompt)) {
        return 'zhipu';
      }

      // 检测代码内容
      if (/function|class|interface|import|export/.test(prompt)) {
        return 'deepseek';
      }

      // 检测长文本
      if (prompt.length > 2000) {
        return 'moonshot';
      }
    }

    // 默认使用通义千问
    return 'qwen';
  }

  /**
   * 转换模型名称为ModelType
   */
  private convertToModelType(model: string): ModelType {
    switch (model) {
      case 'deepseek':
        return ModelType.DEEPSEEK;
      case 'zhipu':
        return ModelType.ZHIPU;
      case 'qwen':
        return ModelType.QWEN;
      case 'baidu':
        return ModelType.BAIDU;
      case 'moonshot':
        return ModelType.MOONSHOT;
      case 'spark':
        return ModelType.SPARK;
      default:
        return ModelType.QWEN; // 默认使用通义千问
    }
  }

  /**
   * 从PRD章节中提取任务
   */
  private extractTasksFromSections(sections: unknown[]): Array<{
    title: string;
    description: string;
    priority: TaskPriority;
    estimatedHours?: number;
    dependencies?: string[];
  }> {
    const tasks: Array<{
      title: string;
      description: string;
      priority: TaskPriority;
      estimatedHours?: number;
      dependencies?: string[];
    }> = [];

    sections.forEach(section => {
      if (typeof section === 'object' && section !== null) {
        const sectionObj = section as Record<string, unknown>;
        if (sectionObj.type === 'feature' || sectionObj.type === 'requirement') {
          tasks.push({
            title: (sectionObj.title as string) || '未命名任务',
            description: (sectionObj.content as string) || (sectionObj.description as string) || '',
            priority: this.determinePriority(sectionObj.priority as string),
            estimatedHours: (sectionObj.estimatedHours as number) || this.estimateHours((sectionObj.content as string) || ''),
            dependencies: (sectionObj.dependencies as string[]) || []
          });
        }

        // 递归处理子章节
        if (sectionObj.subsections && Array.isArray(sectionObj.subsections)) {
          tasks.push(...this.extractTasksFromSections(sectionObj.subsections));
        }
      }
    });

    return tasks;
  }

  /**
   * 确定任务优先级
   */
  private determinePriority(priority?: string): TaskPriority {
    if (!priority) return TaskPriority.MEDIUM;

    switch (priority.toLowerCase()) {
      case 'high':
      case '高':
      case 'urgent':
        return TaskPriority.HIGH;
      case 'low':
      case '低':
        return TaskPriority.LOW;
      default:
        return TaskPriority.MEDIUM;
    }
  }

  /**
   * 估算任务工时
   */
  private estimateHours(content: string): number {
    // 简单的工时估算逻辑
    const wordCount = content.length;
    if (wordCount < 100) return 2;
    if (wordCount < 300) return 4;
    if (wordCount < 500) return 8;
    return 16;
  }
}
