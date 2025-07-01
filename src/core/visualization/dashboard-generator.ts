/**
 * 仪表板生成器 - 创建综合性的项目仪表板
 * 整合多个图表和指标，提供全面的项目视图
 */

import { Logger } from '../../infra/logger';
import { Task, TaskPlan } from '../../types/task';
import { OrchestrationResult, ExecutionPath } from '../ai/intelligent-orchestrator';
import { 
  ChartGenerator, 
  ChartType, 
  GeneratedChart, 
  ChartConfig 
} from './chart-generator';

/**
 * 仪表板类型枚举
 */
export enum DashboardType {
  EXECUTIVE = 'executive',           // 高管仪表板
  PROJECT_MANAGER = 'project_manager', // 项目经理仪表板
  DEVELOPER = 'developer',           // 开发者仪表板
  TEAM_LEAD = 'team_lead',          // 团队负责人仪表板
  STAKEHOLDER = 'stakeholder',       // 利益相关者仪表板
  CUSTOM = 'custom'                  // 自定义仪表板
}

/**
 * 仪表板布局类型
 */
export enum DashboardLayout {
  GRID = 'grid',                     // 网格布局
  MASONRY = 'masonry',               // 瀑布流布局
  TABS = 'tabs',                     // 标签页布局
  ACCORDION = 'accordion',           // 手风琴布局
  SIDEBAR = 'sidebar'                // 侧边栏布局
}

/**
 * 仪表板组件接口
 */
export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'text' | 'custom';
  title: string;
  description?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  data?: any;
  config?: Record<string, any>;
  refreshInterval?: number;           // 刷新间隔(秒)
  visible?: boolean;
  permissions?: string[];             // 权限要求
}

/**
 * 仪表板配置接口
 */
export interface DashboardConfig {
  type: DashboardType;
  layout: DashboardLayout;
  title: string;
  description?: string;
  theme: 'light' | 'dark' | 'auto';
  refreshInterval: number;            // 全局刷新间隔
  autoRefresh: boolean;
  responsive: boolean;
  exportable: boolean;
  shareable: boolean;
  filters?: DashboardFilter[];
  customCss?: string;
}

/**
 * 仪表板过滤器接口
 */
export interface DashboardFilter {
  id: string;
  name: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text' | 'number';
  options?: Array<{ label: string; value: any }>;
  defaultValue?: any;
  required?: boolean;
}

/**
 * 生成的仪表板接口
 */
export interface GeneratedDashboard {
  id: string;
  config: DashboardConfig;
  widgets: DashboardWidget[];
  charts: GeneratedChart[];
  metrics: DashboardMetric[];
  metadata: {
    generatedAt: Date;
    dataSource: string;
    version: string;
    lastUpdated?: Date;
  };
}

/**
 * 仪表板指标接口
 */
export interface DashboardMetric {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  target?: number;
  status: 'good' | 'warning' | 'critical';
  description?: string;
  category: string;
}

/**
 * 仪表板生成器类
 */
export class DashboardGenerator {
  private logger: Logger;
  private chartGenerator: ChartGenerator;

  constructor(logger: Logger) {
    this.logger = logger;
    this.chartGenerator = new ChartGenerator(logger);
  }

