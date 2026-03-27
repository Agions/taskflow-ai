/**
 * 任务生成器
 */

import { PRDDocument, Task, RequirementAnalysis, TaskType, TaskPriority } from '../types';

interface AIService {
  complete(prompt: string, options?: any): Promise<string>;
}

export class TaskGenerator {
  constructor(private ai: AIService) {}

  async generate(prd: PRDDocument, analysis: RequirementAnalysis): Promise<Task[]> {
    const prompt = this.buildTaskGenerationPrompt(prd, analysis);

    try {
      const response = await this.ai.complete(prompt, {
        temperature: 0.4,
        maxTokens: 3000,
      });
      const taskData = this.parseTaskResponse(response);
      return this.enrichTasks(taskData, prd);
    } catch (error) {
      console.error('Task generation failed:', error);
      return this.getDefaultTasks(prd);
    }
  }

  private buildTaskGenerationPrompt(prd: PRDDocument, analysis: RequirementAnalysis): string {
    const features = analysis.features.map(f => `- ${f.name}: ${f.description}`).join('\n');

    return `Generate tasks for the following PRD:

Title: ${prd.title}
Description: ${prd.description}

Features:
${features}

Generate tasks in JSON format:
[
  {
    "title": "Task title",
    "description": "Task description",
    "type": "code|file|shell|analysis|design|test",
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
      title: data.title || `Task ${index + 1}`,
      description: data.description || '',
      type: (data.type as TaskType) || 'code',
      status: 'pending' as const,
      priority: (data.priority as TaskPriority) || 'medium',
      estimate: data.estimate || 2,
      dependencies: data.dependencies || [],
      metadata: {
        source: prd.title,
        tags: [],
      },
      createdAt: now,
      updatedAt: now,
    }));
  }

  private getDefaultTasks(prd: PRDDocument): Task[] {
    const now = new Date();
    return [
      {
        id: 'task-1',
        title: `Implement ${prd.title}`,
        description: prd.description || 'Implementation task',
        type: 'code',
        status: 'pending',
        priority: 'high',
        estimate: 4,
        dependencies: [],
        metadata: { source: prd.title, tags: [] },
        createdAt: now,
        updatedAt: now,
      },
    ];
  }
}
