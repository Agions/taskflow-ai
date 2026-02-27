/**
 * 仪表板组件
 * 用于显示项目状态概览
 */

import chalk from 'chalk';
import boxen from 'boxen';
import { theme } from './index';

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  blocked: number;
}

interface ProjectStatus {
  name: string;
  version: string;
  status: 'active' | 'completed' | 'paused' | 'error';
  progress: number;
  tasks: TaskStats;
  lastUpdated: string;
}

interface SystemStatus {
  nodeVersion: string;
  platform: string;
  memory: {
    used: number;
    total: number;
  };
  uptime: string;
}

/**
 * 显示项目仪表板
 */
export function projectDashboard(project: ProjectStatus): void {
  const statusColor = {
    active: theme.success,
    completed: theme.primary,
    paused: theme.warning,
    error: theme.error
  }[project.status];

  const statusIcon = {
    active: '▶',
    completed: '✓',
    paused: '⏸',
    error: '✗'
  }[project.status];

  // 进度条
  const progressWidth = 30;
  const filled = Math.round((project.progress / 100) * progressWidth);
  const empty = progressWidth - filled;
  const progressBar = theme.success('█'.repeat(filled)) + theme.muted('░'.repeat(empty));

  // 任务统计
  const taskSummary = [
    `${theme.success('●')} ${project.tasks.completed} 完成`,
    `${theme.warning('●')} ${project.tasks.inProgress} 进行中`,
    `${theme.info('●')} ${project.tasks.pending} 待处理`,
    `${theme.error('●')} ${project.tasks.blocked} 阻塞`
  ].join('  ');

  const content = [
    `${theme.highlight(project.name)} ${theme.muted('v' + project.version)}`,
    '',
    `状态: ${statusColor(`${statusIcon} ${project.status.toUpperCase()}`)}`,
    `进度: [${progressBar}] ${theme.highlight(project.progress + '%')}`,
    '',
    taskSummary,
    '',
    theme.muted(`最后更新: ${project.lastUpdated}`)
  ].join('\n');

  console.log(boxen(content, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    title: theme.primary(' PROJECT STATUS '),
    titleAlignment: 'center'
  }));
}

/**
 * 显示系统状态
 */
export function systemDashboard(system: SystemStatus): void {
  const memoryPercent = Math.round((system.memory.used / system.memory.total) * 100);
  const memoryBarWidth = 20;
  const memoryFilled = Math.round((memoryPercent / 100) * memoryBarWidth);
  const memoryBar = theme.warning('█'.repeat(memoryFilled)) + theme.muted('░'.repeat(memoryBarWidth - memoryFilled));

  const content = [
    `Node.js: ${theme.info(system.nodeVersion)}`,
    `平台: ${theme.info(system.platform)}`,
    '',
    `内存: [${memoryBar}] ${memoryPercent}%`,
    `      ${theme.muted(`${system.memory.used}MB / ${system.memory.total}MB`)}`,
    '',
    `运行时间: ${theme.info(system.uptime)}`
  ].join('\n');

  console.log(boxen(content, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'blue',
    title: theme.secondary(' SYSTEM INFO '),
    titleAlignment: 'center'
  }));
}

/**
 * 显示任务列表
 */
export function taskList(tasks: Array<{
  id: string;
  name: string;
  status: 'completed' | 'in-progress' | 'pending' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  assignee?: string;
}>): void {
  if (tasks.length === 0) {
    console.log(theme.muted('暂无任务'));
    return;
  }

  console.log('\n' + theme.highlight('◆ 任务列表'));
  console.log(theme.muted('─'.repeat(60)));

  tasks.forEach(task => {
    const statusIcon = {
      completed: theme.success('✓'),
      'in-progress': theme.warning('◐'),
      pending: theme.muted('○'),
      blocked: theme.error('✗')
    }[task.status];

    const priorityColor = {
      high: theme.error,
      medium: theme.warning,
      low: theme.info
    }[task.priority];

    const priorityTag = priorityColor(`[${task.priority.toUpperCase()}]`);
    const assignee = task.assignee ? theme.muted(`@${task.assignee}`) : '';

    console.log(`  ${statusIcon} ${theme.info(task.name)} ${priorityTag} ${assignee}`);
  });

  console.log();
}

/**
 * 显示时间线
 */
export function timeline(events: Array<{
  time: string;
  event: string;
  status: 'success' | 'info' | 'warning' | 'error';
}>): void {
  console.log('\n' + theme.highlight('◆ 最近活动'));
  console.log(theme.muted('─'.repeat(60)));

  events.forEach((event, index) => {
    const isLast = index === events.length - 1;
    const connector = isLast ? '└─' : '├─';
    const line = isLast ? '  ' : '│ ';

    const statusColor = {
      success: theme.success,
      info: theme.info,
      warning: theme.warning,
      error: theme.error
    }[event.status];

    const icon = {
      success: '✓',
      info: 'ℹ',
      warning: '⚠',
      error: '✗'
    }[event.status];

    console.log(`  ${theme.muted(connector)} ${statusColor(icon)} ${theme.info(event.event)}`);
    console.log(`  ${theme.muted(line)} ${theme.muted(event.time)}`);
  });

  console.log();
}

/**
 * 显示统计卡片
 */
export function statCards(stats: Array<{
  label: string;
  value: string | number;
  change?: number;
  unit?: string;
}>): void {
  const cards = stats.map(stat => {
    const changeStr = stat.change !== undefined
      ? stat.change >= 0
        ? theme.success(`+${stat.change}${stat.unit || ''}`)
        : theme.error(`${stat.change}${stat.unit || ''}`)
      : '';

    return boxen(
      `${theme.muted(stat.label)}\n${theme.highlight(String(stat.value))} ${changeStr}`,
      {
        padding: { left: 2, right: 2, top: 1, bottom: 1 },
        borderStyle: 'round',
        borderColor: 'gray',
        dimBorder: true
      }
    );
  });

  // 简单并排显示
  console.log('\n' + cards.join('  '));
  console.log();
}

// 导出所有仪表板组件
export const dashboard = {
  project: projectDashboard,
  system: systemDashboard,
  tasks: taskList,
  timeline,
  stats: statCards
};

export default dashboard;
