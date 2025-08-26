/**
 * 任务生成器
 */

import { PRDDocument, Task, TaskFlowConfig } from '../../types';
import { TASK_TYPES, TASK_STATUSES, PRIORITY_LEVELS } from '../../constants';
import { Logger } from '../../utils/logger';

export class TaskGenerator {
  private logger: Logger;

  constructor(private config: TaskFlowConfig) {
    this.logger = Logger.getInstance('TaskGenerator');
  }

  /**
   * 根据PRD文档生成任务列表
   */
  async generateTasks(prdDocument: PRDDocument): Promise<Task[]> {
    this.logger.info(`开始为文档 "${prdDocument.title}" 生成任务`);

    try {
      const tasks: Task[] = [];
      let taskOrder = 0;

      // 为每个章节生成任务
      for (const section of prdDocument.sections) {
        const sectionTasks = await this.generateTasksForSection(section, taskOrder);
        tasks.push(...sectionTasks);
        taskOrder += sectionTasks.length;
      }

      // 添加通用任务
      const commonTasks = this.generateCommonTasks(prdDocument, taskOrder);
      tasks.push(...commonTasks);

      // 分析任务依赖关系
      this.analyzeDependencies(tasks);

      this.logger.info(`任务生成完成，共生成 ${tasks.length} 个任务`);

      return tasks;
    } catch (error) {
      this.logger.error('任务生成失败:', error);
      throw error;
    }
  }

  /**
   * 为章节生成任务
   */
  private async generateTasksForSection(section: any, startOrder: number): Promise<Task[]> {
    const tasks: Task[] = [];
    const baseId = `task-${Date.now()}-${startOrder}`;

    switch (section.type) {
      case 'functional':
        tasks.push(...this.generateFunctionalTasks(section, baseId));
        break;
      case 'technical':
        tasks.push(...this.generateTechnicalTasks(section, baseId));
        break;
      case 'ui-ux':
        tasks.push(...this.generateUITasks(section, baseId));
        break;
      default:
        tasks.push(this.generateGenericTask(section, baseId));
        break;
    }

    return tasks;
  }

  /**
   * 生成功能性任务
   */
  private generateFunctionalTasks(section: any, baseId: string): Task[] {
    const tasks: Task[] = [];

    // 后端API任务
    tasks.push({
      id: `${baseId}-backend`,
      title: `实现${section.title}后端API`,
      description: `开发${section.title}相关的后端接口和业务逻辑`,
      type: 'backend',
      status: 'todo',
      priority: 'medium',
      complexity: 'medium',
      estimatedHours: 16,
      dependencies: [],
      tags: ['api', 'backend'],
      subtasks: [],
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 前端实现任务
    tasks.push({
      id: `${baseId}-frontend`,
      title: `实现${section.title}前端功能`,
      description: `开发${section.title}的前端界面和交互逻辑`,
      type: 'frontend',
      status: 'todo',
      priority: 'medium',
      complexity: 'medium',
      estimatedHours: 12,
      dependencies: [`${baseId}-backend`],
      tags: ['ui', 'frontend'],
      subtasks: [],
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return tasks;
  }

  /**
   * 生成技术性任务
   */
  private generateTechnicalTasks(section: any, baseId: string): Task[] {
    return [
      {
        id: `${baseId}-architecture`,
        title: `设计${section.title}技术架构`,
        description: `设计和规划${section.title}的技术实现方案`,
        type: 'research',
        status: 'todo',
        priority: 'high',
        complexity: 'complex',
        estimatedHours: 8,
        dependencies: [],
        tags: ['architecture', 'design'],
        subtasks: [],
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  /**
   * 生成UI任务
   */
  private generateUITasks(section: any, baseId: string): Task[] {
    return [
      {
        id: `${baseId}-design`,
        title: `设计${section.title}界面`,
        description: `设计${section.title}的用户界面和交互流程`,
        type: 'design',
        status: 'todo',
        priority: 'medium',
        complexity: 'medium',
        estimatedHours: 8,
        dependencies: [],
        tags: ['ui', 'design'],
        subtasks: [],
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  /**
   * 生成通用任务
   */
  private generateGenericTask(section: any, baseId: string): Task {
    return {
      id: baseId,
      title: `实现${section.title}`,
      description: section.content || `开发${section.title}相关功能`,
      type: 'frontend',
      status: 'todo',
      priority: 'medium',
      complexity: 'medium',
      estimatedHours: 8,
      dependencies: [],
      tags: [],
      subtasks: [],
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 生成通用项目任务
   */
  private generateCommonTasks(prdDocument: PRDDocument, startOrder: number): Task[] {
    const baseId = `common-${Date.now()}`;

    return [
      {
        id: `${baseId}-database`,
        title: '数据库设计和实现',
        description: '设计数据库表结构并实现数据访问层',
        type: 'database',
        status: 'todo',
        priority: 'high',
        complexity: 'medium',
        estimatedHours: 16,
        dependencies: [],
        tags: ['database', 'backend'],
        subtasks: [],
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `${baseId}-testing`,
        title: '编写测试用例',
        description: '编写单元测试和集成测试',
        type: 'testing',
        status: 'todo',
        priority: 'medium',
        complexity: 'medium',
        estimatedHours: 12,
        dependencies: [],
        tags: ['testing', 'quality'],
        subtasks: [],
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `${baseId}-documentation`,
        title: '编写项目文档',
        description: '编写API文档、用户手册和部署指南',
        type: 'documentation',
        status: 'todo',
        priority: 'low',
        complexity: 'simple',
        estimatedHours: 8,
        dependencies: [],
        tags: ['documentation'],
        subtasks: [],
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `${baseId}-deployment`,
        title: '部署和发布',
        description: '配置生产环境并部署应用',
        type: 'deployment',
        status: 'todo',
        priority: 'medium',
        complexity: 'medium',
        estimatedHours: 6,
        dependencies: [],
        tags: ['deployment', 'devops'],
        subtasks: [],
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  /**
   * 分析任务依赖关系
   */
  private analyzeDependencies(tasks: Task[]): void {
    // 设置基本依赖关系
    tasks.forEach(task => {
      if (task.type === 'frontend') {
        // 前端任务依赖对应的后端任务
        const backendTask = tasks.find(
          t =>
            t.type === 'backend' &&
            t.title.includes(task.title.replace('前端', '后端').replace('界面', 'API'))
        );
        if (backendTask && !task.dependencies.includes(backendTask.id)) {
          task.dependencies.push(backendTask.id);
        }
      }

      if (task.type === 'testing') {
        // 测试任务依赖所有开发任务
        const devTasks = tasks.filter(
          t => ['frontend', 'backend', 'database'].includes(t.type) && t.id !== task.id
        );
        task.dependencies.push(...devTasks.map(t => t.id));
      }

      if (task.type === 'deployment') {
        // 部署任务依赖测试任务
        const testingTasks = tasks.filter(t => t.type === 'testing');
        task.dependencies.push(...testingTasks.map(t => t.id));
      }
    });
  }
}
