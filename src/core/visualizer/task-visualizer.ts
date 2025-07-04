/**
 * TaskFlow AI 任务可视化模块
 * 负责生成各种任务可视化图表
 */

import { Task, TaskPlan, TaskStatus } from '../../types/task';
import { Logger } from '../../infra/logger';

/**
 * 可视化类型枚举
 */
export enum VisualizationType {
  GANTT = 'gantt',
  DEPENDENCY = 'dependency',
  KANBAN = 'kanban',
  TIMELINE = 'timeline',
  PROGRESS = 'progress'
}

/**
 * 可视化选项
 */
export interface VisualizationOptions {
  type: VisualizationType;
  format?: 'mermaid' | 'json' | 'html';
  includeSubtasks?: boolean;
  showProgress?: boolean;
  groupBy?: 'type' | 'assignee' | 'priority';
  timeUnit?: 'days' | 'hours';
}

/**
 * 甘特图数据
 */
export interface GanttData {
  title: string;
  tasks: GanttTask[];
}

export interface GanttTask {
  id: string;
  name: string;
  start: string;
  duration: number;
  dependencies?: string[];
  progress?: number;
  assignee?: string;
}

/**
 * 依赖关系图数据
 */
export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export interface DependencyNode {
  id: string;
  label: string;
  type: string;
  status: string;
  priority: string;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'dependency';
}

/**
 * 看板数据
 */
export interface KanbanData {
  columns: KanbanColumn[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  tasks: KanbanTask[];
}

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  priority: string;
  assignee?: string;
  tags: string[];
}

/**
 * 任务可视化器类
 */
export class TaskVisualizer {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * 生成可视化数据
   * @param taskPlan 任务计划
   * @param options 可视化选项
   */
  public generateVisualization(taskPlan: TaskPlan, options: VisualizationOptions): any {
    this.logger.info(`生成 ${options.type} 可视化`);

    switch (options.type) {
      case VisualizationType.GANTT:
        return this.generateGanttChart(taskPlan, options);
      case VisualizationType.DEPENDENCY:
        return this.generateDependencyGraph(taskPlan, options);
      case VisualizationType.KANBAN:
        return this.generateKanbanBoard(taskPlan, options);
      case VisualizationType.TIMELINE:
        return this.generateTimeline(taskPlan, options);
      case VisualizationType.PROGRESS:
        return this.generateProgressChart(taskPlan, options);
      default:
        throw new Error(`不支持的可视化类型: ${options.type}`);
    }
  }

  /**
   * 生成甘特图
   * @param taskPlan 任务计划
   * @param options 选项
   */
  private generateGanttChart(taskPlan: TaskPlan, options: VisualizationOptions): GanttData | string {
    const ganttTasks: GanttTask[] = [];
    let currentDate = new Date();

    taskPlan.tasks.forEach(task => {
      const ganttTask: GanttTask = {
        id: task.id,
        name: task.title,
        start: this.formatDate(currentDate),
        duration: task.estimatedHours || 8,
        dependencies: task.dependencies.length > 0 ? task.dependencies : undefined,
        progress: task.progress || 0,
        assignee: task.assignee
      };

      ganttTasks.push(ganttTask);

      // 计算下一个任务的开始时间
      currentDate = new Date(currentDate.getTime() + (task.estimatedHours || 8) * 60 * 60 * 1000);
    });

    const ganttData: GanttData = {
      title: taskPlan.name || '任务甘特图',
      tasks: ganttTasks
    };

    if (options.format === 'mermaid') {
      return this.generateMermaidGantt(ganttData);
    }

    return ganttData;
  }

  /**
   * 生成Mermaid格式的甘特图
   * @param ganttData 甘特图数据
   */
  private generateMermaidGantt(ganttData: GanttData): string {
    let mermaid = `gantt\n    title ${ganttData.title}\n    dateFormat YYYY-MM-DD\n    axisFormat %m-%d\n\n`;

    ganttData.tasks.forEach(task => {
      const progress = task.progress ?? 0;
      const status = progress === 100 ? 'done' : progress > 0 ? 'active' : '';
      const duration = `${task.duration}h`;

      mermaid += `    ${task.name} :${status}, ${task.id}, ${task.start}, ${duration}\n`;
    });

    return mermaid;
  }

  /**
   * 生成依赖关系图
   * @param taskPlan 任务计划
   * @param options 选项
   */
  private generateDependencyGraph(taskPlan: TaskPlan, options: VisualizationOptions): DependencyGraph | string {
    const nodes: DependencyNode[] = [];
    const edges: DependencyEdge[] = [];

    // 生成节点
    taskPlan.tasks.forEach(task => {
      nodes.push({
        id: task.id,
        label: task.title,
        type: task.type,
        status: task.status,
        priority: task.priority
      });
    });

    // 生成边
    taskPlan.tasks.forEach(task => {
      task.dependencies.forEach(depId => {
        edges.push({
          from: depId,
          to: task.id,
          type: 'dependency'
        });
      });
    });

    const graph: DependencyGraph = { nodes, edges };

    if (options.format === 'mermaid') {
      return this.generateMermaidDependencyGraph(graph);
    }

    return graph;
  }

