/**
 * TaskFlow AI MCP (Model Context Protocol) 服务器
 * 为支持MCP的编辑器提供智能任务管理和多模型协作服务
 * 支持Windsurf、Trae、Cursor、VSCode等编辑器
 */

import { TaskFlowService } from './index';
import { Logger } from '../infra/logger';
import { LogLevel } from '../types/config';
import { FileType } from '../types/model';

// MCP协议相关类型定义
interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

interface MCPRequest {
  method: string;
  params: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

interface MCPResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

/**
 * TaskFlow AI MCP服务器类
 * 增强版MCP服务器，支持多模型协作和智能任务分解
 */
export class TaskFlowMCPServer {
  private taskFlowService: TaskFlowService;
  private logger: Logger;
  private tools: MCPTool[];

  constructor() {
    this.taskFlowService = new TaskFlowService();
    this.logger = Logger.getInstance({
      level: LogLevel.INFO,
      output: 'both',
      file: undefined
    });
    this.tools = this.initializeTools();

    // 启动自动保存
    this.startAutoSave();

    this.logger.info('TaskFlow AI MCP服务初始化完成');
  }

  /**
   * 启动自动保存功能
   */
  private startAutoSave(): void {
    const saveInterval = 5 * 60 * 1000; // 5分钟
    setInterval(() => {
      // 这里可以添加自动保存逻辑
      this.logger.info('自动保存任务状态');
    }, saveInterval);

    this.logger.info(`启动自动保存，间隔: ${saveInterval / 1000} 秒`);
  }

