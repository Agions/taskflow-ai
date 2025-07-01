import { ModelType } from '../types/config';
import { Task, TaskPlan, TaskStatus } from '../types/task';
import path from 'path';

/**
 * 验证模型类型是否有效
 * @param type 模型类型
 */
export function isValidModelType(type: string): boolean {
  return Object.values(ModelType).includes(type as ModelType);
}

/**
 * 验证文件是否为PRD文档
 * @param filePath 文件路径
 */
export function isPRDDocument(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ['.md', '.txt', '.pdf'].includes(ext);
}

/**
 * 验证任务计划是否有效
 * @param plan 任务计划对象
 */
export function isValidTaskPlan(plan: unknown): plan is TaskPlan {
  if (!plan || typeof plan !== 'object') return false;
  
  const p = plan as Partial<TaskPlan>;
  
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    typeof p.description === 'string' &&
    Array.isArray(p.tasks) &&
    p.createdAt instanceof Date &&
    p.updatedAt instanceof Date &&
    (p.status === 'draft' || p.status === 'active' || p.status === 'completed' || p.status === 'archived')
  );
}

/**
 * 验证任务是否有效
 * @param task 任务对象
 */
export function isValidTask(task: unknown): task is Task {
  if (!task || typeof task !== 'object') return false;
  
  const t = task as Partial<Task>;
  
  return (
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    typeof t.description === 'string' &&
    Object.values(TaskStatus).includes(t.status as TaskStatus) &&
    Array.isArray(t.dependencies)
  );
}

/**
 * 验证API密钥格式是否正确
 * @param apiKey API密钥字符串
 */
export function isValidApiKey(apiKey: string): boolean {
  // 这里的验证规则是通用的，具体模型可能有不同的格式要求
  return typeof apiKey === 'string' && apiKey.trim().length > 8;
}

/**
 * 检查依赖关系是否形成循环
 * @param tasks 任务列表
 */
export function hasCyclicDependencies(tasks: Task[]): boolean {
  // 创建任务ID到任务的映射
  const taskMap = new Map<string, Task>();
  tasks.forEach(task => taskMap.set(task.id, task));
  
  // 使用DFS检测环
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function hasCycle(taskId: string): boolean {
    // 将当前节点添加到访问集和递归栈
    visited.add(taskId);
    recursionStack.add(taskId);
    
    const task = taskMap.get(taskId);
    if (!task) return false; // 任务不存在
    
    // 检查所有依赖
    for (const depId of task.dependencies) {
      // 如果依赖不在访问集中，递归检查
      if (!visited.has(depId)) {
        if (hasCycle(depId)) {
          return true;
        }
      } 
      // 如果依赖在递归栈中，说明有环
      else if (recursionStack.has(depId)) {
        return true;
      }
    }
    
    // 回溯，从递归栈中移除当前节点
    recursionStack.delete(taskId);
    return false;
  }
  
  // 对每个未访问的任务进行DFS
  for (const task of tasks) {
    if (!visited.has(task.id)) {
      if (hasCycle(task.id)) {
        return true;
      }
    }
  }
  
  return false;
} 