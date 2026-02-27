/**
 * 规划引擎
 * 使用 AI 分析 PRD 并生成任务计划
 */

import { PRDDocument, TaskPlan, Task, Dependency } from '../types';
import { RequirementAnalyzer } from './analyzer';
import { TaskGenerator } from './task-generator';
import { DependencyAnalyzer } from './dependency-analyzer';

interface AIService {
  complete(prompt: string, options?: any): Promise<string>;
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
    console.log('🧠 Analyzing PRD with AI...');

    const analysis = await this.analyzer.analyze(prd);
    const tasks = await this.taskGenerator.generate(prd, analysis);
    const dependencies = this.dependencyAnalyzer.analyze(tasks);
    const criticalPath = this.dependencyAnalyzer.calculateCriticalPath(tasks, dependencies);
    const totalEstimate = tasks.reduce((sum, t) => sum + t.estimate, 0);

    return {
      tasks,
      dependencies,
      totalEstimate,
      criticalPath
    };
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
        tags: []
      }
    };
    return this.plan(prd);
  }
}

export default PlanningEngine;
