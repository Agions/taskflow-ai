/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SimpleConfigManager } from '../infra/simple-config';
import { Logger } from '../infra/logger';
import { ModelCoordinator } from '../core/models/coordinator';
import { PRDParser } from '../core/parser/prd-parser';
import { TaskPlanner } from '../core/planner/task-planner';
import { TaskManager } from '../core/task/task-manager';
import { FileType, ParseOptions, PlanningOptions } from '../types/model';
import { TaskFilter, TaskUpdateData } from '../core/task/task-manager';
import { LogLevel, ModelType } from '../types/config';

/**
 * TaskFlow AI MCP 服务类
 */
export class TaskFlowService {
  private configManager: SimpleConfigManager;
  private logger: Logger;
  private modelCoordinator: ModelCoordinator;
  private prdParser: PRDParser;
  private taskPlanner: TaskPlanner;
  private taskManager: TaskManager;

  /**
   * 创建TaskFlow AI MCP服务实例
   */
  constructor() {
    // 初始化基础设施
    this.configManager = new SimpleConfigManager();
    this.logger = Logger.getInstance({
      level: this.configManager.get('logger.level', LogLevel.INFO),
      output: this.configManager.get('logger.output', 'console'),
      file: this.configManager.get('logger.file')
    });

    // 初始化核心服务
    this.modelCoordinator = new ModelCoordinator(this.configManager as any);
    this.prdParser = new PRDParser(this.modelCoordinator, this.logger);
    this.taskPlanner = new TaskPlanner(this.modelCoordinator, this.logger);
    this.taskManager = new TaskManager(this.logger, this.configManager as any);

    this.logger.info('TaskFlow AI MCP服务初始化完成');
  }

