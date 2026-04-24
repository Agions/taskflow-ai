import { getLogger } from '../../utils/logger';
/**
 * 规划引擎
 * 使用 AI 分析 PRD 并生成任务计划
 */

import { PRDDocument, TaskPlan } from '../types';
import { Task } from '../../types/task';
import { Dependency } from '../types';
import { RequirementAnalyzer } from './analyzer';
import { TaskGenerator } from './task-generator';
import { DependencyAnalyzer } from './dependency-analyzer';
const logger = getLogger('agent/planning/index');

interface AIService {
  complete(prompt: string, options?: unknown): Promise<string>;
}

export * from './analyzer';
export * from './task-generator';
export * from './dependency-analyzer';

export class PlanningEngine {
  private analyzer: RequirementAnalyzer;
  private taskGenerator: TaskGenerator;
  private dependencyAnalyzer: DependencyAnalyzer;

  constructor(ai: AIService) {
    this.analyzer = new RequirementAnalyzer(ai);
    this.taskGenerator = new TaskGenerator(ai);
    this.dependencyAnalyzer = new DependencyAnalyzer();
  }

  async plan(prd: PRDDocument): Promise<TaskPlan> {
    logger.info('🧠 Analyzing PRD with AI...');

    const analysis = await this.analyzer.analyze(prd);
    const prdForGenerator: any = {
      ...prd,
      version: prd.version || '1.0.0',
      filePath: prd.filePath || '',
      sections: prd.sections || [],
      createdAt: prd.createdAt || new Date().toISOString(),
      updatedAt: prd.updatedAt || new Date().toISOString(),
    };
    const tasks = await this.taskGenerator.generate(prdForGenerator);
    const agentTasks = this.convertToAgentTasks(tasks);
    const dependencies = this.dependencyAnalyzer.analyze(agentTasks);
    const criticalPath = this.dependencyAnalyzer.calculateCriticalPath(agentTasks, dependencies);
    const totalEstimate = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    return {
      tasks: agentTasks,
      dependencies,
      totalEstimate,
      criticalPath,
    };
  }

  private convertToAgentTasks(tasks: Task[]): import('../types').Task[] {
    return tasks.map(task => ({
      id: task.id,
      title: task.title || task.name,
      description: task.description,
      type: task.type as any,
      status: task.status as any,
      priority: task.priority as any,
      estimate: task.estimatedHours || 0,
      assignee: undefined,
      dependencies: task.dependsOn || [],
      outputPath: undefined,
      metadata: {
        framework: undefined,
        language: undefined,
        template: undefined,
        source: (task.metadata?.source || '') as string,
        tags: task.tags || [],
      },
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
    }));
  }

  async createPlan(requirements: string): Promise<TaskPlan> {
    const prd: PRDDocument = {
      id: `prd-${Date.now()}`,
      title: 'Generated Plan',
      description: requirements,
      content: requirements,
      requirements: [],
      acceptanceCriteria: [],
      metadata: {
        author: 'taskflow-ai',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        tags: [],
      },
    };
    return this.plan(prd);
  }
}

export default PlanningEngine;
