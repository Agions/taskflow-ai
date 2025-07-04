#!/usr/bin/env node

/**
 * TaskFlow AI MCP 服务
 * 符合标准 MCP (Model Context Protocol) 协议的可执行文件
 * 支持编辑器自动启动和 stdio 通信
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Logger } from '../infra/logger';
import { TaskFlowCore } from './taskflow-core';
import { MCPErrorHandler } from './error-handler';

/**
 * MCP 服务主类
 */
class TaskFlowMCPService {
  private server: Server;
  private logger: Logger;
  private taskflowCore: TaskFlowCore;
  private errorHandler: MCPErrorHandler;

  constructor() {
    this.logger = Logger.getInstance({
      level: 'info' as any,
      output: 'console'
    });
    this.taskflowCore = new TaskFlowCore(this.logger);
    this.errorHandler = new MCPErrorHandler(this.logger);
    
    // 初始化 MCP 服务器
    this.server = new Server(
      {
        name: 'taskflow-ai',
        version: '1.0.0'
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
          logging: {}
        }
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
    this.setupPromptHandlers();
    this.setupErrorHandling();
  }

  /**
   * 设置工具处理器
   */
  private setupToolHandlers(): void {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'prd-parse',
            description: '解析 PRD 文档并生成任务',
            inputSchema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'PRD 文档内容'
                },
                format: {
                  type: 'string',
                  enum: ['markdown', 'docx', 'pdf'],
                  description: '文档格式'
                },
                model: {
                  type: 'string',
                  enum: ['deepseek', 'zhipu', 'qwen', 'baidu', 'moonshot', 'spark'],
                  description: '使用的 AI 模型'
                }
              },
              required: ['content']
            }
          },
          {
            name: 'task-create',
            description: '创建新任务',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: '任务标题'
                },
                description: {
                  type: 'string',
                  description: '任务描述'
                },
                priority: {
                  type: 'string',
                  enum: ['high', 'medium', 'low'],
                  description: '任务优先级'
                },
                assignee: {
                  type: 'string',
                  description: '任务负责人'
                }
              },
              required: ['title', 'description']
            }
          },
          {
            name: 'task-list',
            description: '获取任务列表',
            inputSchema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['pending', 'in_progress', 'completed', 'cancelled'],
                  description: '任务状态过滤'
                },
                priority: {
                  type: 'string',
                  enum: ['high', 'medium', 'low'],
                  description: '优先级过滤'
                },
                assignee: {
                  type: 'string',
                  description: '负责人过滤'
                }
              }
            }
          },
          {
            name: 'code-analyze',
            description: '分析代码质量和结构',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: '要分析的代码'
                },
                language: {
                  type: 'string',
                  description: '编程语言'
                },
                analysisType: {
                  type: 'string',
                  enum: ['quality', 'structure', 'dependencies', 'security'],
                  description: '分析类型'
                }
              },
              required: ['code']
            }
          },
          {
            name: 'ai-query',
            description: '调用 AI 模型进行智能分析',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: '查询提示'
                },
                model: {
                  type: 'string',
                  enum: ['deepseek', 'zhipu', 'qwen', 'baidu', 'moonshot', 'spark'],
                  description: '使用的 AI 模型'
                },
                context: {
                  type: 'string',
                  description: '上下文信息'
                },
                temperature: {
                  type: 'number',
                  minimum: 0,
                  maximum: 2,
                  description: '生成温度'
                }
              },
              required: ['prompt']
            }
          }
        ]
      };
    });

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'prd-parse':
            return await this.handlePRDParse(args);
          
          case 'task-create':
            return await this.handleTaskCreate(args);
          
          case 'task-list':
            return await this.handleTaskList(args);
          
          case 'code-analyze':
            return await this.handleCodeAnalyze(args);
          
          case 'ai-query':
            return await this.handleAIQuery(args);
          
          default:
            throw new Error(`未知的工具: ${name}`);
        }
      } catch (error) {
        this.logger.error(`工具调用失败 [${name}]:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `错误: ${(error as Error).message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  /**
   * 处理 PRD 解析
   */
  private async handlePRDParse(args: any) {
    const { content, format = 'markdown', model = 'zhipu' } = args;
    
    this.logger.info(`解析 PRD 文档 [${format}] 使用模型 [${model}]`);
    
    const result = await this.taskflowCore.parsePRD(content, format, model);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  /**
   * 处理任务创建
   */
  private async handleTaskCreate(args: any) {
    const { title, description, priority = 'medium', assignee } = args;
    
    this.logger.info(`创建任务: ${title}`);
    
    const task = await this.taskflowCore.createTask({
      title,
      description,
      priority,
      assignee
    });
    
    return {
      content: [
        {
          type: 'text',
          text: `任务创建成功: ${task.id}`
        }
      ]
    };
  }

  /**
   * 处理任务列表查询
   */
  private async handleTaskList(args: any) {
    const { status, priority, assignee } = args;
    
    this.logger.info('获取任务列表');
    
    const tasks = await this.taskflowCore.getTasks({
      status,
      priority,
      assignee
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(tasks, null, 2)
        }
      ]
    };
  }

  /**
   * 处理代码分析
   */
  private async handleCodeAnalyze(args: any) {
    const { code, language, analysisType = 'quality' } = args;
    
    this.logger.info(`分析代码 [${language}] 类型 [${analysisType}]`);
    
    const analysis = await this.taskflowCore.analyzeCode(code, language, analysisType);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2)
        }
      ]
    };
  }

  /**
   * 处理 AI 查询
   */
  private async handleAIQuery(args: any) {
    const { prompt, model = 'auto', context, temperature = 0.7 } = args;
    
    this.logger.info(`AI 查询使用模型 [${model}]`);
    
    const response = await this.taskflowCore.queryAI(prompt, {
      model,
      context,
      temperature
    });
    
    return {
      content: [
        {
          type: 'text',
          text: response
        }
      ]
    };
  }

  /**
   * 设置资源处理器
   */
  private setupResourceHandlers(): void {
    // 这里可以添加资源处理逻辑
    // 例如：项目文件、配置文件等
  }

  /**
   * 设置提示处理器
   */
  private setupPromptHandlers(): void {
    // 这里可以添加提示模板处理逻辑
    // 例如：代码生成模板、任务模板等
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    // 这个方法在构造函数中被调用，用于设置错误处理逻辑
    // 实际的错误处理在 main 函数中设置
  }

  /**
   * 处理工具调用错误
   */
  private async handleToolError(error: Error, toolName: string, args: any): Promise<any> {
    const mcpError = this.errorHandler.handleError(error, {
      tool: toolName,
      arguments: args,
      timestamp: new Date().toISOString()
    });

    const recovery = this.errorHandler.getRecoveryStrategy(mcpError);
    const userError = this.errorHandler.generateUserFriendlyError(mcpError);

    // 如果可以恢复，尝试恢复策略
    if (recovery.canRecover && recovery.fallbackAction) {
      try {
        this.logger.info(`尝试恢复策略: ${toolName}`);
        const result = await recovery.fallbackAction();
        return {
          success: true,
          data: result,
          warning: userError.message
        };
      } catch (fallbackError) {
        this.logger.error('恢复策略失败:', fallbackError);
      }
    }

    // 返回用户友好的错误信息
    return {
      success: false,
      error: {
        type: mcpError.type,
        title: userError.title,
        message: userError.message,
        suggestion: userError.suggestion,
        actionRequired: userError.actionRequired,
        helpUrl: userError.helpUrl,
        canRetry: recovery.retryable,
        maxRetries: recovery.maxRetries
      }
    };
  }

  /**
   * 启动 MCP 服务
   */
  public async start(): Promise<void> {
    try {
      // 初始化 TaskFlow 核心
      await this.taskflowCore.initialize();

      // 创建 stdio 传输
      const transport = new StdioServerTransport();

      // 连接服务器
      await this.server.connect(transport);

      this.logger.info('TaskFlow MCP 服务已启动');

    } catch (error) {
      const mcpError = this.errorHandler.handleError(error as Error, {
        source: 'service_startup',
        timestamp: new Date().toISOString()
      });

      const userError = this.errorHandler.generateUserFriendlyError(mcpError);
      this.logger.error('TaskFlow MCP 服务启动失败:', {
        error: mcpError,
        userMessage: userError
      });

      console.error(`❌ ${userError.title}: ${userError.message}`);
      console.error(`💡 建议: ${userError.suggestion}`);
      if (userError.helpUrl) {
        console.error(`📖 帮助: ${userError.helpUrl}`);
      }

      process.exit(1);
    }
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const service = new TaskFlowMCPService();
  await service.start();
}

