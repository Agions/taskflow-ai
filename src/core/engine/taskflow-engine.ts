/**
 * TaskFlow AI 核心引擎
 * 负责协调PRD解析、任务编排和管理的核心逻辑
 */

import { Logger } from '../../infra/logger';
import { ConfigManager } from '../../infra/config';
import { ModelCoordinator } from '../models/coordinator';
import { PRDParser } from '../parser/prd-parser';
import { TaskPlanner } from '../planner/task-planner';
import { TaskManager } from '../task/task-manager';
import { Task, TaskPlan, ParsedPRD, TaskStatus } from '../../types/task';
import { PlanningOptions, ParseOptions } from '../../types/model';

/**
 * 引擎配置接口
 */
export interface EngineConfig {
  autoSave?: boolean;
  saveInterval?: number;
  outputDir?: string;
  defaultModel?: string;
  enableOptimization?: boolean;
}





/**
 * 引擎执行结果
 */
export interface EngineResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  warnings?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * TaskFlow AI 核心引擎类
 */
export class TaskFlowEngine {
  private logger: Logger;
  private configManager: ConfigManager;
  private modelCoordinator: ModelCoordinator;
  private prdParser: PRDParser;
  private taskPlanner: TaskPlanner;
  private taskManager: TaskManager;
  private config: EngineConfig;

  /**
   * 创建TaskFlow引擎实例
   */
  constructor(
    logger: Logger,
    configManager: ConfigManager,
    modelCoordinator: ModelCoordinator
  ) {
    this.logger = logger;
    this.configManager = configManager;
    this.modelCoordinator = modelCoordinator;

    // 加载引擎配置
    this.config = this.configManager.get('engine', {
      autoSave: true,
      saveInterval: 300,
      outputDir: './taskflow',
      defaultModel: 'deepseek',
      enableOptimization: true
    });

    // 初始化核心组件
    this.prdParser = new PRDParser(this.modelCoordinator, this.logger);
    this.taskPlanner = new TaskPlanner(this.modelCoordinator, this.logger);
    this.taskManager = new TaskManager(this.logger, this.configManager);

    this.logger.info('TaskFlow AI 引擎初始化完成');
  }

