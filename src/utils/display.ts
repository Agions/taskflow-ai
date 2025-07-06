/**
 * TaskFlow AI - 显示工具
 * 
 * 提供各种数据显示和可视化功能
 * 
 * @author TaskFlow AI Team
 * @version 1.0.0
 */

import chalk from 'chalk';
import { Task } from '../types/task.js';

/**
 * 显示表格数据
 */
export function displayTable(data: any[]): void {
  if (data.length === 0) {
    console.log(chalk.yellow('📋 没有数据可显示'));
    return;
  }

  // 获取所有列名
  const columns = Object.keys(data[0]);
  const columnWidths = new Map<string, number>();

  // 计算每列的最大宽度
  columns.forEach(col => {
    const maxWidth = Math.max(
      col.length,
      ...data.map(row => String(row[col] || '').length)
    );
    columnWidths.set(col, Math.min(maxWidth, 30)); // 限制最大宽度
  });

  // 显示表头
  const headerRow = columns.map(col => 
    chalk.bold.blue(col.padEnd(columnWidths.get(col)!))
  ).join(' │ ');
  
  console.log('┌' + '─'.repeat(headerRow.length - 10) + '┐');
  console.log('│ ' + headerRow + ' │');
  console.log('├' + '─'.repeat(headerRow.length - 10) + '┤');

  // 显示数据行
  data.forEach(row => {
    const dataRow = columns.map(col => {
      const value = String(row[col] || '');
      const width = columnWidths.get(col)!;
      
      // 根据内容类型着色
      let coloredValue = value;
      if (col.includes('状态') || col.includes('Status')) {
        coloredValue = getStatusColor(value);
      } else if (col.includes('优先级') || col.includes('Priority')) {
        coloredValue = getPriorityColor(value);
      } else if (col.includes('关键') || col.includes('Critical')) {
        coloredValue = value === '✅' ? chalk.green(value) : chalk.gray(value);
      }
      
      return coloredValue.padEnd(width);
    }).join(' │ ');
    
    console.log('│ ' + dataRow + ' │');
  });

  console.log('└' + '─'.repeat(headerRow.length - 10) + '┘');
}

/**
 * 显示任务列表
 */
export function displayTaskList(tasks: Task[], options: { showTimeInfo?: boolean } = {}): void {
  if (tasks.length === 0) {
    console.log(chalk.yellow('📋 没有任务可显示'));
    return;
  }

  tasks.forEach((task, index) => {
    const statusIcon = getStatusIcon(task.status);
    const priorityColor = getPriorityColor(task.priority);
    
    console.log(`${index + 1}. ${statusIcon} ${chalk.bold(task.name)}`);
    console.log(`   ${chalk.gray('ID:')} ${task.id.substring(0, 8)}`);
    console.log(`   ${chalk.gray('优先级:')} ${priorityColor}`);
    console.log(`   ${chalk.gray('类型:')} ${task.type}`);
    
    if (task.estimatedHours) {
      console.log(`   ${chalk.gray('预计时长:')} ${task.estimatedHours}小时`);
    }
    
    if (options.showTimeInfo && task.timeInfo) {
      console.log(`   ${chalk.gray('最早开始:')} ${task.timeInfo.earliestStart ? new Date(task.timeInfo.earliestStart).toLocaleDateString() : '未设置'}`);
      console.log(`   ${chalk.gray('浮动时间:')} ${task.timeInfo.totalFloat ? task.timeInfo.totalFloat.toFixed(1) + '小时' : '未计算'}`);
      console.log(`   ${chalk.gray('关键任务:')} ${task.timeInfo.isCritical ? chalk.red('是') : chalk.green('否')}`);
    }
    
    if (task.dependencies && task.dependencies.length > 0) {
      console.log(`   ${chalk.gray('依赖:')} ${task.dependencies.join(', ')}`);
    }
    
    console.log(`   ${chalk.gray('描述:')} ${task.description}`);
    console.log('');
  });
}

/**
 * 显示甘特图（简化版）
 */