  /**
   * 生成高管仪表板
   * @param taskPlan 任务计划
   * @param orchestrationResult 编排结果
   */
  public generateExecutiveDashboard(
    taskPlan: TaskPlan,
    orchestrationResult?: OrchestrationResult
  ): GeneratedDashboard {
    this.logger.info('生成高管仪表板');

    const config: DashboardConfig = {
      type: DashboardType.EXECUTIVE,
      layout: DashboardLayout.GRID,
      title: `${taskPlan.name} - 高管仪表板`,
      description: '项目整体概览和关键指标',
      theme: 'light',
      refreshInterval: 300, // 5分钟
      autoRefresh: true,
      responsive: true,
      exportable: true,
      shareable: true
    };

    // 生成关键图表
    const charts = this.chartGenerator.generateChartSuite(
      taskPlan,
      orchestrationResult?.executionPath,
      [ChartType.PROGRESS, ChartType.BURNDOWN, ChartType.MILESTONE, ChartType.RISK_MATRIX]
    );

    // 计算关键指标
    const metrics = this.calculateExecutiveMetrics(taskPlan, orchestrationResult);

    // 创建组件
    const widgets: DashboardWidget[] = [
      // 项目进度概览
      {
        id: 'progress-overview',
        type: 'chart',
        title: '项目进度概览',
        position: { x: 0, y: 0, width: 6, height: 4 },
        data: charts.find(c => c.config.type === ChartType.PROGRESS)
      },
      // 燃尽图
      {
        id: 'burndown-chart',
        type: 'chart',
        title: '项目燃尽图',
        position: { x: 6, y: 0, width: 6, height: 4 },
        data: charts.find(c => c.config.type === ChartType.BURNDOWN)
      },
      // 关键指标
      {
        id: 'key-metrics',
        type: 'metric',
        title: '关键指标',
        position: { x: 0, y: 4, width: 12, height: 2 },
        data: metrics
      },
      // 风险矩阵
      {
        id: 'risk-matrix',
        type: 'chart',
        title: '风险矩阵',
        position: { x: 0, y: 6, width: 6, height: 4 },
        data: charts.find(c => c.config.type === ChartType.RISK_MATRIX)
      },
      // 里程碑
      {
        id: 'milestones',
        type: 'chart',
        title: '项目里程碑',
        position: { x: 6, y: 6, width: 6, height: 4 },
        data: charts.find(c => c.config.type === ChartType.MILESTONE)
      }
    ];

    return {
      id: this.generateDashboardId(),
      config,
      widgets,
      charts,
      metrics,
      metadata: {
        generatedAt: new Date(),
        dataSource: 'taskPlan',
        version: '1.0.0'
      }
    };
  }

  /**
   * 生成项目经理仪表板
   * @param taskPlan 任务计划
   * @param orchestrationResult 编排结果
   */
  public generateProjectManagerDashboard(
    taskPlan: TaskPlan,
    orchestrationResult?: OrchestrationResult
  ): GeneratedDashboard {
    this.logger.info('生成项目经理仪表板');

    const config: DashboardConfig = {
      type: DashboardType.PROJECT_MANAGER,
      layout: DashboardLayout.GRID,
      title: `${taskPlan.name} - 项目经理仪表板`,
      description: '详细的项目管理视图和团队绩效',
      theme: 'light',
      refreshInterval: 180, // 3分钟
      autoRefresh: true,
      responsive: true,
      exportable: true,
      shareable: true,
      filters: [
        {
          id: 'assignee-filter',
          name: '负责人',
          type: 'multiselect',
          options: this.getAssigneeOptions(taskPlan.tasks)
        },
        {
          id: 'status-filter',
          name: '状态',
          type: 'multiselect',
          options: this.getStatusOptions()
        },
        {
          id: 'date-filter',
          name: '日期范围',
          type: 'daterange'
        }
      ]
    };

    // 生成详细图表
    const charts = this.chartGenerator.generateChartSuite(
      taskPlan,
      orchestrationResult?.executionPath,
      [
        ChartType.GANTT,
        ChartType.BURNDOWN,
        ChartType.WORKLOAD,
        ChartType.DEPENDENCY,
        ChartType.VELOCITY,
        ChartType.CUMULATIVE_FLOW
      ]
    );

    // 计算项目经理指标
    const metrics = this.calculateProjectManagerMetrics(taskPlan, orchestrationResult);

    // 创建组件
    const widgets: DashboardWidget[] = [
      // 甘特图
      {
        id: 'gantt-chart',
        type: 'chart',
        title: '项目甘特图',
        position: { x: 0, y: 0, width: 12, height: 6 },
        data: charts.find(c => c.config.type === ChartType.GANTT)
      },
      // 团队工作负载
      {
        id: 'workload-chart',
        type: 'chart',
        title: '团队工作负载',
        position: { x: 0, y: 6, width: 6, height: 4 },
        data: charts.find(c => c.config.type === ChartType.WORKLOAD)
      },
      // 依赖关系图
      {
        id: 'dependency-graph',
        type: 'chart',
        title: '任务依赖关系',
        position: { x: 6, y: 6, width: 6, height: 4 },
        data: charts.find(c => c.config.type === ChartType.DEPENDENCY)
      },
      // 团队速度
      {
        id: 'velocity-chart',
        type: 'chart',
        title: '团队速度',
        position: { x: 0, y: 10, width: 6, height: 4 },
        data: charts.find(c => c.config.type === ChartType.VELOCITY)
      },
      // 累积流图
      {
        id: 'cumulative-flow',
        type: 'chart',
        title: '累积流图',
        position: { x: 6, y: 10, width: 6, height: 4 },
        data: charts.find(c => c.config.type === ChartType.CUMULATIVE_FLOW)
      },
      // 项目指标
      {
        id: 'project-metrics',
        type: 'metric',
        title: '项目指标',
        position: { x: 0, y: 14, width: 12, height: 2 },
        data: metrics
      }
    ];

    return {
      id: this.generateDashboardId(),
      config,
      widgets,
      charts,
      metrics,
      metadata: {
        generatedAt: new Date(),
        dataSource: 'taskPlan',
        version: '1.0.0'
      }
    };
  }

