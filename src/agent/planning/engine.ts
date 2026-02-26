/**
 * 规划引擎
 * 使用 AI 分析 PRD 并生成任务计划
 */

import {
  PRDDocument,
  TaskPlan,
  Task,
  Dependency,
  RequirementAnalysis,
  Feature,
  Risk,
  TaskType,
  TaskPriority,
  TaskMetadata
} from '../types';

// AI 接口（简化版，实际使用 OpenAI 或其他 AI 服务）
interface AIService {
  complete(prompt: string, options?: any): Promise<string>;
}

export class PlanningEngine {
  private ai: AIService;

  constructor(ai: AIService) {
    this.ai = ai;
  }

  /**
   * 从 PRD 生成任务计划
   */
  async plan(prd: PRDDocument): Promise<TaskPlan> {
    console.log('🧠 Analyzing PRD with AI...');

    // 1. 分析需求
    const analysis = await this.analyzeRequirements(prd);

    // 2. 生成任务
    const tasks = await this.generateTasks(prd, analysis);

    // 3. 分析依赖
    const dependencies = this.analyzeDependencies(tasks);

    // 4. 计算关键路径
    const criticalPath = this.calculateCriticalPath(tasks, dependencies);

    // 5. 计算总工时
    const totalEstimate = tasks.reduce((sum, t) => sum + t.estimate, 0);

    return {
      tasks,
      dependencies,
      totalEstimate,
      criticalPath
    };
  }

  /**
   * 分析 PRD 需求
   */
  async analyzeRequirements(prd: PRDDocument): Promise<RequirementAnalysis> {
    const prompt = this.buildAnalysisPrompt(prd);

    try {
      const response = await this.ai.complete(prompt, {
        temperature: 0.3,
        maxTokens: 2000
      });

      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('AI analysis failed:', error);
      // 返回默认分析
      return this.getDefaultAnalysis(prd);
    }
  }

  /**
   * 生成任务列表
   */
  private async generateTasks(
    prd: PRDDocument,
    analysis: RequirementAnalysis
  ): Promise<Task[]> {
    const prompt = this.buildTaskGenerationPrompt(prd, analysis);

    try {
      const response = await this.ai.complete(prompt, {
        temperature: 0.4,
        maxTokens: 3000
      });

      const taskData = this.parseTaskResponse(response);
      return this.enrichTasks(taskData, prd);
    } catch (error) {
      console.error('Task generation failed:', error);
      // 返回基于模板的默认任务
      return this.getDefaultTasks(prd);
    }
  }