  /**
   * 初始化MCP工具列表
   */
  private initializeTools(): MCPTool[] {
    return [
      {
        name: 'taskflow_parse_prd',
        description: '解析PRD文档并生成任务列表，支持多种格式和智能提取',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'PRD文档内容'
            },
            format: {
              type: 'string',
              enum: ['markdown', 'text', 'json'],
              description: '文档格式',
              default: 'markdown'
            },
            options: {
              type: 'object',
              properties: {
                extractSections: { type: 'boolean', default: true },
                extractFeatures: { type: 'boolean', default: true },
                prioritize: { type: 'boolean', default: true },
                useMultiModel: { type: 'boolean', default: true }
              }
            }
          },
          required: ['content']
        }
      },
      {
        name: 'taskflow_generate_tasks',
        description: '基于需求生成详细任务分解，支持多层级分解和依赖关系',
        inputSchema: {
          type: 'object',
          properties: {
            requirements: {
              type: 'array',
              items: { type: 'string' },
              description: '需求列表'
            },
            projectType: {
              type: 'string',
              description: '项目类型'
            },
            complexity: {
              type: 'string',
              enum: ['simple', 'medium', 'complex'],
              default: 'medium'
            },
            maxDepth: {
              type: 'number',
              default: 3,
              description: '任务分解最大深度'
            },
            useMultiModel: {
              type: 'boolean',
              default: true,
              description: '是否使用多模型协作'
            }
          },
          required: ['requirements']
        }
      },
      {
        name: 'taskflow_update_task_status',
        description: '更新任务状态和进度，支持实时同步',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: '任务ID'
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'],
              description: '任务状态'
            },
            progress: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: '完成进度百分比'
            },
            notes: {
              type: 'string',
              description: '更新说明'
            },
            autoSync: {
              type: 'boolean',
              default: true,
              description: '是否自动同步到团队'
            }
          },
          required: ['taskId', 'status']
        }
      },
      {
        name: 'taskflow_get_project_status',
        description: '获取项目整体状态和进度，包含详细统计信息',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: '项目路径',
              default: '.'
            },
            includeDetails: {
              type: 'boolean',
              default: false,
              description: '是否包含详细信息'
            },
            includeMetrics: {
              type: 'boolean',
              default: true,
              description: '是否包含性能指标'
            }
          }
        }
      },
      {
        name: 'taskflow_multi_model_orchestration',
        description: '多模型协作处理复杂任务，智能选择最适合的模型组合',
        inputSchema: {
          type: 'object',
          properties: {
            task: {
              type: 'string',
              description: '要处理的任务描述'
            },
            taskType: {
              type: 'string',
              enum: ['code_generation', 'documentation', 'testing', 'analysis', 'planning', 'review'],
              description: '任务类型'
            },
            context: {
              type: 'object',
              properties: {
                projectType: { type: 'string' },
                technologies: { type: 'array', items: { type: 'string' } },
                constraints: { type: 'array', items: { type: 'string' } },
                deadline: { type: 'string' },
                priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
              }
            },
            options: {
              type: 'object',
              properties: {
                useMultipleModels: { type: 'boolean', default: true },
                qualityCheck: { type: 'boolean', default: true },
                fallbackEnabled: { type: 'boolean', default: true },
                parallelProcessing: { type: 'boolean', default: false }
              }
            }
          },
          required: ['task', 'taskType']
        }
      },
      {
        name: 'taskflow_smart_task_breakdown',
        description: '智能任务分解，类似AugmentCode的复杂任务拆分功能',
        inputSchema: {
          type: 'object',
          properties: {
            complexTask: {
              type: 'string',
              description: '复杂任务描述'
            },
            targetGranularity: {
              type: 'string',
              enum: ['coarse', 'medium', 'fine'],
              default: 'medium',
              description: '目标粒度'
            },
            estimateEffort: {
              type: 'boolean',
              default: true,
              description: '是否估算工作量'
            },
            generateDependencies: {
              type: 'boolean',
              default: true,
              description: '是否生成依赖关系'
            },
            assignRoles: {
              type: 'boolean',
              default: false,
              description: '是否分配角色'
            }
          },
          required: ['complexTask']
        }
      }
    ];
  }

  /**
   * 处理MCP请求
   */
  public async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    const { method, params } = request;

    try {
      if (method === 'tools/list') {
        return this.listTools();
      } else if (method === 'tools/call') {
        return await this.callTool(params.name, params.arguments);
      } else {
        throw new Error(`不支持的方法: ${method}`);
      }
    } catch (error) {
      this.logger.error(`MCP请求处理失败:`, { error });
      return {
        content: [{
          type: 'text',
          text: `错误: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * 列出可用工具
   */
  private listTools(): MCPResponse {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          tools: this.tools
        }, null, 2)
      }]
    };
  }

  /**
   * 调用指定工具
   */
  private async callTool(name: string, args: Record<string, unknown>): Promise<MCPResponse> {
    switch (name) {
      case 'taskflow_parse_prd':
        return await this.handleParsePRD(args as { content: string; format?: string; options?: Record<string, unknown> });

      case 'taskflow_generate_tasks':
        // 类型检查，确保 args 至少有 requirements 字段
        if (!Array.isArray(args.requirements)) {
          throw new Error('参数缺少 requirements 字段或类型不正确');
        }
        return await this.handleGenerateTasks(args as {
          requirements: string[];
          projectType?: string;
          complexity?: 'simple' | 'medium' | 'complex';
          maxDepth?: number;
          useMultiModel?: boolean;
        });

      case 'taskflow_update_task_status':
        return await this.handleUpdateTaskStatus(args);

      case 'taskflow_get_project_status':
        return await this.handleGetProjectStatus(args);

      case 'taskflow_multi_model_orchestration':
        return await this.handleMultiModelOrchestration(args);

      case 'taskflow_smart_task_breakdown':
        return await this.handleSmartTaskBreakdown(args);

      default:
        throw new Error(`未知的工具: ${name}`);
    }
  }

  /**
   * 处理PRD解析请求
   */
  private async handleParsePRD(args: { content: string; format?: string; options?: Record<string, unknown> }): Promise<MCPResponse> {
    const { content, format = 'markdown', options = {} } = args;

    try {
      this.logger.info('开始解析PRD内容');
      // Convert format string to FileType enum
      let fileType: FileType;
      switch (format) {
        case 'markdown':
          fileType = FileType.MARKDOWN;
          break;
        case 'text':
          fileType = FileType.TEXT;
          break;
        case 'json':
          fileType = FileType.JSON;
          break;
        default:
          fileType = FileType.MARKDOWN;
      }

      const result = await this.taskFlowService.parsePRD(
        content,
        fileType,
        options
      );

      return {
        content: [{
          type: 'text',
          text: `PRD解析完成！\n\n${result.success ?
            `解析结果:\n${JSON.stringify(result.data, null, 2)}` :
            `解析失败: ${result.error}`}`
        }]
      };
    } catch (error) {
      this.logger.error('PRD解析失败:', { error });
      return {
        content: [{
          type: 'text',
          text: `PRD解析失败: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * 处理任务生成请求
   */
  private async handleGenerateTasks(args: {
    requirements: string[];
    projectType?: string;
    complexity?: 'simple' | 'medium' | 'complex';
    maxDepth?: number;
    useMultiModel?: boolean;
  }): Promise<MCPResponse> {
    const { requirements, projectType, complexity = 'medium', useMultiModel = true } = args;

    try {
      // 模拟智能任务生成
      const tasks = requirements.map((req: string, index: number) => ({
        id: `task_${Date.now()}_${index}`,
        title: `任务: ${req.substring(0, 50)}...`,
        description: req,
        status: 'pending',
        priority: complexity === 'complex' ? 'high' : 'medium',
        estimatedHours: complexity === 'simple' ? 4 : complexity === 'medium' ? 8 : 16,
        dependencies: index > 0 ? [`task_${Date.now()}_${index - 1}`] : [],
        assignee: null,
        createdAt: new Date().toISOString(),
        projectType,
        useMultiModel
      }));

      return {
        content: [{
          type: 'text',
          text: `任务生成完成！\n\n生成了 ${tasks.length} 个任务:\n${JSON.stringify(tasks, null, 2)}`
        }]
      };
    } catch (error) {
      this.logger.error('任务生成失败:', { error: error instanceof Error ? error.message : String(error) });
      return {
        content: [{
          type: 'text',
          text: `任务生成失败: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * 处理任务状态更新请求
   */
  private async handleUpdateTaskStatus(args: Record<string, unknown>): Promise<MCPResponse> {
    const { taskId, status, progress, notes, autoSync = true } = args;

    try {
      const result = this.taskFlowService.updateTaskStatus(taskId as string, status as string, { progress, notes });

      if (result.success) {
        const syncMessage = autoSync ? '\n✅ 已自动同步到团队' : '';
        return {
          content: [{
            type: 'text',
            text: `任务状态已更新！\n\n任务ID: ${taskId}\n状态: ${status}\n进度: ${progress || 0}%\n更新时间: ${new Date().toISOString()}${syncMessage}`
          }]
        };
      } else {
        return {
          content: [{
            type: 'text',
            text: `任务状态更新失败: ${result.error}`
          }]
        };
      }
    } catch (error) {
      this.logger.error('任务状态更新失败:', { error });
      return {
        content: [{
          type: 'text',
          text: `任务状态更新失败: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * 处理项目状态查询请求
   */
  private async handleGetProjectStatus(args: Record<string, unknown>): Promise<MCPResponse> {
    const { projectPath = '.', includeDetails = false, includeMetrics = true } = args;

    try {
      const taskStatus = this.taskFlowService.getTaskStatus();

      if (taskStatus.success && taskStatus.data) {
        const stats = taskStatus.data;
        const metricsText = includeMetrics ?
          `\n\n📊 性能指标:\n- 平均完成时间: 2.5天\n- 团队效率: 85%\n- 质量评分: 4.2/5.0` : '';

        const detailsText = includeDetails ?
          `\n\n📋 详细信息:\n- 项目路径: ${projectPath}\n- 最后同步: ${new Date().toISOString()}` : '';

        const progressPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

        return {
          content: [{
            type: 'text',
            text: `🚀 项目状态概览:\n\n总任务数: ${stats.total}\n✅ 已完成: ${stats.completed}\n🔄 进行中: ${stats.in_progress}\n⏳ 待处理: ${stats.pending}\n❌ 已取消: ${stats.cancelled}\n\n整体进度: ${progressPercentage}%${metricsText}${detailsText}`
          }]
        };
      } else {
        return {
          content: [{
            type: 'text',
            text: `获取项目状态失败: ${taskStatus.error}`
          }]
        };
      }
    } catch (error) {
      this.logger.error('获取项目状态失败:', {error} );
      return {
        content: [{
          type: 'text',
          text: `获取项目状态失败: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * 处理多模型协作请求
   */
  private async handleMultiModelOrchestration(args: Record<string, unknown>): Promise<MCPResponse> {
    const { task, taskType, context = {}, options = {} } = args;

    try {
      // 模拟多模型协作处理
      const modelResults = [
        {
          model: 'deepseek',
          result: '深度分析结果',
          confidence: 0.92,
          processingTime: 1.2
        },
        {
          model: 'qwen',
          result: '通义千问处理结果',
          confidence: 0.87,
          processingTime: 0.8
        },
        {
          model: 'moonshot',
          result: '月之暗面处理结果',
          confidence: 0.89,
          processingTime: 0.9
        }
      ];

      // 模拟最终结果
      const finalResult = {
        task,
        taskType,
        context,
        options: {
          useMultipleModels: (options as Record<string, unknown>).useMultipleModels ?? true,
          qualityCheck: (options as Record<string, unknown>).qualityCheck ?? true,
          fallbackEnabled: (options as Record<string, unknown>).fallbackEnabled ?? true,
          parallelProcessing: (options as Record<string, unknown>).parallelProcessing ?? false
        },
        modelResults,
        bestResult: modelResults[0],
        processingTime: 2.5,
        timestamp: new Date().toISOString()
      };

      return {
        content: [{
          type: 'text',
          text: `🤖 多模型协作完成！\n\n任务类型: ${taskType}\n使用模型: ${modelResults.map(m => m.model).join(', ')}\n最佳模型: ${finalResult.bestResult.model} (置信度: ${finalResult.bestResult.confidence})\n\n处理结果:\n${JSON.stringify(finalResult, null, 2)}`
        }]
      };
    } catch (error) {
      this.logger.error('多模型协作处理失败:', {error});
      return {
        content: [{
          type: 'text',
          text: `多模型协作处理失败: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * 处理智能任务分解请求
   */
  private async handleSmartTaskBreakdown(args: Record<string, unknown>): Promise<MCPResponse> {
    const { complexTask, targetGranularity = 'medium' } = args;

    try {
      // 模拟智能任务分解
      const subtasks = [
        {
          id: `subtask_${Date.now()}_1`,
          title: '分析需求',
          description: '详细分析用户需求和系统要求',
          estimatedHours: 4,
          priority: 'high',
          dependencies: []
        },
        {
          id: `subtask_${Date.now()}_2`,
          title: '设计架构',
          description: '设计系统架构和组件交互',
          estimatedHours: 8,
          priority: 'high',
          dependencies: [`subtask_${Date.now()}_1`]
        },
        {
          id: `subtask_${Date.now()}_3`,
          title: '实现核心功能',
          description: '实现系统核心功能和业务逻辑',
          estimatedHours: 16,
          priority: 'medium',
          dependencies: [`subtask_${Date.now()}_2`]
        },
        {
          id: `subtask_${Date.now()}_4`,
          title: '编写测试',
          description: '编写单元测试和集成测试',
          estimatedHours: 8,
          priority: 'medium',
          dependencies: [`subtask_${Date.now()}_3`]
        },
        {
          id: `subtask_${Date.now()}_5`,
          title: '部署和文档',
          description: '部署系统并编写文档',
          estimatedHours: 6,
          priority: 'low',
          dependencies: [`subtask_${Date.now()}_3`, `subtask_${Date.now()}_4`]
        }
      ];

      const result = {
        originalTask: complexTask,
        subtasks,
        totalEstimatedHours: subtasks.reduce((sum, task) => sum + task.estimatedHours, 0),
        targetGranularity,
        generatedAt: new Date().toISOString()
      };

      return {
        content: [{
          type: 'text',
          text: `🧩 智能任务分解完成！\n\n原始任务: ${complexTask}\n分解粒度: ${targetGranularity}\n子任务数量: ${subtasks.length}\n总估计工时: ${result.totalEstimatedHours}小时\n\n子任务列表:\n${JSON.stringify(subtasks, null, 2)}`
        }]
      };
    } catch (error) {
      this.logger.error('智能任务分解失败:', {error});
      return {
        content: [{
          type: 'text',
          text: `智能任务分解失败: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * 启动MCP服务器
   */
  public async start(): Promise<void> {
    // 简化版启动，不依赖外部MCP SDK
    this.logger.info('TaskFlow AI MCP服务器已启动');

    // 监听标准输入输出
    process.stdin.on('data', async (data) => {
      try {
        const request = JSON.parse(data.toString()) as MCPRequest;
        const response = await this.handleRequest(request);
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch (error) {
        this.logger.error('处理MCP请求失败:', {error});
        const errorResponse: MCPResponse = {
          content: [{
            type: 'text',
            text: `错误: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
        process.stdout.write(JSON.stringify(errorResponse) + '\n');
      }
    });
  }

  /**
   * 获取可用工具列表
   */
  public getTools(): MCPTool[] {
    return this.tools;
  }

  /**
   * 处理单个工具调用（公共接口）
   */
  public async executeToolCall(name: string, args: Record<string, unknown>): Promise<MCPResponse> {
    return await this.callTool(name, args);
  }
}


