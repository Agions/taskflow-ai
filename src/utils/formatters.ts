import { Task, TaskStatus, TaskPriority } from '../types/task';

/**
 * 格式化任务状态
 * @param status 任务状态
 */
export function formatTaskStatus(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.PENDING:
      return '等待中';
    case TaskStatus.RUNNING:
      return '执行中';
    case TaskStatus.COMPLETED:
      return '已完成';
    case TaskStatus.FAILED:
      return '失败';
    case TaskStatus.BLOCKED:
      return '被阻塞';
    default:
      return '未知';
  }
}

/**
 * 格式化任务优先级
 * @param priority 任务优先级
 */
export function formatTaskPriority(priority: TaskPriority): string {
  switch (priority) {
    case TaskPriority.LOW:
      return '低';
    case TaskPriority.MEDIUM:
      return '中';
    case TaskPriority.HIGH:
      return '高';
    case TaskPriority.CRITICAL:
      return '紧急';
    default:
      return '未知';
  }
}

/**
 * 格式化日期
 * @param date 日期对象或日期字符串
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化持续时间（分钟）
 * @param minutes 分钟数
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} 分钟`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (mins === 0) {
      return `${hours} 小时`;
    } else {
      return `${hours} 小时 ${mins} 分钟`;
    }
  }
}

/**
 * 任务进度
 * @param tasks 任务数组
 */
export function calculateProgress(tasks: Task[]): number {
  if (tasks.length === 0) {
    return 100; // 没有任务视为100%完成
  }

  const countTasks = (taskList: Task[]): { total: number; completed: number } => {
    let total = taskList.length;
    let completed = 0;
    
    for (const task of taskList) {
      if (task.status === TaskStatus.COMPLETED) {
        completed++;
      }
      
        // 递归计算子任务
       if ('subtasks' in task && Array.isArray(task.subtasks) && task.subtasks.length > 0) {
         const subResult = countTasks(task.subtasks as Task[]);
         total += subResult.total;
         completed += subResult.completed;
       }
    }
    
    return { total, completed };
  };

  const result = countTasks(tasks);
  return Math.round((result.completed / result.total) * 100);
}

/**
 * 格式化进度百分比
 * @param percent 百分比数值
 */
export function formatProgress(percent: number): string {
  return `${percent}%`;
}

/**
 * 截断字符串
 * @param str 原始字符串
 * @param maxLength 最大长度
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength - 3) + '...';
} 