  /**
   * 生成开发者仪表板
   * @param taskPlan 任务计划
   * @param developerId 开发者ID
   */
  public generateDeveloperDashboard(
    taskPlan: TaskPlan,
    developerId: string
  ): GeneratedDashboard {
    this.logger.info(`生成开发者仪表板: ${developerId}`);

    // 过滤出该开发者的任务
    const developerTasks = taskPlan.tasks.filter(task => task.assignee === developerId);
    
    const config: DashboardConfig = {
      type: DashboardType.DEVELOPER,
      layout: DashboardLayout.TABS,
      title: `${developerId} - 个人仪表板`,
      description: '个人任务和绩效视图',
      theme: 'auto',
      refreshInterval: 120, // 2分钟
      autoRefresh: true,
      responsive: true,
      exportable: false,
      shareable: false
    };

    // 生成个人相关图表
    const personalTaskPlan = { ...taskPlan, tasks: developerTasks };
    const charts = this.chartGenerator.generateChartSuite(
      personalTaskPlan,
      undefined,
      [ChartType.PROGRESS, ChartType.BURNDOWN, ChartType.VELOCITY]
    );

    // 计算个人指标
    const metrics = this.calculateDeveloperMetrics(developerTasks);

    // 创建组件
    const widgets: DashboardWidget[] = [
      // 我的任务进度
      {
        id: 'my-progress',
        type: 'chart',
        title: '我的任务进度',
        position: { x: 0, y: 0, width: 6, height: 4 },
        data: charts.find(c => c.config.type === ChartType.PROGRESS)
      },
      // 个人燃尽图
      {
        id: 'my-burndown',
        type: 'chart',
        title: '个人燃尽图',
        position: { x: 6, y: 0, width: 6, height: 4 },
        data: charts.find(c => c.config.type === ChartType.BURNDOWN)
      },
      // 个人指标
      {
        id: 'personal-metrics',
        type: 'metric',
        title: '个人指标',
        position: { x: 0, y: 4, width: 12, height: 2 },
        data: metrics
      },
      // 待办任务列表
      {
        id: 'todo-list',
        type: 'table',
        title: '待办任务',
        position: { x: 0, y: 6, width: 12, height: 6 },
        data: this.formatTaskTable(developerTasks.filter(t => t.status !== 'completed'))
      }
    ];

    return {
      id: this.generateDashboardId(),
      config,
      widgets,
      charts,
      metrics,
      metadata: {
        generatedAt: new Date(),
        dataSource: 'taskPlan',
        version: '1.0.0'
      }
    };
  }

  /**
   * 生成自定义仪表板
   * @param taskPlan 任务计划
   * @param customConfig 自定义配置
   */
  public generateCustomDashboard(
    taskPlan: TaskPlan,
    customConfig: {
      title: string;
      chartTypes: ChartType[];
      layout: DashboardLayout;
      theme: 'light' | 'dark' | 'auto';
      filters?: DashboardFilter[];
    }
  ): GeneratedDashboard {
    this.logger.info(`生成自定义仪表板: ${customConfig.title}`);

    const config: DashboardConfig = {
      type: DashboardType.CUSTOM,
      layout: customConfig.layout,
      title: customConfig.title,
      theme: customConfig.theme,
      refreshInterval: 300,
      autoRefresh: true,
      responsive: true,
      exportable: true,
      shareable: true,
      filters: customConfig.filters
    };

    // 生成指定的图表
    const charts = this.chartGenerator.generateChartSuite(
      taskPlan,
      undefined,
      customConfig.chartTypes
    );

    // 自动布局组件
    const widgets = this.autoLayoutWidgets(charts, customConfig.layout);

    return {
      id: this.generateDashboardId(),
      config,
      widgets,
      charts,
      metrics: [],
      metadata: {
        generatedAt: new Date(),
        dataSource: 'taskPlan',
        version: '1.0.0'
      }
    };
  }