  /**
   * 解析PRD文档内容
   * @param content PRD文档内容
   * @param fileType 文件类型
   * @param options 解析选项
   */
  public async parsePRD(content: string, fileType: FileType = FileType.MARKDOWN, options?: ParseOptions) {
    try {
      this.logger.info('开始解析PRD内容');
      const result = await this.prdParser.parseContent(content, fileType, options);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`解析PRD内容失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 从文件解析PRD
   * @param filePath PRD文件路径
   * @param options 解析选项
   */
  public async parsePRDFromFile(filePath: string, options?: ParseOptions) {
    try {
      this.logger.info(`开始解析PRD文件: ${filePath}`);
      const result = await this.prdParser.parseFromFile(filePath, options);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`解析PRD文件失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 根据PRD生成任务计划
   * @param prdResult PRD解析结果
   * @param options 规划选项
   */
  public async generateTaskPlan(prdResult: any, options?: PlanningOptions) {
    try {
      this.logger.info('开始生成任务计划');
      const taskPlan = await this.taskPlanner.generateTaskPlan(prdResult, options);
      return { success: true, data: taskPlan };
    } catch (error) {
      this.logger.error(`生成任务计划失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 保存任务计划
   * @param taskPlan 任务计划
   * @param outputPath 输出路径
   */
  public async saveTaskPlan(taskPlan: any, outputPath: string) {
    try {
      await this.taskPlanner.saveTaskPlan(taskPlan, outputPath);
      // 同时更新任务管理器的任务计划
      this.taskManager.setTaskPlan(taskPlan);
      return { success: true };
    } catch (error) {
      this.logger.error(`保存任务计划失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 加载任务计划
   * @param filePath 任务计划文件路径
   */
  public async loadTaskPlan(filePath: string) {
    try {
      const taskPlan = await this.taskManager.loadTaskPlan(filePath);
      return { success: true, data: taskPlan };
    } catch (error) {
      this.logger.error(`加载任务计划失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 获取所有任务
   */
  public getAllTasks() {
    try {
      const tasks = this.taskManager.getAllTasks();
      return { success: true, data: tasks };
    } catch (error) {
      this.logger.error(`获取所有任务失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 根据ID获取任务
   * @param id 任务ID
   */
  public getTaskById(id: string) {
    try {
      const task = this.taskManager.getTaskById(id);
      if (!task) {
        return { success: false, error: `任务 ${id} 不存在` };
      }
      return { success: true, data: task };
    } catch (error) {
      this.logger.error(`获取任务失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 过滤任务
   * @param filter 过滤条件
   */
  public filterTasks(filter: TaskFilter) {
    try {
      const tasks = this.taskManager.filterTasks(filter);
      return { success: true, data: tasks };
    } catch (error) {
      this.logger.error(`过滤任务失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 更新任务
   * @param id 任务ID
   * @param data 更新数据
   */
  public updateTask(id: string, data: TaskUpdateData) {
    try {
      const task = this.taskManager.updateTask(id, data);
      if (!task) {
        return { success: false, error: `任务 ${id} 不存在` };
      }
      return { success: true, data: task };
    } catch (error) {
      this.logger.error(`更新任务失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 获取下一个要处理的任务
   */
  public getNextTasks() {
    try {
      const tasks = this.taskManager.getNextTasks();
      return { success: true, data: tasks };
    } catch (error) {
      this.logger.error(`获取下一个任务失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 使用聊天模型进行对话
   * @param messages 消息数组
   * @param modelType 模型类型
   * @param options 调用选项
   */
  public async chat(messages: any[], modelType?: ModelType, options?: any) {
    try {
      const response = await this.modelCoordinator.chat(messages, modelType, options);
      return { success: true, data: response };
    } catch (error) {
      this.logger.error(`聊天请求失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 获取所有可用的模型类型
   */
  public getAvailableModelTypes() {
    try {
      const modelTypes = this.modelCoordinator.getAvailableModelTypes();
      return { success: true, data: modelTypes };
    } catch (error) {
      this.logger.error(`获取可用模型类型失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 验证指定类型模型的API密钥
   * @param modelType 模型类型
   */
  public async validateModelApiKey(modelType: ModelType) {
    try {
      const isValid = await this.modelCoordinator.validateModelApiKey(modelType);
      return { success: true, data: { valid: isValid } };
    } catch (error) {
      this.logger.error(`验证模型API密钥失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 更新配置
   * @param config 配置对象
   * @param isProjectLevel 是否为项目级配置
   */
  public updateConfig(config: any, isProjectLevel = false) {
    try {
      this.configManager.updateConfig(config, isProjectLevel);

      // 更新日志配置
      if (config.logger) {
        this.logger.updateConfig({
          level: this.configManager.get('logger.level', LogLevel.INFO),
          output: this.configManager.get('logger.output', 'console'),
          file: this.configManager.get('logger.file')
        });
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`更新配置失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 获取完整配置
   */
  public getConfig() {
    try {
      const config = this.configManager.getConfig();
      // 移除敏感信息
      const safeConfig = { ...config };
      if (safeConfig.models) {
        Object.keys(safeConfig.models).forEach(key => {
          if (key !== 'default' && safeConfig.models[key as keyof typeof safeConfig.models]) {
            const modelConfig = safeConfig.models[key as keyof typeof safeConfig.models] as any;
            if (modelConfig && modelConfig.apiKey) {
              modelConfig.apiKey = '******';
            }
            if (modelConfig && modelConfig.secretKey) {
              modelConfig.secretKey = '******';
            }
          }
        });
      }
      return { success: true, data: safeConfig };
    } catch (error) {
      this.logger.error(`获取配置失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 获取任务状态概览
   */
  public getTaskStatus() {
    try {
      const allTasks = this.taskManager.getAllTasks();
      const stats = {
        total: allTasks.length,
        pending: allTasks.filter(t => t.status === 'pending').length,
        in_progress: allTasks.filter(t => t.status === 'in_progress').length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        cancelled: allTasks.filter(t => t.status === 'cancelled').length
      };
      return { success: true, data: stats };
    } catch (error) {
      this.logger.error(`获取任务状态失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 更新任务状态
   * @param taskId 任务ID
   * @param status 新状态
   * @param data 额外数据
   */
  public updateTaskStatus(taskId: string, status: string, data?: any) {
    try {
      const updateData: TaskUpdateData = { status: status as any };
      if (data) {
        Object.assign(updateData, data);
      }
      const task = this.taskManager.updateTask(taskId, updateData);
      if (!task) {
        return { success: false, error: `任务 ${taskId} 不存在` };
      }
      return { success: true, data: task };
    } catch (error) {
      this.logger.error(`更新任务状态失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 获取推荐任务
   */
  public getRecommendedTask() {
    try {
      const nextTasks = this.taskManager.getNextTasks();
      const recommendedTask = nextTasks.length > 0 ? nextTasks[0] : null;
      return { success: true, data: recommendedTask };
    } catch (error) {
      this.logger.error(`获取推荐任务失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 生成可视化
   * @param type 可视化类型
   * @param options 选项
   */
  public async generateVisualization(type: string, options?: any) {
    try {
      // 这里应该调用可视化模块，暂时返回模拟数据
      const visualization = {
        type,
        data: this.taskManager.getAllTasks(),
        options,
        generatedAt: new Date().toISOString()
      };
      return { success: true, data: visualization };
    } catch (error) {
      this.logger.error(`生成可视化失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  // Project Management Methods

  /**
   * 创建项目
   * @param projectData 项目数据
   */
  public async createProject(projectData: any) {
    try {
      // 模拟项目创建逻辑
      const project = {
        id: `project_${Date.now()}`,
        ...projectData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };
      return { success: true, data: project };
    } catch (error) {
      this.logger.error(`创建项目失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 获取项目列表
   * @param options 查询选项
   */
  public async getProjects(options?: any) {
    try {
      // 模拟项目列表
      const projects = [
        {
          id: 'project_1',
          name: '示例项目',
          description: '这是一个示例项目',
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ];
      return { success: true, data: projects };
    } catch (error) {
      this.logger.error(`获取项目列表失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 获取项目详情
   * @param id 项目ID
   */
  public async getProject(id: string) {
    try {
      // 模拟项目详情
      const project = {
        id,
        name: '示例项目',
        description: '这是一个示例项目',
        status: 'active',
        createdAt: new Date().toISOString(),
        tasks: this.taskManager.getAllTasks()
      };
      return { success: true, data: project };
    } catch (error) {
      this.logger.error(`获取项目详情失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 更新项目
   * @param id 项目ID
   * @param updateData 更新数据
   */
  public async updateProject(id: string, updateData: any) {
    try {
      const project = {
        id,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      return { success: true, data: project };
    } catch (error) {
      this.logger.error(`更新项目失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 删除项目
   * @param id 项目ID
   */
  public async deleteProject(id: string) {
    try {
      return { success: true, message: `项目 ${id} 已删除` };
    } catch (error) {
      this.logger.error(`删除项目失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 获取项目任务
   * @param id 项目ID
   * @param options 查询选项
   */
  public async getProjectTasks(id: string, options?: any) {
    try {
      const tasks = this.taskManager.getAllTasks();
      return { success: true, data: tasks };
    } catch (error) {
      this.logger.error(`获取项目任务失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 获取项目统计
   * @param id 项目ID
   */
  public async getProjectStats(id: string) {
    try {
      const tasks = this.taskManager.getAllTasks();
      const stats = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
        pendingTasks: tasks.filter(t => t.status === 'pending').length
      };
      return { success: true, data: stats };
    } catch (error) {
      this.logger.error(`获取项目统计失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  // AI Controller Methods

  /**
   * 生成任务
   * @param req 请求对象
   * @param res 响应对象
   */
  public async generateTasks(req: any, res: any) {
    try {
      const { requirements, options } = req.body;
      // 模拟任务生成
      const tasks = [
        {
          id: `task_${Date.now()}`,
          title: '示例任务',
          description: '基于需求生成的示例任务',
          status: 'pending',
          priority: 'medium'
        }
      ];
      return { success: true, data: tasks };
    } catch (error) {
      this.logger.error(`生成任务失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 编排任务
   * @param req 请求对象
   * @param res 响应对象
   */
  public async orchestrateTasks(req: any, res: any) {
    try {
      const { tasks, options } = req.body;
      // 模拟任务编排
      const orchestratedTasks = tasks.map((task: any, index: number) => ({
        ...task,
        order: index + 1,
        dependencies: index > 0 ? [tasks[index - 1].id] : []
      }));
      return { success: true, data: orchestratedTasks };
    } catch (error) {
      this.logger.error(`编排任务失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 生成文档
   * @param req 请求对象
   * @param res 响应对象
   */
  public async generateDocuments(req: any, res: any) {
    try {
      const { type, content, options } = req.body;
      // 模拟文档生成
      const document = {
        type,
        content: `生成的${type}文档内容`,
        generatedAt: new Date().toISOString()
      };
      return { success: true, data: document };
    } catch (error) {
      this.logger.error(`生成文档失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 生成图表
   * @param req 请求对象
   * @param res 响应对象
   */
  public async generateCharts(req: any, res: any) {
    try {
      const { type, data, options } = req.body;
      // 模拟图表生成
      const chart = {
        type,
        data: data || this.taskManager.getAllTasks(),
        options,
        generatedAt: new Date().toISOString()
      };
      return { success: true, data: chart };
    } catch (error) {
      this.logger.error(`生成图表失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 聊天流式响应
   * @param req 请求对象
   * @param res 响应对象
   */
  public async chatStream(req: any, res: any) {
    try {
      const { message, context } = req.body;
      // 模拟流式响应
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked'
      });

      const response = `AI回复: ${message}`;
      res.write(response);
      res.end();
    } catch (error) {
      this.logger.error(`聊天流式响应失败: ${(error as Error).message}`);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  /**
   * 获取模型列表
   * @param req 请求对象
   * @param res 响应对象
   */
  public async getModels(req: any, res: any) {
    try {
      const models = this.modelCoordinator.getAvailableModelTypes();
      return { success: true, data: models };
    } catch (error) {
      this.logger.error(`获取模型列表失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 获取模型状态
   * @param req 请求对象
   * @param res 响应对象
   */
  public async getModelStatus(req: any, res: any) {
    try {
      const { modelType } = req.params;
      const isValid = await this.modelCoordinator.validateModelApiKey(modelType);
      return { success: true, data: { modelType, status: isValid ? 'active' : 'inactive' } };
    } catch (error) {
      this.logger.error(`获取模型状态失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 验证需求
   * @param req 请求对象
   * @param res 响应对象
   */
  public async validateRequirements(req: any, res: any) {
    try {
      const { requirements } = req.body;
      // 模拟需求验证
      const validation = {
        valid: true,
        issues: [],
        suggestions: ['建议添加更多细节']
      };
      return { success: true, data: validation };
    } catch (error) {
      this.logger.error(`验证需求失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 估算工作量
   * @param req 请求对象
   * @param res 响应对象
   */
  public async estimateEffort(req: any, res: any) {
    try {
      const { tasks } = req.body;
      // 模拟工作量估算
      const estimation = {
        totalHours: tasks.length * 8,
        breakdown: tasks.map((task: any) => ({
          taskId: task.id,
          estimatedHours: 8
        }))
      };
      return { success: true, data: estimation };
    } catch (error) {
      this.logger.error(`估算工作量失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 获取使用统计
   * @param req 请求对象
   * @param res 响应对象
   */
  public async getUsageStats(req: any, res: any) {
    try {
      const stats = {
        totalRequests: 100,
        successfulRequests: 95,
        failedRequests: 5,
        averageResponseTime: 1.2
      };
      return { success: true, data: stats };
    } catch (error) {
      this.logger.error(`获取使用统计失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 归档项目
   * @param req 请求对象
   * @param res 响应对象
   */
  public async archiveProject(req: any, res: any) {
    try {
      const { id } = req.params;
      const project = {
        id,
        status: 'archived',
        archivedAt: new Date().toISOString()
      };
      return { success: true, data: project };
    } catch (error) {
      this.logger.error(`归档项目失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 恢复项目
   * @param id 项目ID
   */
  public async restoreProject(id: string): Promise<any>;
  /**
   * 恢复项目
   * @param req 请求对象
   * @param res 响应对象
   */
  public async restoreProject(req: any, res: any): Promise<any>;
  public async restoreProject(idOrReq: string | any, res?: any) {
    try {
      let id: string;
      if (typeof idOrReq === 'string') {
        id = idOrReq;
      } else {
        id = idOrReq.params.id;
      }

      const project = {
        id,
        status: 'active',
        restoredAt: new Date().toISOString()
      };
      return { success: true, data: project };
    } catch (error) {
      this.logger.error(`恢复项目失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 生成项目报告
   * @param id 项目ID
   * @param options 报告选项
   */
  public async generateProjectReport(id: string, options?: any) {
    try {
      const project = await this.getProject(id);
      const tasks = this.taskManager.getAllTasks();
      const stats = await this.getProjectStats(id);

      const report = {
        project: project.data,
        tasks,
        statistics: stats.data,
        generatedAt: new Date().toISOString(),
        format: options?.format || 'json'
      };

      return { success: true, data: report };
    } catch (error) {
      this.logger.error(`生成项目报告失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 导出项目
   * @param id 项目ID
   * @param format 导出格式
   */
  public async exportProject(id: string, format: string) {
    try {
      const project = await this.getProject(id);
      const tasks = this.taskManager.getAllTasks();

      const exportData = {
        project: project.data,
        tasks,
        exportedAt: new Date().toISOString(),
        format
      };

      return { success: true, data: exportData };
    } catch (error) {
      this.logger.error(`导出项目失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 克隆项目
   * @param id 项目ID
   * @param options 克隆选项
   */
  public async cloneProject(id: string, options: any) {
    try {
      const originalProject = await this.getProject(id);
      if (!originalProject.success || !originalProject.data) {
        throw new Error('原项目不存在或获取失败');
      }

      const newProject = {
        id: `project_${Date.now()}`,
        name: options.name || `${originalProject.data.name} (副本)`,
        description: options.description || originalProject.data.description,
        clonedFrom: id,
        createdAt: new Date().toISOString()
      };

      return { success: true, data: newProject };
    } catch (error) {
      this.logger.error(`克隆项目失败: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }
}

// 导出单例实例
export const taskFlowService = new TaskFlowService();

// 保持向后兼容性
export const yasiService = taskFlowService;