  /**
   * 分析任务依赖
   */
  private analyzeDependencies(tasks: Task[]): Dependency[] {
    const dependencies: Dependency[] = [];

    // 基于任务类型和元数据分析依赖
    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const taskA = tasks[i];
        const taskB = tasks[j];

        // 检查是否有显式依赖
        if (taskB.dependencies.includes(taskA.id)) {
          dependencies.push({
            from: taskA.id,
            to: taskB.id,
            type: 'blocks'
          });
        }

        // 基于任务类型推断依赖
        if (this.hasImplicitDependency(taskA, taskB)) {
          dependencies.push({
            from: taskA.id,
            to: taskB.id,
            type: 'depends-on'
          });
        }
      }
    }

    return dependencies;
  }

  /**
   * 计算关键路径
   */
  private calculateCriticalPath(tasks: Task[], dependencies: Dependency[]): string[] {
    // 简化实现：返回最长依赖链
    const graph = this.buildDependencyGraph(tasks, dependencies);
    const path: string[] = [];
    const visited = new Set<string>();

    const dfs = (taskId: string, currentPath: string[]) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);
      currentPath.push(taskId);

      const nextTasks = graph.get(taskId) || [];
      if (nextTasks.length === 0) {
        if (currentPath.length > path.length) {
          path.length = 0;
          path.push(...currentPath);
        }
      } else {
        for (const next of nextTasks) {
          dfs(next, [...currentPath]);
        }
      }
    };

    // 从入度为 0 的任务开始
    const inDegree = new Map<string, number>();
    for (const task of tasks) {
      inDegree.set(task.id, 0);
    }
    for (const dep of dependencies) {
      inDegree.set(dep.to, (inDegree.get(dep.to) || 0) + 1);
    }

    for (const [taskId, degree] of inDegree) {
      if (degree === 0) {
        dfs(taskId, []);
      }
    }

    return path;
  }

  /**
   * 构建依赖图
   */
  private buildDependencyGraph(
    tasks: Task[],
    dependencies: Dependency[]
  ): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const task of tasks) {
      graph.set(task.id, []);
    }

    for (const dep of dependencies) {
      const next = graph.get(dep.from) || [];
      next.push(dep.to);
      graph.set(dep.from, next);
    }

    return graph;
  }

  /**
   * 检查隐式依赖
   */
  private hasImplicitDependency(taskA: Task, taskB: Task): boolean {
    // API 定义在实现之前
    if (taskA.type === 'analysis' && taskB.type === 'code') {
      return true;
    }

    // 数据库模型在 API 之前
    if (taskA.metadata.tags.includes('model') && taskB.metadata.tags.includes('api')) {
      return true;
    }

    // 组件在页面之前
    if (taskA.metadata.tags.includes('component') && taskB.metadata.tags.includes('page')) {
      return true;
    }

    return false;
  }

  /**
   * 构建分析提示
   */
  private buildAnalysisPrompt(prd: PRDDocument): string {
    return `Analyze this Product Requirements Document (PRD) and extract key information.

PRD Title: ${prd.title}
Description: ${prd.description}

Requirements:
${prd.requirements.map(r => `- [${r.priority}] ${r.title}: ${r.description}`).join('\n')}

Acceptance Criteria:
${prd.acceptanceCriteria.map(c => `- ${c}`).join('\n')}

Please analyze and provide:
1. Features to implement (name, description, complexity: low/medium/high)
2. Technical constraints
3. Potential risks (description, probability: low/medium/high, impact: low/medium/high, mitigation)

Output in JSON format:
{
  "features": [...],
  "technicalConstraints": [...],
  "risks": [...]
}`;
  }

  /**
   * 构建任务生成提示
   */
  private buildTaskGenerationPrompt(
    prd: PRDDocument,
    analysis: RequirementAnalysis
  ): string {
    return `Generate a detailed task plan for implementing this feature.

PRD: ${prd.title}
Features:
${analysis.features.map(f => `- ${f.name} (${f.complexity}): ${f.description}`).join('\n')}

Technical Constraints:
${analysis.technicalConstraints.map(c => `- ${c}`).join('\n')}

Generate tasks with:
1. Title
2. Description
3. Type (code/design/test/analysis/shell)
4. Priority (critical/high/medium/low)
5. Estimate in hours
6. Dependencies (task IDs)
7. Output file path (if applicable)
8. Tags

Output in JSON format:
{
  "tasks": [
    {
      "title": "...",
      "description": "...",
      "type": "code",
      "priority": "high",
      "estimate": 4,
      "dependencies": [],
      "outputPath": "src/components/Button.tsx",
      "tags": ["component", "ui"]
    }
  ]
}`;
  }

  /**
   * 解析分析响应
   */
  private parseAnalysisResponse(response: string): RequirementAnalysis {
    try {
      // 提取 JSON 部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse analysis:', error);
    }

    return this.getDefaultAnalysis({} as PRDDocument);
  }

  /**
   * 解析任务响应
   */
  private parseTaskResponse(response: string): any[] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return data.tasks || [];
      }
    } catch (error) {
      console.error('Failed to parse tasks:', error);
    }

    return [];
  }

  /**
   * 丰富任务信息
   */
  private enrichTasks(taskData: any[], prd: PRDDocument): Task[] {
    return taskData.map((t, index) => ({
      id: `T${String(index + 1).padStart(3, '0')}`,
      title: t.title,
      description: t.description,
      type: (t.type as TaskType) || 'code',
      status: 'pending',
      priority: (t.priority as TaskPriority) || 'medium',
      estimate: t.estimate || 4,
      assignee: undefined,
      dependencies: t.dependencies || [],
      outputPath: t.outputPath,
      metadata: {
        framework: t.framework,
        language: t.language || 'typescript',
        template: t.template,
        tags: t.tags || []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  /**
   * 获取默认分析
   */
  private getDefaultAnalysis(prd: PRDDocument): RequirementAnalysis {
    return {
      features: [
        {
          name: 'Core Feature',
          description: prd.description || 'Main feature implementation',
          complexity: 'medium',
          dependencies: []
        }
      ],
      technicalConstraints: ['TypeScript', 'React'],
      risks: []
    };
  }

  /**
   * 获取默认任务
   */
  private getDefaultTasks(prd: PRDDocument): Task[] {
    return [
      {
        id: 'T001',
        title: 'Setup Project Structure',
        description: 'Initialize project and setup basic structure',
        type: 'shell',
        status: 'pending',
        priority: 'high',
        estimate: 2,
        dependencies: [],
        metadata: { tags: ['setup'] },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'T002',
        title: 'Implement Core Feature',
        description: prd.description || 'Implement the main feature',
        type: 'code',
        status: 'pending',
        priority: 'high',
        estimate: 8,
        dependencies: ['T001'],
        metadata: { tags: ['core'] },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'T003',
        title: 'Write Tests',
        description: 'Add unit tests for the feature',
        type: 'test',
        status: 'pending',
        priority: 'medium',
        estimate: 4,
        dependencies: ['T002'],
        metadata: { tags: ['test'] },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
}

export default PlanningEngine;
