/**
 * 图表生成器 - 为TaskFlow AI生成各种数据可视化图表
 * 支持甘特图、燃尽图、依赖图、进度图表等多种可视化类型
 */

import { Logger } from '../../infra/logger';
import { Task, TaskPlan, TaskStatus, TaskPriority, TaskType } from '../../types/task';
import { ExecutionPath } from '../ai/intelligent-orchestrator';

/**
 * 图表类型枚举
 */
export enum ChartType {
  GANTT = 'gantt',                      // 甘特图
  BURNDOWN = 'burndown',                // 燃尽图
  BURNUP = 'burnup',                    // 燃起图
  DEPENDENCY = 'dependency',            // 依赖关系图
  PROGRESS = 'progress',                // 进度图
  TIMELINE = 'timeline',                // 时间线
  KANBAN = 'kanban',                    // 看板
  VELOCITY = 'velocity',                // 速度图
  WORKLOAD = 'workload',                // 工作负载图
  RISK_MATRIX = 'risk_matrix',          // 风险矩阵
  RESOURCE_ALLOCATION = 'resource_allocation', // 资源分配图
  MILESTONE = 'milestone',              // 里程碑图
  CUMULATIVE_FLOW = 'cumulative_flow',  // 累积流图
  CYCLE_TIME = 'cycle_time',            // 周期时间图
  LEAD_TIME = 'lead_time'               // 前置时间图
}

/**
 * 图表配置接口
 */
export interface ChartConfig {
  type: ChartType;
  title: string;
  width?: number;
  height?: number;
  theme?: 'light' | 'dark' | 'auto';
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  interactive?: boolean;
  exportFormats?: ('png' | 'svg' | 'pdf' | 'json')[];
  customOptions?: Record<string, unknown>;
}

/**
 * 图表数据点接口
 */
export interface ChartDataPoint {
  x: string | number | Date;            // X轴值
  y: string | number | Date;            // Y轴值
  label?: string;                       // 标签
  color?: string;                       // 颜色
  size?: number;                        // 大小
  metadata?: Record<string, unknown>;   // 元数据
}

/**
 * 图表系列接口
 */
export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  type?: string;                        // 系列类型
  color?: string;                       // 系列颜色
  visible?: boolean;                    // 是否可见
}

/**
 * 图表数据接口
 */
export interface ChartData {
  series: ChartSeries[];
  categories?: string[];                // 分类标签
  xAxis?: {
    title: string;
    type: 'category' | 'datetime' | 'numeric';
    min?: string | number | Date;
    max?: string | number | Date;
  };
  yAxis?: {
    title: string;
    type: 'category' | 'datetime' | 'numeric';
    min?: number | string | Date;
    max?: number | string | Date;
  };
  annotations?: ChartAnnotation[];      // 注释
}

/**
 * 图表注释接口
 */
export interface ChartAnnotation {
  type: 'line' | 'area' | 'point' | 'text';
  x?: number | string | Date;
  y?: number | string | Date;
  x2?: number | string | Date;
  y2?: number | string | Date;
  text?: string;
  color?: string;
  style?: Record<string, unknown>;
}

/**
 * 生成的图表接口
 */
export interface GeneratedChart {
  id: string;
  config: ChartConfig;
  data: ChartData;
  metadata: {
    generatedAt: Date;
    dataSource: string;
    recordCount: number;
    lastUpdated?: Date;
  };
  renderOptions?: {
    format: string;
    content: string;                    // 图表内容（SVG、JSON等）
  };
}

/**
 * 图表生成器类
 */