  /**
   * 从PRD文件解析并生成完整的任务计划
   * @param prdFilePath PRD文件路径
   * @param parseOptions 解析选项
   * @param planningOptions 规划选项
   */
  public async processFromPRD(
    prdFilePath: string,
    parseOptions?: ParseOptions,
    planningOptions?: PlanningOptions
  ): Promise<EngineResult<TaskPlan>> {
    try {
      this.logger.info(`开始处理PRD文件: ${prdFilePath}`);

      // 第一步：解析PRD文档
      const parseResult = await this.parsePRD(prdFilePath, parseOptions);
      if (!parseResult.success || !parseResult.data) {
        return {
          success: false,
          message: 'PRD解析失败',
          errors: parseResult.errors
        };
      }

      // 第二步：生成任务计划
      const planResult = await this.generateTaskPlan(parseResult.data, planningOptions);
      if (!planResult.success || !planResult.data) {
        return {
          success: false,
          message: '任务计划生成失败',
          errors: planResult.errors
        };
      }

      // 第三步：优化任务计划
      if (this.config.enableOptimization) {
        const optimizeResult = await this.optimizeTaskPlan(planResult.data, planningOptions);
        if (optimizeResult.success && optimizeResult.data) {
          planResult.data = optimizeResult.data;
        }
      }

      // 第四步：设置任务管理器
      this.taskManager.setTaskPlan(planResult.data);

      // 第五步：保存任务计划
      if (this.config.autoSave) {
        await this.taskManager.saveTaskPlan();
      }

      this.logger.info('PRD处理完成，任务计划已生成');

      return {
        success: true,
        data: planResult.data,
        message: `成功生成包含 ${planResult.data.tasks.length} 个任务的计划`,
        metadata: {
          prdFile: prdFilePath,
          tasksCount: planResult.data.tasks.length,
          processedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      this.logger.error(`处理PRD失败: ${(error as Error).message}`);
      return {
        success: false,
        message: '处理PRD时发生错误',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * 解析PRD文档
   * @param prdFilePath PRD文件路径
   * @param options 解析选项
   */
  public async parsePRD(
    prdFilePath: string,
    options?: ParseOptions
  ): Promise<EngineResult<ParsedPRD>> {
    try {
      this.logger.info(`开始解析PRD: ${prdFilePath}`);

      const result = await this.prdParser.parseFromFile(prdFilePath, options);

      return {
        success: true,
        data: result,
        message: 'PRD解析成功'
      };

    } catch (error) {
      this.logger.error(`PRD解析失败: ${(error as Error).message}`);
      return {
        success: false,
        message: 'PRD解析失败',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * 生成任务计划
   * @param prdData 解析后的PRD数据
   * @param options 规划选项
   */
  public async generateTaskPlan(
    prdData: ParsedPRD,
    options?: PlanningOptions
  ): Promise<EngineResult<TaskPlan>> {
    try {
      this.logger.info('开始生成任务计划');

      const result = await this.taskPlanner.generateTaskPlan(prdData, options);

      return {
        success: true,
        data: result,
        message: `任务计划生成成功，包含 ${result.tasks.length} 个任务`
      };

    } catch (error) {
      this.logger.error(`任务计划生成失败: ${(error as Error).message}`);
      return {
        success: false,
        message: '任务计划生成失败',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * 优化任务计划
   * @param taskPlan 原始任务计划
   * @param options 优化选项
   */
  public async optimizeTaskPlan(
    taskPlan: TaskPlan,
    options?: PlanningOptions
  ): Promise<EngineResult<TaskPlan>> {
    try {
      this.logger.info('开始优化任务计划');

      // 使用AI模型优化任务顺序和依赖关系
      const optimizedPlan = await this.taskPlanner.optimizeTaskPlan(taskPlan, options);

      return {
        success: true,
        data: optimizedPlan,
        message: '任务计划优化完成'
      };

    } catch (error) {
      this.logger.error(`任务计划优化失败: ${(error as Error).message}`);
      return {
        success: false,
        message: '任务计划优化失败',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * 获取当前任务计划
   */
  public getCurrentTaskPlan(): TaskPlan | null {
    return this.taskManager.getTaskPlan();
  }

  /**
   * 获取推荐的下一个任务
   */
  public getRecommendedTasks(): Task[] {
    return this.taskManager.getNextTasks();
  }

  /**
   * 更新任务状态
   * @param taskId 任务ID
   * @param status 新状态
   */
  public async updateTaskStatus(taskId: string, status: string): Promise<EngineResult<Task>> {
    try {
      const task = this.taskManager.updateTask(taskId, { status: status as TaskStatus });

      if (!task) {
        return {
          success: false,
          message: `任务 ${taskId} 不存在`
        };
      }

      // 自动保存
      if (this.config.autoSave) {
        await this.taskManager.saveTaskPlan();
      }

      return {
        success: true,
        data: task,
        message: `任务 ${taskId} 状态已更新为 ${status}`
      };

    } catch (error) {
      this.logger.error(`更新任务状态失败: ${(error as Error).message}`);
      return {
        success: false,
        message: '更新任务状态失败',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * 获取项目进度统计
   */
  public getProgressStats(): {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    blocked: number;
    completionRate: number;
  } {
    const taskPlan = this.taskManager.getTaskPlan();
    if (!taskPlan) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        blocked: 0,
        completionRate: 0
      };
    }

    const stats = {
      total: taskPlan.tasks.length,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      blocked: 0,
      completionRate: 0
    };

    taskPlan.tasks.forEach(task => {
      switch (task.status) {
        case 'completed':
          stats.completed++;
          break;
        case 'in_progress':
          stats.inProgress++;
          break;
        case 'not_started':
          stats.notStarted++;
          break;
        case 'blocked':
          stats.blocked++;
          break;
      }
    });

    stats.completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    return stats;
  }

  /**
   * 销毁引擎，清理资源
   */
  public destroy(): void {
    this.taskManager.destroy();
    this.logger.info('TaskFlow AI 引擎已销毁');
  }
}
