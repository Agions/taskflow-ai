/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * MCP (Model Context Protocol) 协议实现
 * 为AI编辑器提供标准化的MCP接口
 */

import { taskFlowService } from './index';

/**
 * MCP工具定义
 */
export const MCP_TOOLS = {
  // PRD解析相关工具
  parse_prd: {
    name: 'parse_prd',
    description: '解析PRD文档并生成任务计划',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'PRD文档内容'
        },
        fileType: {
          type: 'string',
          enum: ['markdown', 'text', 'docx', 'pdf'],
          description: '文件类型',
          default: 'markdown'
        },
        modelType: {
          type: 'string',
          enum: ['deepseek', 'qwen', 'wenxin', 'zhipu'],
          description: '使用的AI模型类型'
        },
        outputPath: {
          type: 'string',
          description: '任务计划输出路径（可选）'
        }
      },
      required: ['content']
    }
  },

  parse_prd_file: {
    name: 'parse_prd_file',
    description: '从文件解析PRD文档并生成任务计划',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'PRD文件路径'
        },
        modelType: {
          type: 'string',
          enum: ['deepseek', 'qwen', 'wenxin', 'zhipu'],
          description: '使用的AI模型类型'
        },
        outputPath: {
          type: 'string',
          description: '任务计划输出路径（可选）'
        }
      },
      required: ['filePath']
    }
  },

  // 任务管理相关工具
  get_all_tasks: {
    name: 'get_all_tasks',
    description: '获取所有任务',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  get_task_by_id: {
    name: 'get_task_by_id',
    description: '根据ID获取任务详情',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: '任务ID'
        }
      },
      required: ['id']
    }
  },

  get_next_tasks: {
    name: 'get_next_tasks',
    description: '获取下一个要处理的任务',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  update_task_status: {
    name: 'update_task_status',
    description: '更新任务状态',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: '任务ID'
        },
        status: {
          type: 'string',
          enum: ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'],
          description: '新的任务状态'
        }
      },
      required: ['id', 'status']
    }
  },

  // AI对话工具
  chat: {
    name: 'chat',
    description: '使用AI模型进行对话',
    inputSchema: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: {
                type: 'string',
                enum: ['user', 'assistant', 'system']
              },
              content: {
                type: 'string'
              }
            },
            required: ['role', 'content']
          },
          description: '对话消息数组'
        },
        modelType: {
          type: 'string',
          enum: ['deepseek', 'qwen', 'wenxin', 'zhipu'],
          description: '使用的AI模型类型'
        }
      },
      required: ['messages']
    }
  },

  // 配置管理工具
  get_config: {
    name: 'get_config',
    description: '获取当前配置',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  update_config: {
    name: 'update_config',
    description: '更新配置',
    inputSchema: {
      type: 'object',
      properties: {
        config: {
          type: 'object',
          description: '配置对象'
        },
        isProjectLevel: {
          type: 'boolean',
          description: '是否为项目级配置',
          default: false
        }
      },
      required: ['config']
    }
  },

  // 模型管理工具
  get_available_models: {
    name: 'get_available_models',
    description: '获取所有可用的AI模型',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  validate_model_key: {
    name: 'validate_model_key',
    description: '验证AI模型API密钥',
    inputSchema: {
      type: 'object',
      properties: {
        modelType: {
          type: 'string',
          enum: ['deepseek', 'qwen', 'wenxin', 'zhipu'],
          description: 'AI模型类型'
        }
      },
      required: ['modelType']
    }
  }
};

/**
 * MCP工具执行器
 */
export async function executeMCPTool(toolName: string, args: any) {
  try {
    switch (toolName) {
      case 'parse_prd':
        return await taskFlowService.parsePRD(args.content, args.fileType, {
          modelType: args.modelType,
          outputPath: args.outputPath
        });

      case 'parse_prd_file':
        return await taskFlowService.parsePRDFromFile(args.filePath, {
          modelType: args.modelType,
          outputPath: args.outputPath
        });

      case 'get_all_tasks':
        return taskFlowService.getAllTasks();

      case 'get_task_by_id':
        return taskFlowService.getTaskById(args.id);

      case 'get_next_tasks':
        return taskFlowService.getNextTasks();

      case 'update_task_status':
        return taskFlowService.updateTask(args.id, { status: args.status });

      case 'chat':
        return await taskFlowService.chat(args.messages, args.modelType);

      case 'get_config':
        return taskFlowService.getConfig();

      case 'update_config':
        return taskFlowService.updateConfig(args.config, args.isProjectLevel);

      case 'get_available_models':
        return taskFlowService.getAvailableModelTypes();

      case 'validate_model_key':
        return await taskFlowService.validateModelApiKey(args.modelType);

      default:
        return {
          success: false,
          error: `未知的MCP工具: ${toolName}`
        };
    }
  } catch (error) {
    return {
      success: false,
      error: `执行MCP工具失败: ${(error as Error).message}`
    };
  }
}

/**
 * 获取MCP工具列表
 */
export function getMCPTools() {
  return Object.values(MCP_TOOLS);
}

/**
 * MCP服务器信息
 */
export const MCP_SERVER_INFO = {
  name: 'TaskFlow AI',
  version: '1.2.0',
  description: 'TaskFlow AI - 智能PRD解析和任务管理助手',
  capabilities: {
    tools: true,
    resources: false,
    prompts: false
  }
};
