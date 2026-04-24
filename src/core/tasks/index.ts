/**
 * 任务管理模块
 * TaskFlow AI v4.0 - Unified Task Management
 */

import { ExtensionType } from '../../types/extensions';
import { PRDDocument } from '../../types/prd';
import { Task } from '../../types/task';

export interface TaskDefinition {
  id: string;
  name: string;
  type: 'agent' | 'tool' | 'workflow';
  description?: string;
  config: Record<string, unknown>;
}

export class TaskGenerator {
  // 任务生成器实现

  /**
   * 从PRD文档生成任务
   */
  async generateTasks(prd: PRDDocument): Promise<Task[]> {
    // 简单的任务生成实现
    const tasks: Task[] = [];
    
    if (!prd.sections || prd.sections.length === 0) {
      return tasks;
    }

    // 根据 PRD sections 生成任务
    for (let i = 0; i < prd.sections.length; i++) {
      const section = prd.sections[i];
      tasks.push({
        id: `task-${Date.now()}-${i}`,
        name: section.title || `Task ${i + 1}`,
        title: section.title || `Task ${i + 1}`,
        description: section.content || '',
        status: 'todo',
        priority: 'medium',
        type: 'code',
        dependsOn: [],
        tags: [section.type || 'general'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        estimatedHours: 8,
        metadata: {
          sectionId: section.id,
          sectionType: section.type,
        },
      });
    }

    return tasks;
  }
}

export interface TaskExecutor {
  execute(task: TaskDefinition): Promise<unknown>;
}

export interface TaskRegistry {
  register(taskType: string, executor: TaskExecutor): void;
  get(taskType: string): TaskExecutor | undefined;
  list(): string[];
}