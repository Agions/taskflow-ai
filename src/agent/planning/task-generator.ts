import { getLogger } from '../../utils/logger';
const logger = getLogger('module');
/**
 * 任务生成器
 */

import { PRDDocument, Task, TaskType, TaskPriority, TaskStatus } from '../../types';

interface AIService {
  complete(prompt: string, options?: unknown): Promise<string>;
}

export class TaskGenerator {
  constructor(private ai: AIService) {}

  async generate(prd: PRDDocument): Promise<Task[]> {
    const prompt = this.buildTaskGenerationPrompt(prd);

    try {
      const response = await this.ai.complete(prompt, {
        temperature: 0.4,
        maxTokens: 3000,
      });
      const taskData = this.parseTaskResponse(response);
      return this.enrichTasks(taskData, prd);
    } catch (error) {
      logger.error('Task generation failed:', error);
      return this.getDefaultTasks(prd);
    }
  }

  private buildTaskGenerationPrompt(prd: PRDDocument): string {
    return `Generate tasks for the following PRD:

Title: ${prd.title}

Generate tasks in JSON format:
[
  {
    "title": "Task title",
    "description": "Task description",
    "type": "code|test|analysis|design|documentation|deployment",
    "priority": "high|medium|low",
    "estimate": 2
  }
]`;
  }

  private parseTaskResponse(response: string): Array<Partial<Task>> {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {}
    return [];
  }

  private enrichTasks(taskData: Array<Partial<Task>>, prd: PRDDocument): Task[] {
    const now = new Date();
    return taskData.map((data, index) => ({
      id: `task-${index + 1}`,
      name: data.title || `Task ${index + 1}`,
      title: data.title || `Task ${index + 1}`,
      description: data.description || '',
      type: (data.type as TaskType) || 'code',
      status: (data.status as TaskStatus) || 'pending',
      priority: (data.priority as TaskPriority) || 'medium',
      dependsOn: data.dependsOn || [],
      tags: data.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  }

  private getDefaultTasks(prd: PRDDocument): Task[] {
    const now = new Date();
    return [
      {
        id: 'task-1',
        name: `Implement ${prd.title}`,
        title: `Implement ${prd.title}`,
        description: 'Implementation task',
        type: 'code',
        status: 'pending',
        priority: 'high',
        dependsOn: [],
        tags: [],
createdAt: Date.now(),
      updatedAt: Date.now(),
      },
    ];
  }
}
