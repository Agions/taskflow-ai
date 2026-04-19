/**
 * 可视化相关类型
 */

/**
 * 输出格式
 */
export type OutputFormat = string;

/**
 * 可视化配置
 */
export interface VisualizationConfig {
  type: ChartType;
  title: string;
  data: unknown;
  options: ChartOptions;
}

/**
 * 图表类型
 */
export type ChartType = 'gantt' | 'burndown' | 'pie' | 'bar' | 'line' | 'timeline' | 'kanban';

/**
 * 图表选项
 */
export interface ChartOptions {
  responsive: boolean;
  theme: 'light' | 'dark';
  colors: string[];
  animation: boolean;
  legend: boolean;
  grid: boolean;
}