export class ChartGenerator {
  private logger: Logger;
  private defaultTheme: 'light' | 'dark' = 'light';
  private colorPalettes: Record<string, string[]> = {
    default: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
    status: ['#6b7280', '#9ca3af', '#3b82f6', '#3b82f6', '#10b981', '#10b981', '#ef4444', '#dc2626', '#9ca3af', '#f59e0b', '#8b5cf6', '#6b7280'],
    priority: ['#dc2626', '#ea580c', '#3b82f6', '#6b7280'],
    type: ['#3b82f6', '#ef4444', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16']
  };

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * 获取状态对应的颜色
   */
  private getStatusColor(status: TaskStatus): string {
    const statusColors: Record<TaskStatus, string> = {
      [TaskStatus.NOT_STARTED]: '#6b7280',
      [TaskStatus.PENDING]: '#9ca3af',
      [TaskStatus.IN_PROGRESS]: '#3b82f6',
      [TaskStatus.RUNNING]: '#3b82f6',
      [TaskStatus.COMPLETED]: '#10b981',
      [TaskStatus.DONE]: '#10b981',
      [TaskStatus.BLOCKED]: '#ef4444',
      [TaskStatus.FAILED]: '#dc2626',
      [TaskStatus.CANCELLED]: '#9ca3af',
      [TaskStatus.ON_HOLD]: '#f59e0b',
      [TaskStatus.REVIEW]: '#8b5cf6',
      [TaskStatus.TODO]: '#6b7280'
    };
    return statusColors[status] || '#6b7280';
  }

  /**
   * 生成甘特图
   * @param taskPlan 任务计划
   * @param config 图表配置
   */
  public generateGanttChart(taskPlan: TaskPlan, config?: Partial<ChartConfig>): GeneratedChart {
    this.logger.info('生成甘特图');

    const chartConfig: ChartConfig = {
      type: ChartType.GANTT,
      title: `${taskPlan.name} - 甘特图`,
      height: Math.max(400, taskPlan.tasks.length * 40),
      showLegend: true,
      showGrid: true,
      interactive: true,
      ...config
    };

    const series: ChartSeries[] = [];
    const categories: string[] = [];

    // 按优先级和开始时间排序任务
    const sortedTasks = [...taskPlan.tasks].sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      const aStart = a.startedAt || a.createdAt;
      const bStart = b.startedAt || b.createdAt;
      return aStart.getTime() - bStart.getTime();
    });

    sortedTasks.forEach((task, index) => {
      categories.push(task.title);

      const startDate = task.startedAt || task.createdAt;
      const endDate = task.completedAt || this.estimateEndDate(task, startDate);
      const duration = endDate.getTime() - startDate.getTime();

      series.push({
        name: task.title,
        data: [{
          x: startDate.getTime(),
          y: index,
          label: task.title,
          color: this.getTaskColor(task),
          metadata: {
            taskId: task.id,
            status: task.status,
            priority: task.priority,
            type: task.type,
            progress: task.progress || 0,
            duration: Math.ceil(duration / (1000 * 60 * 60 * 24)), // 天数
            assignee: task.assignee,
            dependencies: task.dependencies
          }
        }]
      });
    });

    const chartData: ChartData = {
      series,
      categories,
      xAxis: {
        title: '时间',
        type: 'datetime',
        min: Math.min(...series.map(s => Number(s.data[0].x))),
        max: Math.max(...series.map(s => {
          const x = Number(s.data[0].x);
          const duration = Number(s.data[0].metadata?.duration) || 1;
          return x + duration * 24 * 60 * 60 * 1000;
        }))
      },
      yAxis: {
        title: '任务',
        type: 'category'
      }
    };