// 全局错误处理
const globalErrorHandler = new MCPErrorHandler(Logger.getInstance({
  level: 'info' as any,
  output: 'console'
}));

process.on('uncaughtException', (error) => {
  const mcpError = globalErrorHandler.handleError(error, {
    source: 'uncaughtException',
    timestamp: new Date().toISOString()
  });

  const userError = globalErrorHandler.generateUserFriendlyError(mcpError);
  console.error(`❌ ${userError.title}: ${userError.message}`);
  console.error(`💡 建议: ${userError.suggestion}`);

  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  const mcpError = globalErrorHandler.handleError(error, {
    source: 'unhandledRejection',
    promise: promise.toString(),
    timestamp: new Date().toISOString()
  });

  const userError = globalErrorHandler.generateUserFriendlyError(mcpError);
  console.error(`❌ ${userError.title}: ${userError.message}`);
  console.error(`💡 建议: ${userError.suggestion}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('🛑 收到 SIGINT 信号，正在优雅关闭服务...');

  // 生成错误统计报告
  const errorStats = globalErrorHandler.getErrorStats();
  if (errorStats.totalErrors > 0) {
    console.log('📊 错误统计:', {
      总错误数: errorStats.totalErrors,
      错误率: errorStats.errorRate
    });
  }

  console.log('✅ TaskFlow MCP 服务已关闭');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 收到 SIGTERM 信号，正在优雅关闭服务...');
  process.exit(0);
});

// 启动服务
if (require.main === module) {
  main().catch((error) => {
    console.error('服务启动失败:', error);
    process.exit(1);
  });
}