export function displayGanttChart(tasks: Task[]): void {
  console.log(chalk.bold.blue('📊 项目甘特图'));
  console.log('═'.repeat(60));
  
  if (tasks.length === 0) {
    console.log(chalk.yellow('没有任务数据'));
    return;
  }

  // 计算时间范围
  let minStart = Infinity;
  let maxEnd = 0;
  
  tasks.forEach(task => {
    if (task.timeInfo) {
      const start = task.timeInfo.earliestStart ? new Date(task.timeInfo.earliestStart).getTime() : 0;
      const duration = (task.timeInfo.estimatedDuration || task.estimatedHours || 8) * 60 * 60 * 1000;
      const end = start + duration;
      
      minStart = Math.min(minStart, start);
      maxEnd = Math.max(maxEnd, end);
    }
  });
  
  if (minStart === Infinity) {
    console.log(chalk.yellow('任务缺少时间信息，无法生成甘特图'));
    return;
  }
  
  const totalDuration = maxEnd - minStart;
  const chartWidth = 40; // 图表宽度
  
  tasks.forEach(task => {
    const name = task.name.substring(0, 15).padEnd(15);
    
    if (task.timeInfo && task.timeInfo.earliestStart) {
      const start = new Date(task.timeInfo.earliestStart).getTime();
      const duration = (task.timeInfo.estimatedDuration || task.estimatedHours || 8) * 60 * 60 * 1000;
      
      const startPos = Math.floor(((start - minStart) / totalDuration) * chartWidth);
      const taskWidth = Math.max(1, Math.floor((duration / totalDuration) * chartWidth));
      
      const chart = ' '.repeat(startPos) + 
                   (task.timeInfo.isCritical ? chalk.red('█'.repeat(taskWidth)) : chalk.blue('█'.repeat(taskWidth))) +
                   ' '.repeat(Math.max(0, chartWidth - startPos - taskWidth));
      
      console.log(`${name} │${chart}│`);
    } else {
      console.log(`${name} │${chalk.gray('─'.repeat(chartWidth))}│`);
    }
  });
  
  // 显示时间轴
  console.log(' '.repeat(15) + '│' + '─'.repeat(chartWidth) + '│');
  console.log(' '.repeat(15) + '│' + 
    new Date(minStart).toLocaleDateString().padEnd(chartWidth - 10) + 
    new Date(maxEnd).toLocaleDateString().padStart(10) + '│');
}

/**
 * 获取状态图标
 */
function getStatusIcon(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'done':
      return chalk.green('✅');
    case 'in_progress':
    case 'in-progress':
      return chalk.yellow('🔄');
    case 'blocked':
      return chalk.red('🚫');
    case 'cancelled':
      return chalk.gray('❌');
    default:
      return chalk.blue('📋');
  }
}

/**
 * 获取状态颜色
 */
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'done':
      return chalk.green(status);
    case 'in_progress':
    case 'in-progress':
      return chalk.yellow(status);
    case 'blocked':
      return chalk.red(status);
    case 'cancelled':
      return chalk.gray(status);
    default:
      return chalk.blue(status);
  }
}

/**
 * 获取优先级颜色
 */
function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'critical':
      return chalk.red.bold(priority);
    case 'high':
      return chalk.red(priority);
    case 'medium':
      return chalk.yellow(priority);
    case 'low':
      return chalk.green(priority);
    default:
      return chalk.gray(priority);
  }
}

/**
 * 显示进度条
 */
export function displayProgressBar(current: number, total: number, width: number = 30): string {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  const filled = Math.floor((percentage / 100) * width);
  const empty = width - filled;
  
  const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  return `[${bar}] ${percentage.toFixed(1)}%`;
}

/**
 * 显示统计信息
 */
export function displayStats(stats: Record<string, number>): void {
  console.log(chalk.bold.blue('📊 统计信息'));
  console.log('─'.repeat(30));
  
  Object.entries(stats).forEach(([key, value]) => {
    const formattedKey = key.padEnd(20);
    const formattedValue = typeof value === 'number' ? 
      (Number.isInteger(value) ? value.toString() : value.toFixed(2)) : 
      String(value);
    
    console.log(`${chalk.cyan(formattedKey)} ${chalk.white(formattedValue)}`);
  });
}

/**
 * 显示成功消息
 */
export function displaySuccess(message: string): void {
  console.log(chalk.green('✅ ' + message));
}

/**
 * 显示错误消息
 */
export function displayError(message: string): void {
  console.log(chalk.red('❌ ' + message));
}

/**
 * 显示警告消息
 */
export function displayWarning(message: string): void {
  console.log(chalk.yellow('⚠️ ' + message));
}

/**
 * 显示信息消息
 */
export function displayInfo(message: string): void {
  console.log(chalk.blue('ℹ️ ' + message));
}