  /**
   * 生成Mermaid格式的依赖关系图
   * @param graph 依赖关系图数据
   */
  private generateMermaidDependencyGraph(graph: DependencyGraph): string {
    let mermaid = `graph TD\n`;

    // 添加节点定义
    graph.nodes.forEach(node => {
      const shape = this.getNodeShape(node.status);
      const style = this.getNodeStyle(node.priority);
      mermaid += `    ${node.id}${shape}["${node.label}"]\n`;
      if (style) {
        mermaid += `    class ${node.id} ${style}\n`;
      }
    });

    mermaid += '\n';

    // 添加边
    graph.edges.forEach(edge => {
      mermaid += `    ${edge.from} --> ${edge.to}\n`;
    });

    // 添加样式定义
    mermaid += '\n';
    mermaid += '    classDef high fill:#ff6b6b,stroke:#333,stroke-width:2px\n';
    mermaid += '    classDef medium fill:#feca57,stroke:#333,stroke-width:2px\n';
    mermaid += '    classDef low fill:#48dbfb,stroke:#333,stroke-width:2px\n';
    mermaid += '    classDef critical fill:#ff3838,stroke:#333,stroke-width:3px\n';

    return mermaid;
  }

  /**
   * 获取节点形状
   * @param status 任务状态
   */
  private getNodeShape(status: string): string {
    switch (status) {
      case TaskStatus.COMPLETED:
        return '(())';
      case TaskStatus.IN_PROGRESS:
        return '([])';
      case TaskStatus.BLOCKED:
        return '{[]}';
      default:
        return '[]';
    }
  }

  /**
   * 获取节点样式
   * @param priority 优先级
   */
  private getNodeStyle(priority: string): string {
    switch (priority) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return '';
    }
  }

  /**
   * 生成看板
   * @param taskPlan 任务计划
   * @param options 选项
   */
  private generateKanbanBoard(taskPlan: TaskPlan, _options: VisualizationOptions): KanbanData {
    const columns: KanbanColumn[] = [
      { id: 'not_started', title: '待开始', tasks: [] },
      { id: 'in_progress', title: '进行中', tasks: [] },
      { id: 'completed', title: '已完成', tasks: [] },
      { id: 'blocked', title: '被阻塞', tasks: [] }
    ];

    taskPlan.tasks.forEach(task => {
      const kanbanTask: KanbanTask = {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        assignee: task.assignee,
        tags: task.tags
      };

      const column = columns.find(col => col.id === task.status);
      if (column) {
        column.tasks.push(kanbanTask);
      }
    });

    return { columns };
  }

  /**
   * 生成时间线
   * @param taskPlan 任务计划
   * @param options 选项
   */
  private generateTimeline(taskPlan: TaskPlan, _options: VisualizationOptions): any {
    // 简化的时间线实现
    const timeline = {
      title: taskPlan.name || '项目时间线',
      events: taskPlan.tasks.map((task, index) => ({
        id: task.id,
        title: task.title,
        date: this.calculateTaskStartDate(task, index),
        duration: task.estimatedHours || 8,
        status: task.status,
        priority: task.priority
      }))
    };

    return timeline;
  }

  /**
   * 生成进度图表
   * @param taskPlan 任务计划
   * @param options 选项
   */
  private generateProgressChart(taskPlan: TaskPlan, _options: VisualizationOptions): any {
    const stats = {
      total: taskPlan.tasks.length,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      blocked: 0
    };

    taskPlan.tasks.forEach(task => {
      switch (task.status) {
        case TaskStatus.COMPLETED:
          stats.completed++;
          break;
        case TaskStatus.IN_PROGRESS:
          stats.inProgress++;
          break;
        case TaskStatus.NOT_STARTED:
          stats.notStarted++;
          break;
        case TaskStatus.BLOCKED:
          stats.blocked++;
          break;
      }
    });

    const completionRate = (stats.completed / stats.total) * 100;

    return {
      stats,
      completionRate,
      chartData: [
        { label: '已完成', value: stats.completed, color: '#4CAF50' },
        { label: '进行中', value: stats.inProgress, color: '#FF9800' },
        { label: '未开始', value: stats.notStarted, color: '#9E9E9E' },
        { label: '被阻塞', value: stats.blocked, color: '#F44336' }
      ]
    };
  }

  /**
   * 格式化日期
   * @param date 日期
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 计算任务开始日期
   * @param task 任务
   * @param index 索引
   */
  private calculateTaskStartDate(task: Task, index: number): string {
    // 简化实现：基于索引计算开始日期
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + index);
    return this.formatDate(startDate);
  }
}
