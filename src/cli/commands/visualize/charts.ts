/**
 * 图表生成器
 */

import { Task, TaskStatus, TaskType } from '../../../types/task';

/** 图表数据 */
export interface ChartData {
  type: string;
  title: string;
  data: unknown[];
  config: ChartConfig;
}

/** 图表配置 */
export interface ChartConfig {
  theme?: 'light' | 'dark';
  showProgress?: boolean;
  showDependencies?: boolean;
  showMilestones?: boolean;
  showLabels?: boolean;
  showPercentages?: boolean;
  showValues?: boolean;
  orientation?: 'vertical' | 'horizontal';
  showToday?: boolean;
  groupBy?: string;
  showTaskDetails?: boolean;
  allowDragDrop?: boolean;
}

/** 可视化数据输入 */
export interface VisualizationData {
  tasks: Task[];
}

/** 可视化选项 */
export interface VisualizationOptions {
  type: 'gantt' | 'pie' | 'bar' | 'timeline' | 'kanban' | 'combined';
  theme?: 'light' | 'dark';
  features?: string[];
}

/** 甘特图任务项 */
interface GanttTaskItem {
  id: string;
  name: string;
  start: string;
  duration: number;
  progress: number;
  dependencies: string[];
  type: TaskType | undefined;
  priority: string;
}

/** 饼图数据项 */
interface PieDataItem {
  name: string;
  value: number;
  percentage: string;
}

/** 柱状图数据项 */
interface BarDataItem {
  name: string;
  value: number;
  unit: string;
}

/** 时间线任务项 */
interface TimelineTaskItem {
  name: string;
  start: string;
  end: string;
  type: TaskType | undefined;
  status: TaskStatus;
}

/** 看板列数据 */
interface KanbanColumn {
  name: string;
  tasks: Task[];
}

export function generateGanttChart(
  data: VisualizationData,
  options: VisualizationOptions
): ChartData {
  return {
    type: 'gantt',
    title: '项目甘特图',
    data: data.tasks.map(
      (task: Task): GanttTaskItem => ({
        id: task.id,
        name: (task.title ?? task.name ?? ""),
        start: new Date().toISOString().split('T')[0],
        duration: task.estimatedHours || 8,
        progress: task.progress || 0,
        dependencies: task.dependencies || [],
        type: task.type,
        priority: task.priority,
      })
    ),
    config: {
      theme: options.theme || 'light',
      showProgress: true,
      showDependencies: true,
      showMilestones: options.features?.includes('milestones'),
    },
  };
}

export function generatePieChart(
  data: VisualizationData,
  options: VisualizationOptions
): ChartData {
  const taskTypes = data.tasks.reduce<Record<string, number>>((acc, task: Task) => {
    const type = task.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const total = data.tasks.length;

  return {
    type: 'pie',
    title: '任务类型分布',
    data: Object.entries(taskTypes).map(
      ([type, count]): PieDataItem => ({
        name: type,
        value: count,
        percentage: ((count / total) * 100).toFixed(1),
      })
    ),
    config: {
      theme: options.theme || 'light',
      showLabels: true,
      showPercentages: true,
    },
  };
}

export function generateBarChart(
  data: VisualizationData,
  options: VisualizationOptions
): ChartData {
  const workloadByType = data.tasks.reduce<Record<string, number>>((acc, task: Task) => {
    const type = task.type || 'unknown';
    acc[type] = (acc[type] || 0) + (task.estimatedHours || 0);
    return acc;
  }, {});

  return {
    type: 'bar',
    title: '工时分布统计',
    data: Object.entries(workloadByType).map(
      ([type, hours]): BarDataItem => ({
        name: type,
        value: hours,
        unit: '小时',
      })
    ),
    config: {
      theme: options.theme || 'light',
      showValues: true,
      orientation: 'vertical',
    },
  };
}

export function generateTimelineChart(
  data: VisualizationData,
  options: VisualizationOptions
): ChartData {
  return {
    type: 'timeline',
    title: '项目时间线',
    data: data.tasks.map(
      (task: Task): TimelineTaskItem => ({
        name: (task.title ?? task.name ?? ""),
        start: new Date().toISOString(),
        end: new Date(Date.now() + (task.estimatedHours || 8) * 60 * 60 * 1000).toISOString(),
        type: task.type,
        status: task.status,
      })
    ),
    config: {
      theme: options.theme || 'light',
      showToday: true,
      groupBy: 'type',
    },
  };
}

export function generateKanbanChart(
  data: VisualizationData,
  options: VisualizationOptions
): ChartData {
  const columns: TaskStatus[] = ['todo', 'in-progress', 'review', 'done'];
  const kanbanData: KanbanColumn[] = columns.map(status => ({
    name: status,
    tasks: data.tasks.filter((task: Task) => task.status === status),
  }));

  return {
    type: 'kanban',
    title: '任务看板',
    data: kanbanData,
    config: {
      theme: options.theme || 'light',
      showTaskDetails: true,
      allowDragDrop: false,
    },
  };
}

export function generateCharts(
  data: VisualizationData,
  options: VisualizationOptions
): ChartData[] {
  const charts: ChartData[] = [];

  switch (options.type) {
    case 'gantt':
      charts.push(generateGanttChart(data, options));
      break;
    case 'pie':
      charts.push(generatePieChart(data, options));
      break;
    case 'bar':
      charts.push(generateBarChart(data, options));
      break;
    case 'timeline':
      charts.push(generateTimelineChart(data, options));
      break;
    case 'kanban':
      charts.push(generateKanbanChart(data, options));
      break;
    case 'combined':
      charts.push(
        generateGanttChart(data, options),
        generatePieChart(data, options),
        generateBarChart(data, options)
      );
      break;
  }

  return charts;
}