    return {
      id: this.generateChartId(),
      config: chartConfig,
      data: chartData,
      metadata: {
        generatedAt: new Date(),
        dataSource: 'taskPlan',
        recordCount: taskPlan.tasks.length
      }
    };
  }

  /**
   * 生成燃尽图
   * @param taskPlan 任务计划
   * @param config 图表配置
   */
  public generateBurndownChart(taskPlan: TaskPlan, config?: Partial<ChartConfig>): GeneratedChart {
    this.logger.info('生成燃尽图');

    const chartConfig: ChartConfig = {
      type: ChartType.BURNDOWN,
      title: `${taskPlan.name} - 燃尽图`,
      height: 400,
      showLegend: true,
      showGrid: true,
      interactive: true,
      ...config
    };

    // 计算理想燃尽线和实际燃尽线
    const totalTasks = taskPlan.tasks.length;
    const projectStart = new Date(Math.min(...taskPlan.tasks.map(t => t.createdAt.getTime())));
    const projectEnd = taskPlan.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 默认30天后
    const totalDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));

    // 理想燃尽线
    const idealSeries: ChartDataPoint[] = [];
    for (let day = 0; day <= totalDays; day++) {
      const date = new Date(projectStart.getTime() + day * 24 * 60 * 60 * 1000);
      const remainingTasks = totalTasks - (totalTasks * day / totalDays);
      idealSeries.push({
        x: date.getTime(),
        y: Math.max(0, remainingTasks),
        label: `第${day}天`
      });
    }

    // 实际燃尽线（基于任务完成时间）
    const actualSeries: ChartDataPoint[] = [];
    const completedTasks = taskPlan.tasks
      .filter(t => t.status === TaskStatus.COMPLETED && t.completedAt)
      .sort((a, b) => a.completedAt!.getTime() - b.completedAt!.getTime());

    let completedCount = 0;
    for (let day = 0; day <= totalDays; day++) {
      const date = new Date(projectStart.getTime() + day * 24 * 60 * 60 * 1000);

      // 计算到当前日期为止完成的任务数
      while (completedCount < completedTasks.length &&
        completedTasks[completedCount].completedAt!.getTime() <= date.getTime()) {
        completedCount++;
      }

      const remainingTasks = totalTasks - completedCount;
      actualSeries.push({
        x: date.getTime(),
        y: remainingTasks,
        label: `第${day}天`,
        metadata: { completedCount, remainingTasks }
      });
    }

    const chartData: ChartData = {
      series: [
        {
          name: '理想燃尽',
          data: idealSeries,
          color: '#94a3b8'
        },
        {
          name: '实际燃尽',
          data: actualSeries,
          color: '#3b82f6'
        }
      ],
      xAxis: {
        title: '时间',
        type: 'datetime'
      },
      yAxis: {
        title: '剩余任务数',
        type: 'numeric',
        min: 0
      }
    };

    return {
      id: this.generateChartId(),
      config: chartConfig,
      data: chartData,
      metadata: {
        generatedAt: new Date(),
        dataSource: 'taskPlan',
        recordCount: totalDays + 1
      }
    };
  }

  /**
   * 生成依赖关系图
   * @param taskPlan 任务计划
   * @param config 图表配置
   */
  public generateDependencyGraph(taskPlan: TaskPlan, config?: Partial<ChartConfig>): GeneratedChart {
    this.logger.info('生成依赖关系图');

    const chartConfig: ChartConfig = {
      type: ChartType.DEPENDENCY,
      title: `${taskPlan.name} - 依赖关系图`,
      height: 600,
      showLegend: true,
      interactive: true,
      ...config
    };

    // 构建节点和边
    const nodes: ChartDataPoint[] = [];
    const edges: ChartDataPoint[] = [];
    const taskMap = new Map(taskPlan.tasks.map(t => [t.id, t]));

    // 添加任务节点
    taskPlan.tasks.forEach((task, index) => {
      nodes.push({
        x: index % 5,                   // 简单的网格布局
        y: Math.floor(index / 5),
        label: task.title,
        color: this.getTaskColor(task),
        size: this.getTaskSize(task),
        metadata: {
          taskId: task.id,
          status: task.status,
          priority: task.priority,
          type: task.type,
          dependencies: task.dependencies.length,
          dependents: taskPlan.tasks.filter(t => t.dependencies.includes(task.id)).length
        }
      });
    });

    // 添加依赖边
    taskPlan.tasks.forEach(task => {
      task.dependencies.forEach(depId => {
        const depTask = taskMap.get(depId);
        if (depTask) {
          const sourceIndex = taskPlan.tasks.findIndex(t => t.id === depId);
          const targetIndex = taskPlan.tasks.findIndex(t => t.id === task.id);

          edges.push({
            x: sourceIndex,
            y: targetIndex,
            label: `${depTask.title} → ${task.title}`,
            metadata: {
              source: depId,
              target: task.id,
              type: 'dependency'
            }
          });
        }
      });
    });

    const chartData: ChartData = {
      series: [
        {
          name: '任务节点',
          data: nodes,
          type: 'scatter'
        },
        {
          name: '依赖关系',
          data: edges,
          type: 'line'
        }
      ],
      xAxis: {
        title: '布局X',
        type: 'numeric'
      },
      yAxis: {
        title: '布局Y',
        type: 'numeric'
      }
    };

    return {
      id: this.generateChartId(),
      config: chartConfig,
      data: chartData,
      metadata: {
        generatedAt: new Date(),
        dataSource: 'taskPlan',
        recordCount: nodes.length + edges.length
      }
    };
  }

  /**
   * 生成进度图表
   * @param taskPlan 任务计划
   * @param config 图表配置
   */
  public generateProgressChart(taskPlan: TaskPlan, config?: Partial<ChartConfig>): GeneratedChart {
    this.logger.info('生成进度图表');

    const chartConfig: ChartConfig = {
      type: ChartType.PROGRESS,
      title: `${taskPlan.name} - 进度概览`,
      height: 300,
      showLegend: true,
      ...config
    };

    // 按状态统计任务
    const statusCounts: Record<TaskStatus, number> = {
      [TaskStatus.NOT_STARTED]: 0,
      [TaskStatus.PENDING]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.RUNNING]: 0,
      [TaskStatus.COMPLETED]: 0,
      [TaskStatus.DONE]: 0,
      [TaskStatus.BLOCKED]: 0,
      [TaskStatus.FAILED]: 0,
      [TaskStatus.CANCELLED]: 0,
      [TaskStatus.ON_HOLD]: 0,
      [TaskStatus.REVIEW]: 0,
      [TaskStatus.TODO]: 0
    };

    taskPlan.tasks.forEach(task => {
      if (statusCounts[task.status] !== undefined) {
        statusCounts[task.status]++;
      }
    });

    const series: ChartSeries[] = [{
      name: '任务状态分布',
      data: Object.entries(statusCounts).map(([status, count]) => ({
        x: this.getStatusLabel(status as TaskStatus),
        y: count,
        label: `${this.getStatusLabel(status as TaskStatus)}: ${count}`,
        color: this.getStatusColor(status as TaskStatus),
        metadata: { status, count, percentage: (count / taskPlan.tasks.length * 100).toFixed(1) }
      }))
    }];

    const chartData: ChartData = {
      series,
      categories: Object.keys(statusCounts).map(status => this.getStatusLabel(status as TaskStatus)),
      xAxis: {
        title: '任务状态',
        type: 'category'
      },
      yAxis: {
        title: '任务数量',
        type: 'numeric',
        min: 0
      }
    };

    return {
      id: this.generateChartId(),
      config: chartConfig,
      data: chartData,
      metadata: {
        generatedAt: new Date(),
        dataSource: 'taskPlan',
        recordCount: Object.keys(statusCounts).length
      }
    };
  }

  /**
   * 生成工作负载图
   * @param taskPlan 任务计划
   * @param config 图表配置
   */
  public generateWorkloadChart(taskPlan: TaskPlan, config?: Partial<ChartConfig>): GeneratedChart {
    this.logger.info('生成工作负载图');

    const chartConfig: ChartConfig = {
      type: ChartType.WORKLOAD,
      title: `${taskPlan.name} - 工作负载分布`,
      height: 400,
      showLegend: true,
      showGrid: true,
      ...config
    };

    // 按负责人统计工作负载
    const assigneeWorkload = new Map<string, {
      totalTasks: number;
      totalHours: number;
      completedTasks: number;
      inProgressTasks: number;
      pendingTasks: number;
    }>();

    taskPlan.tasks.forEach(task => {
      const assignee = task.assignee || '未分配';

      if (!assigneeWorkload.has(assignee)) {
        assigneeWorkload.set(assignee, {
          totalTasks: 0,
          totalHours: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          pendingTasks: 0
        });
      }

      const workload = assigneeWorkload.get(assignee)!;
      workload.totalTasks++;
      workload.totalHours += task.estimatedHours || 8;

      switch (task.status) {
        case TaskStatus.COMPLETED:
          workload.completedTasks++;
          break;
        case TaskStatus.IN_PROGRESS:
          workload.inProgressTasks++;
          break;
        case TaskStatus.NOT_STARTED:
          workload.pendingTasks++;
          break;
      }
    });

    const series: ChartSeries[] = [
      {
        name: '总任务数',
        data: Array.from(assigneeWorkload.entries()).map(([assignee, workload]) => ({
          x: assignee,
          y: workload.totalTasks,
          label: `${assignee}: ${workload.totalTasks}个任务`,
          color: this.colorPalettes.default[0] || '#3b82f6',
          metadata: workload
        }))
      },
      {
        name: '预估工时',
        data: Array.from(assigneeWorkload.entries()).map(([assignee, workload]) => ({
          x: assignee,
          y: workload.totalHours,
          label: `${assignee}: ${workload.totalHours}小时`,
          color: this.colorPalettes.default[1] || '#ef4444',
          metadata: workload
        }))
      }
    ];

    const chartData: ChartData = {
      series,
      categories: Array.from(assigneeWorkload.keys()),
      xAxis: {
        title: '团队成员',
        type: 'category'
      },
      yAxis: {
        title: '工作量',
        type: 'numeric',
        min: 0
      }
    };

    return {
      id: this.generateChartId(),
      config: chartConfig,
      data: chartData,
      metadata: {
        generatedAt: new Date(),
        dataSource: 'taskPlan',
        recordCount: assigneeWorkload.size
      }
    };
  }

  /**
   * 生成风险矩阵图
   * @param taskPlan 任务计划
   * @param config 图表配置
   */
  public generateRiskMatrix(taskPlan: TaskPlan, config?: Partial<ChartConfig>): GeneratedChart {
    this.logger.info('生成风险矩阵图');

    const chartConfig: ChartConfig = {
      type: ChartType.RISK_MATRIX,
      title: `${taskPlan.name} - 风险矩阵`,
      height: 400,
      width: 400,
      showLegend: true,
      ...config
    };

    // 计算任务风险评分
    const riskData: ChartDataPoint[] = taskPlan.tasks.map(task => {
      const impact = this.calculateRiskImpact(task);
      const probability = this.calculateRiskProbability(task);

      return {
        x: probability,
        y: impact,
        label: task.title,
        color: this.getRiskColor(impact, probability),
        size: (task.estimatedHours || 8) / 2,
        metadata: {
          taskId: task.id,
          impact,
          probability,
          riskLevel: this.getRiskLevel(impact, probability),
          status: task.status,
          priority: task.priority
        }
      };
    });

    const chartData: ChartData = {
      series: [{
        name: '任务风险分布',
        data: riskData,
        type: 'scatter'
      }],
      xAxis: {
        title: '风险概率',
        type: 'numeric',
        min: 0,
        max: 1
      },
      yAxis: {
        title: '风险影响',
        type: 'numeric',
        min: 0,
        max: 1
      },
      annotations: [
        // 添加风险区域分割线
        { type: 'line', x: 0.5, y: 0, x2: 0.5, y2: 1, color: '#94a3b8' },
        { type: 'line', x: 0, y: 0.5, x2: 1, y2: 0.5, color: '#94a3b8' }
      ]
    };

    return {
      id: this.generateChartId(),
      config: chartConfig,
      data: chartData,
      metadata: {
        generatedAt: new Date(),
        dataSource: 'taskPlan',
        recordCount: taskPlan.tasks.length
      }
    };
  }

  /**
   * 生成速度图表
   * @param taskPlan 任务计划
   * @param config 图表配置
   */
  public generateVelocityChart(taskPlan: TaskPlan, config?: Partial<ChartConfig>): GeneratedChart {
    this.logger.info('生成速度图表');

    const chartConfig: ChartConfig = {
      type: ChartType.VELOCITY,
      title: `${taskPlan.name} - 团队速度`,
      height: 300,
      showLegend: true,
      showGrid: true,
      ...config
    };

    // 按周统计完成的任务数
    const weeklyVelocity = this.calculateWeeklyVelocity(taskPlan.tasks);

    const series: ChartSeries[] = [{
      name: '每周完成任务数',
      data: weeklyVelocity.map((velocity, index) => ({
        x: `第${index + 1}周`,
        y: velocity.completedTasks,
        label: `第${index + 1}周: ${velocity.completedTasks}个任务`,
        color: this.colorPalettes.default[0] || '#3b82f6',
        metadata: {
          week: index + 1,
          completedTasks: velocity.completedTasks,
          completedHours: velocity.completedHours,
          averageTaskSize: velocity.averageTaskSize
        }
      }))
    }];

    const chartData: ChartData = {
      series,
      categories: weeklyVelocity.map((_, index) => `第${index + 1}周`),
      xAxis: {
        title: '时间周期',
        type: 'category'
      },
      yAxis: {
        title: '完成任务数',
        type: 'numeric',
        min: 0
      }
    };

    return {
      id: this.generateChartId(),
      config: chartConfig,
      data: chartData,
      metadata: {
        generatedAt: new Date(),
        dataSource: 'taskPlan',
        recordCount: weeklyVelocity.length
      }
    };
  }

  /**
   * 生成里程碑图表
   * @param executionPath 执行路径
   * @param config 图表配置
   */
  public generateMilestoneChart(executionPath: ExecutionPath, config?: Partial<ChartConfig>): GeneratedChart {
    this.logger.info('生成里程碑图表');

    const chartConfig: ChartConfig = {
      type: ChartType.MILESTONE,
      title: '项目里程碑',
      height: 200,
      showLegend: false,
      ...config
    };

    const milestoneData: ChartDataPoint[] = executionPath.milestones.map((milestone) => ({
      x: milestone.targetDate.getTime(),
      y: 1,
      label: milestone.name,
      color: this.getMilestoneColor(milestone.importance),
      size: 10,
      metadata: {
        milestoneId: milestone.id,
        description: milestone.description,
        importance: milestone.importance,
        criteria: milestone.criteria,
        dependentTasks: milestone.dependentTasks.length
      }
    }));

    const chartData: ChartData = {
      series: [{
        name: '里程碑',
        data: milestoneData,
        type: 'scatter'
      }],
      xAxis: {
        title: '时间',
        type: 'datetime'
      },
      yAxis: {
        title: '',
        type: 'numeric',
        min: 0,
        max: 2
      }
    };

    return {
      id: this.generateChartId(),
      config: chartConfig,
      data: chartData,
      metadata: {
        generatedAt: new Date(),
        dataSource: 'executionPath',
        recordCount: executionPath.milestones.length
      }
    };
  }

  /**
   * 生成累积流图
   * @param taskPlan 任务计划
   * @param config 图表配置
   */
  public generateCumulativeFlowChart(taskPlan: TaskPlan, config?: Partial<ChartConfig>): GeneratedChart {
    this.logger.info('生成累积流图');

    const chartConfig: ChartConfig = {
      type: ChartType.CUMULATIVE_FLOW,
      title: `${taskPlan.name} - 累积流图`,
      height: 400,
      showLegend: true,
      showGrid: true,
      ...config
    };

    // 计算每日各状态的任务累积数量
    const dailyFlow = this.calculateDailyFlow(taskPlan.tasks);

    const statuses = Object.values(TaskStatus);
    const series: ChartSeries[] = statuses.map(status => ({
      name: this.getStatusLabel(status),
      data: dailyFlow.map(day => ({
        x: day.date.getTime(),
        y: day.statusCounts[status] || 0,
        label: `${this.getStatusLabel(status)}: ${day.statusCounts[status] || 0}`,
        color: this.getStatusColor(status)
      })),
      color: this.getStatusColor(status)
    }));

    const chartData: ChartData = {
      series,
      xAxis: {
        title: '时间',
        type: 'datetime'
      },
      yAxis: {
        title: '累积任务数',
        type: 'numeric',
        min: 0
      }
    };

    return {
      id: this.generateChartId(),
      config: chartConfig,
      data: chartData,
      metadata: {
        generatedAt: new Date(),
        dataSource: 'taskPlan',
        recordCount: dailyFlow.length
      }
    };
  }

  /**
   * 批量生成图表
   * @param taskPlan 任务计划
   * @param executionPath 执行路径
   * @param chartTypes 要生成的图表类型
   */
  public generateChartSuite(
    taskPlan: TaskPlan,
    executionPath?: ExecutionPath,
    chartTypes: ChartType[] = [
      ChartType.GANTT,
      ChartType.BURNDOWN,
      ChartType.PROGRESS,
      ChartType.WORKLOAD,
      ChartType.DEPENDENCY
    ]
  ): GeneratedChart[] {
    this.logger.info(`批量生成图表: ${chartTypes.join(', ')}`);

    const charts: GeneratedChart[] = [];

    chartTypes.forEach(chartType => {
      try {
        let chart: GeneratedChart;

        switch (chartType) {
          case ChartType.GANTT:
            chart = this.generateGanttChart(taskPlan);
            break;
          case ChartType.BURNDOWN:
            chart = this.generateBurndownChart(taskPlan);
            break;
          case ChartType.PROGRESS:
            chart = this.generateProgressChart(taskPlan);
            break;
          case ChartType.WORKLOAD:
            chart = this.generateWorkloadChart(taskPlan);
            break;
          case ChartType.DEPENDENCY:
            chart = this.generateDependencyGraph(taskPlan);
            break;
          case ChartType.RISK_MATRIX:
            chart = this.generateRiskMatrix(taskPlan);
            break;
          case ChartType.VELOCITY:
            chart = this.generateVelocityChart(taskPlan);
            break;
          case ChartType.MILESTONE:
            if (executionPath) {
              chart = this.generateMilestoneChart(executionPath);
            } else {
              this.logger.warn('生成里程碑图表需要执行路径数据');
              return;
            }
            break;
          case ChartType.CUMULATIVE_FLOW:
            chart = this.generateCumulativeFlowChart(taskPlan);
            break;
          default:
            this.logger.warn(`不支持的图表类型: ${chartType}`);
            return;
        }

        charts.push(chart);
        this.logger.info(`成功生成${chartType}图表`);
      } catch (error) {
        this.logger.error(`生成${chartType}图表失败: ${(error as Error).message}`);
      }
    });

    return charts;
  }

  // 辅助方法

  /**
   * 生成图表ID
   */
  private generateChartId(): string {
    return `chart_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 获取任务颜色
   * @param task 任务
   */
  private getTaskColor(task: Task): string {
    return this.getStatusColor(task.status);
  }

  /**
   * 获取任务大小
   * @param task 任务
   */
  private getTaskSize(task: Task): number {
    const baseSize = 8;
    const hours = task.estimatedHours || 8;
    return Math.max(baseSize, Math.min(baseSize * 3, hours / 2));
  }

  /**
   * 估算任务结束日期
   * @param task 任务
   * @param startDate 开始日期
   */
  private estimateEndDate(task: Task, startDate: Date): Date {
    const estimatedDays = Math.ceil((task.estimatedHours || 8) / 8);
    return new Date(startDate.getTime() + estimatedDays * 24 * 60 * 60 * 1000);
  }

  /**
   * 获取状态标签
   * @param status 状态
   */
  private getStatusLabel(status: TaskStatus): string {
    const labels: Record<TaskStatus, string> = {
      [TaskStatus.NOT_STARTED]: '未开始',
      [TaskStatus.PENDING]: '等待中',
      [TaskStatus.IN_PROGRESS]: '进行中',
      [TaskStatus.RUNNING]: '执行中',
      [TaskStatus.COMPLETED]: '已完成',
      [TaskStatus.DONE]: '完成',
      [TaskStatus.BLOCKED]: '已阻塞',
      [TaskStatus.FAILED]: '失败',
      [TaskStatus.CANCELLED]: '已取消',
      [TaskStatus.ON_HOLD]: '暂停',
      [TaskStatus.REVIEW]: '审核中',
      [TaskStatus.TODO]: '待办'
    };
    return labels[status] || status;
  }

  /**
   * 计算风险影响
   * @param task 任务
   */
  private calculateRiskImpact(task: Task): number {
    let impact = 0.3; // 基础影响

    // 基于优先级
    switch (task.priority) {
      case TaskPriority.CRITICAL:
        impact += 0.4;
        break;
      case TaskPriority.HIGH:
        impact += 0.3;
        break;
      case TaskPriority.MEDIUM:
        impact += 0.2;
        break;
      case TaskPriority.LOW:
        impact += 0.1;
        break;
    }

    // 基于依赖数量
    impact += Math.min(task.dependencies.length * 0.1, 0.3);

    return Math.min(1.0, impact);
  }

  /**
   * 计算风险概率
   * @param task 任务
   */
  private calculateRiskProbability(task: Task): number {
    let probability = 0.2; // 基础概率

    // 基于任务类型
    switch (task.type) {
      case TaskType.RESEARCH:
        probability += 0.4;
        break;
      case TaskType.DESIGN:
        probability += 0.3;
        break;
      case TaskType.REFACTOR:
        probability += 0.2;
        break;
      default:
        probability += 0.1;
        break;
    }

    // 基于估算时间
    if (task.estimatedHours && task.estimatedHours > 40) {
      probability += 0.2;
    }

    return Math.min(1.0, probability);
  }

  /**
   * 获取风险颜色
   * @param impact 影响
   * @param probability 概率
   */
  private getRiskColor(impact: number, probability: number): string {
    const riskScore = impact * probability;

    if (riskScore > 0.6) return '#dc2626'; // 高风险 - 红色
    if (riskScore > 0.3) return '#ea580c'; // 中风险 - 橙色
    return '#22c55e'; // 低风险 - 绿色
  }

  /**
   * 获取风险等级
   * @param impact 影响
   * @param probability 概率
   */
  private getRiskLevel(impact: number, probability: number): string {
    const riskScore = impact * probability;

    if (riskScore > 0.6) return '高风险';
    if (riskScore > 0.3) return '中风险';
    return '低风险';
  }

  /**
   * 计算每周速度
   * @param tasks 任务列表
   */
  private calculateWeeklyVelocity(tasks: Task[]): Array<{
    completedTasks: number;
    completedHours: number;
    averageTaskSize: number;
  }> {
    const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED && t.completedAt);

    if (completedTasks.length === 0) {
      return [];
    }

    // 按周分组
    const weeklyGroups = new Map<number, Task[]>();
    const startDate = new Date(Math.min(...completedTasks.map(t => t.completedAt!.getTime())));

    completedTasks.forEach(task => {
      const weekNumber = Math.floor((task.completedAt!.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

      if (!weeklyGroups.has(weekNumber)) {
        weeklyGroups.set(weekNumber, []);
      }
      weeklyGroups.get(weekNumber)!.push(task);
    });

    // 计算每周指标
    const velocity: Array<{
      completedTasks: number;
      completedHours: number;
      averageTaskSize: number;
    }> = [];

    const maxWeek = Math.max(...Array.from(weeklyGroups.keys()));

    for (let week = 0; week <= maxWeek; week++) {
      const weekTasks = weeklyGroups.get(week) || [];
      const totalHours = weekTasks.reduce((sum, task) => sum + (task.actualHours || task.estimatedHours || 8), 0);

      velocity.push({
        completedTasks: weekTasks.length,
        completedHours: totalHours,
        averageTaskSize: weekTasks.length > 0 ? totalHours / weekTasks.length : 0
      });
    }

    return velocity;
  }

  /**
   * 获取里程碑颜色
   * @param importance 重要性
   */
  private getMilestoneColor(importance: string): string {
    const colors = {
      'critical': '#dc2626',
      'high': '#ea580c',
      'medium': '#3b82f6',
      'low': '#6b7280'
    };
    return colors[importance as keyof typeof colors] || colors.medium;
  }

  /**
   * 计算每日流量
   * @param tasks 任务列表
   */
  private calculateDailyFlow(tasks: Task[]): Array<{
    date: Date;
    statusCounts: Record<TaskStatus, number>;
  }> {
    const startDate = new Date(Math.min(...tasks.map(t => t.createdAt.getTime())));
    const endDate = new Date();
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const dailyFlow: Array<{
      date: Date;
      statusCounts: Record<TaskStatus, number>;
    }> = [];

    for (let day = 0; day <= totalDays; day++) {
      const currentDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
      const statusCounts: Record<TaskStatus, number> = {
        [TaskStatus.NOT_STARTED]: 0,
        [TaskStatus.PENDING]: 0,
        [TaskStatus.IN_PROGRESS]: 0,
        [TaskStatus.RUNNING]: 0,
        [TaskStatus.COMPLETED]: 0,
        [TaskStatus.DONE]: 0,
        [TaskStatus.BLOCKED]: 0,
        [TaskStatus.FAILED]: 0,
        [TaskStatus.CANCELLED]: 0,
        [TaskStatus.ON_HOLD]: 0,
        [TaskStatus.REVIEW]: 0,
        [TaskStatus.TODO]: 0
      };

      // 计算到当前日期为止各状态的累积任务数
      tasks.forEach(task => {
        if (task.createdAt <= currentDate) {
          if (task.completedAt && task.completedAt <= currentDate) {
            statusCounts[TaskStatus.COMPLETED]++;
          } else if (task.startedAt && task.startedAt <= currentDate) {
            statusCounts[TaskStatus.IN_PROGRESS]++;
          } else {
            statusCounts[TaskStatus.NOT_STARTED]++;
          }
        }
      });

      dailyFlow.push({
        date: currentDate,
        statusCounts
      });
    }

    return dailyFlow;
  }
}