  // 私有辅助方法

  /**
   * 生成仪表板ID
   */
  private generateDashboardId(): string {
    return `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 计算高管指标
   */
  private calculateExecutiveMetrics(
    taskPlan: TaskPlan,
    orchestrationResult?: OrchestrationResult
  ): DashboardMetric[] {
    const totalTasks = taskPlan.tasks.length;
    const completedTasks = taskPlan.tasks.filter(t => t.status === 'completed').length;
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return [
      {
        id: 'project-progress',
        name: '项目进度',
        value: Math.round(progressPercentage),
        unit: '%',
        status: progressPercentage >= 80 ? 'good' : progressPercentage >= 50 ? 'warning' : 'critical',
        category: 'progress'
      },
      {
        id: 'total-tasks',
        name: '总任务数',
        value: totalTasks,
        status: 'good',
        category: 'scope'
      },
      {
        id: 'completed-tasks',
        name: '已完成任务',
        value: completedTasks,
        status: 'good',
        category: 'progress'
      },
      {
        id: 'efficiency-score',
        name: '效率评分',
        value: orchestrationResult?.metrics.efficiency ? Math.round(orchestrationResult.metrics.efficiency * 100) : 0,
        unit: '%',
        status: 'good',
        category: 'performance'
      }
    ];
  }

  /**
   * 计算项目经理指标
   */
  private calculateProjectManagerMetrics(
    taskPlan: TaskPlan,
    orchestrationResult?: OrchestrationResult
  ): DashboardMetric[] {
    // 实现项目经理相关指标计算
    return [];
  }

  /**
   * 计算开发者指标
   */
  private calculateDeveloperMetrics(tasks: Task[]): DashboardMetric[] {
    // 实现开发者相关指标计算
    return [];
  }

  /**
   * 获取负责人选项
   */
  private getAssigneeOptions(tasks: Task[]): Array<{ label: string; value: string }> {
    const assignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))];
    return assignees.map(assignee => ({ label: assignee!, value: assignee! }));
  }

  /**
   * 获取状态选项
   */
  private getStatusOptions(): Array<{ label: string; value: string }> {
    return [
      { label: '未开始', value: 'not_started' },
      { label: '进行中', value: 'in_progress' },
      { label: '已完成', value: 'completed' },
      { label: '已阻塞', value: 'blocked' },
      { label: '已取消', value: 'cancelled' },
      { label: '暂停', value: 'on_hold' }
    ];
  }

  /**
   * 格式化任务表格
   */
  private formatTaskTable(tasks: Task[]): any {
    return {
      columns: [
        { key: 'title', label: '任务名称' },
        { key: 'status', label: '状态' },
        { key: 'priority', label: '优先级' },
        { key: 'dueDate', label: '截止日期' },
        { key: 'progress', label: '进度' }
      ],
      rows: tasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.toLocaleDateString(),
        progress: `${task.progress || 0}%`
      }))
    };
  }

  /**
   * 自动布局组件
   */
  private autoLayoutWidgets(charts: GeneratedChart[], layout: DashboardLayout): DashboardWidget[] {
    const widgets: DashboardWidget[] = [];
    
    charts.forEach((chart, index) => {
      const widget: DashboardWidget = {
        id: `chart-${index}`,
        type: 'chart',
        title: chart.config.title,
        position: this.calculatePosition(index, layout),
        data: chart
      };
      widgets.push(widget);
    });

    return widgets;
  }

  /**
   * 计算组件位置
   */
  private calculatePosition(index: number, layout: DashboardLayout): { x: number; y: number; width: number; height: number } {
    switch (layout) {
      case DashboardLayout.GRID:
        const cols = 2;
        const x = (index % cols) * 6;
        const y = Math.floor(index / cols) * 4;
        return { x, y, width: 6, height: 4 };
      
      default:
        return { x: 0, y: index * 4, width: 12, height: 4 };
    }
  }
}
