/* eslint-disable @typescript-eslint/no-explicit-any */
import { yasiService } from './index';
import { FileType, ModelCallOptions } from '../types/model';
import { ModelType } from '../types/config';
import { executeMCPTool, getMCPTools, MCP_SERVER_INFO } from './protocol';

/**
 * MCP接口函数
 * 为AI编辑器提供标准化接口
 */

/**
 * 执行MCP工具
 * @param toolName 工具名称
 * @param args 工具参数
 */
export async function executeTool(toolName: string, args: any) {
  return await executeMCPTool(toolName, args);
}

/**
 * 获取所有可用的MCP工具
 */
export function getTools() {
  return getMCPTools();
}

/**
 * 获取MCP服务器信息
 */
export function getServerInfo() {
  return MCP_SERVER_INFO;
}

/**
 * 从文本解析PRD并生成任务
 * @param text PRD文本内容
 * @param options 解析选项
 */
export async function parsePRD(text: string, options?: any) {
  const fileType = options?.fileType || FileType.MARKDOWN;
  const parseOptions = {
    modelType: options?.modelType,
    extractSections: options?.extractSections !== false,
    extractFeatures: options?.extractFeatures !== false,
    prioritize: options?.prioritize !== false,
  };

  try {
    // 解析PRD
    const parseResult = await yasiService.parsePRD(text, fileType, parseOptions);
    if (!parseResult.success) {
      return { error: parseResult.error };
    }

    // 生成任务计划
    const planOptions = {
      modelType: options?.modelType,
      taskTemplate: options?.taskTemplate,
      estimateDuration: options?.estimateDuration,
      assignTasks: options?.assignTasks,
    };
    const planResult = await yasiService.generateTaskPlan(parseResult.data, planOptions);
    if (!planResult.success) {
      return { error: planResult.error };
    }

    // 保存任务计划（如果指定了输出路径）
    if (options?.outputPath) {
      const saveResult = await yasiService.saveTaskPlan(planResult.data, options.outputPath);
      if (!saveResult.success) {
        return { error: saveResult.error };
      }
    }

    return {
      success: true,
      data: {
        prd: parseResult.data,
        taskPlan: planResult.data
      }
    };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/**
 * 从文件解析PRD并生成任务
 * @param filePath PRD文件路径
 * @param options 解析选项
 */
export async function parsePRDFromFile(filePath: string, options?: any) {
  try {
    // 解析PRD文件
    const parseResult = await yasiService.parsePRDFromFile(filePath, {
      modelType: options?.modelType,
      extractSections: options?.extractSections !== false,
      extractFeatures: options?.extractFeatures !== false,
      prioritize: options?.prioritize !== false,
    });

    if (!parseResult.success) {
      return { error: parseResult.error };
    }

    // 生成任务计划
    const planOptions = {
      modelType: options?.modelType,
      taskTemplate: options?.taskTemplate,
      estimateDuration: options?.estimateDuration,
      assignTasks: options?.assignTasks,
    };
    const planResult = await yasiService.generateTaskPlan(parseResult.data, planOptions);
    if (!planResult.success) {
      return { error: planResult.error };
    }

    // 保存任务计划（如果指定了输出路径）
    if (options?.outputPath) {
      const saveResult = await yasiService.saveTaskPlan(planResult.data, options.outputPath);
      if (!saveResult.success) {
        return { error: saveResult.error };
      }
    }

    return {
      success: true,
      data: {
        prd: parseResult.data,
        taskPlan: planResult.data
      }
    };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/**
 * 获取所有任务
 */
export async function getAllTasks() {
  return yasiService.getAllTasks();
}

/**
 * 根据ID获取任务
 * @param id 任务ID
 */
export async function getTaskById(id: string) {
  return yasiService.getTaskById(id);
}

/**
 * 获取下一个要处理的任务
 */
export async function getNextTasks() {
  return yasiService.getNextTasks();
}

/**
 * 更新任务状态
 * @param id 任务ID
 * @param status 新状态
 */
export async function updateTaskStatus(id: string, status: string) {
  return yasiService.updateTask(id, { status: status as any });
}

/**
 * 使用聊天模型进行对话
 * @param messages 消息数组
 * @param modelType 模型类型
 * @param options 调用选项
 */
export async function chat(messages: any[], modelType?: ModelType, options?: ModelCallOptions) {
  return yasiService.chat(messages, modelType, options);
}

/**
 * 获取所有可用的模型类型
 */
export async function getAvailableModelTypes() {
  return yasiService.getAvailableModelTypes();
}

/**
 * 验证模型API密钥
 * @param modelType 模型类型
 */
export async function validateModelApiKey(modelType: ModelType) {
  return yasiService.validateModelApiKey(modelType);
}

/**
 * 更新配置
 * @param config 配置对象
 * @param isProjectLevel 是否为项目级配置
 */
export async function updateConfig(config: any, isProjectLevel = false) {
  return yasiService.updateConfig(config, isProjectLevel);
}

/**
 * 获取配置
 */
export async function getConfig() {
  return yasiService.getConfig();
}

/**
 * 根据PRD解析结果生成任务计划
 * @param prdResult PRD解析结果
 * @param options 规划选项
 */
export async function generateTaskPlan(prdResult: any, options?: any) {
  try {
    const planResult = await yasiService.generateTaskPlan(prdResult, {
      modelType: options?.modelType,
      taskTemplate: options?.taskTemplate,
      estimateDuration: options?.estimateDuration,
      assignTasks: options?.assignTasks,
    });

    if (!planResult.success) {
      return { error: planResult.error };
    }

    return {
      success: true,
      data: planResult.data
    };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/**
 * 生成测试用例
 * @param taskDescription 任务描述
 * @param options 测试生成选项
 */
export async function generateTests(taskDescription: string, options?: any) {
  try {
    const modelCoordinator = yasiService['modelCoordinator'];
    const response = await modelCoordinator.generateTests(taskDescription, {
      modelType: options?.modelType,
      framework: options?.framework || 'jest',
      coverage: options?.coverage !== false,
      includeEdgeCases: options?.includeEdgeCases !== false,
      mockDependencies: options?.mockDependencies !== false,
    });

    return { success: true, data: response };
  } catch (error) {
    return { error: (error as Error).message };
  }
}