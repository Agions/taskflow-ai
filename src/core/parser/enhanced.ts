/**
 * 增强的 PRD 解析器
 * 支持 Word、PDF 格式，更智能的任务拆分
 */

import path = require('path');
import fs = require('fs-extra');
import { PRDDocument, PRDSection, Task as ProjectTask } from '../../types';
import { SUPPORTED_PRD_FORMATS } from '../../constants';
import { createTaskFlowError } from '../../utils/errors';
import { Logger } from '../../utils/logger';

export interface ParsedTask {
  title: string;
  description: string;
  type: 'development' | 'design' | 'testing' | 'documentation' | 'deployment' | 'research';
  priority: 'high' | 'medium' | 'low';
  estimatedHours: number;
  dependencies: string[];
  acceptanceCriteria: string[];
  skills?: string[];
  risks?: string[];
}

export interface Risk {
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation?: string;
}

/**
 * 智能任务拆分器
 */
export class TaskDecomposer {
  private logger = Logger.getInstance('TaskDecomposer');

  /**
   * 从 PRD 文档拆分任务
   */
  async decompose(document: PRDDocument): Promise<ProjectTask[]> {
    this.logger.info('开始智能任务拆分');

    const tasks: ProjectTask[] = [];
    const functionalSections = document.sections.filter(
      s => s.type === 'functional' || s.type === 'requirements'
    );

    let taskOrder = 0;

    for (const section of functionalSections) {
      const features = this.extractFeatures(section);

      for (const feature of features) {
        const featureTasks = await this.createTasksForFeature(
          feature,
          document.title,
          taskOrder,
          tasks
        );
        tasks.push(...featureTasks);
        taskOrder += featureTasks.length;
      }
    }

    this.estimateTaskHours(tasks);

    this.analyzeDependencies(tasks);

    this.logger.info(`任务拆分完成，生成 ${tasks.length} 个任务`);

    return tasks;
  }

  /**
   * 从章节中提取功能点
   */
  private extractFeatures(section: PRDSection): string[] {
    const features: string[] = [];

    const lines = section.content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.match(/^\d+\./)) {
        const feature = trimmed.replace(/^[-*\d.]+\s*/, '').trim();
        if (feature.length > 5) {
          features.push(feature);
        }
      }
    }

    return features;
  }

  /**
   * 为功能创建任务
   */
  private async createTasksForFeature(
    feature: string,
    projectName: string,
    startOrder: number,
    existingTasks: ProjectTask[]
  ): Promise<ProjectTask[]> {
    const tasks: ProjectTask[] = [];
    const featureId = feature.substring(0, 20).toLowerCase().replace(/\s+/g, '-');

    const type = this.determineTaskType(feature);

    tasks.push({
      id: `task-${startOrder + 1}`,
      title: `实现: ${feature}`,
      description: `开发 ${projectName} 的 ${feature} 功能`,
      type,
      status: 'todo',
      priority: 'medium',
      complexity: 'medium',
      order: startOrder + 1,
      dependencies: [],
      estimatedHours: 8,
      tags: [],
      subtasks: [],
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as ProjectTask);

    if (feature.length > 50) {
      tasks.push({
        id: `task-${startOrder + 2}`,
        title: `测试: ${feature}`,
        description: `测试 ${projectName} 的 ${feature} 功能`,
        type: 'testing',
        status: 'todo',
        priority: 'medium',
        complexity: 'medium',
        order: startOrder + 2,
        dependencies: [`task-${startOrder + 1}`],
        estimatedHours: 4,
        tags: [],
        subtasks: [],
        progress: 0,
createdAt: new Date(),
      updatedAt: new Date(),
      } as unknown as ProjectTask);
    }

    return tasks;
  }

  /**
   * 确定任务类型
   */
  private determineTaskType(feature: string): ProjectTask['type'] {
    const lower = feature.toLowerCase();

    if (lower.includes('界面') || lower.includes('ui') || lower.includes('前端')) {
      return 'design';
    } else if (lower.includes('测试') || lower.includes('test')) {
      return 'testing';
    } else if (lower.includes('部署') || lower.includes('deploy')) {
      return 'deployment';
    } else if (lower.includes('文档') || lower.includes('doc')) {
      return 'documentation';
    } else if (lower.includes('研究') || lower.includes('调研')) {
      return 'research';
    } else {
      return 'frontend';
    }
  }

  /**
   * 估算工时
   */
  private estimateTaskHours(tasks: ProjectTask[]): void {
    const baseHours: Partial<Record<ProjectTask['type'], number>> = {
      frontend: 8,
      backend: 8,
      design: 4,
      testing: 4,
      documentation: 2,
      deployment: 4,
      research: 8,
    };

    for (const task of tasks) {
      const base = baseHours[task.type] ?? 8;
      const lengthFactor = Math.max(0.5, Math.min(2, task.description.length / 100));
      task.estimatedHours = Math.round(base * lengthFactor);
    }
  }

  /**
   * 分析依赖关系
   */
  private analyzeDependencies(tasks: ProjectTask[]): void {
    for (let i = 1; i < tasks.length; i++) {
      if (
        tasks[i].type === 'testing' &&
        (tasks[i - 1].type === 'frontend' || tasks[i - 1].type === 'backend')
      ) {
        tasks[i].dependencies = [tasks[i - 1].id];
      }
    }
  }
}

/**
 * 风险识别器
 */
export class RiskAnalyzer {
  private logger = Logger.getInstance('RiskAnalyzer');

  /**
   * 识别项目风险
   */
  analyze(document: PRDDocument): Risk[] {
    this.logger.info('开始风险识别');

    const risks: Risk[] = [];

    const technicalSections = document.sections.filter(s => s.type === 'technical');
    if (technicalSections.length > 3) {
      risks.push({
        description: '技术实现复杂度较高',
        severity: 'medium',
        mitigation: '建议分阶段实现，优先完成核心功能',
      });
    }

    const content = document.sections.map(s => s.content).join(' ');
    if (content.includes('第三方') || content.includes('3rd party') || content.includes('API')) {
      risks.push({
        description: '依赖第三方服务，可能存在可用性风险',
        severity: 'medium',
        mitigation: '设计降级策略，确保服务不可用时系统仍可运行',
      });
    }

    if (content.includes('用户数据') || content.includes('隐私') || content.includes('password')) {
      risks.push({
        description: '涉及用户数据处理，需要关注安全性',
        severity: 'high',
        mitigation: '遵循安全最佳实践，进行安全审计',
      });
    }

    if (content.includes('并发') || content.includes('性能') || content.includes('performance')) {
      risks.push({
        description: '有性能要求，需要进行性能测试和优化',
        severity: 'low',
        mitigation: '提前进行性能测试',
      });
    }

    const integrationKeywords = ['集成', 'integration', '对接', '同步'];
    const hasIntegration = integrationKeywords.some(k => content.includes(k));
    if (hasIntegration) {
      risks.push({
        description: '存在系统集成点，可能存在联调风险',
        severity: 'medium',
        mitigation: '预留充足的联调时间',
      });
    }

    this.logger.info(`风险识别完成，发现 ${risks.length} 个潜在风险`);

    return risks;
  }
}

/**
 * 工时估算器
 */
export class HourEstimator {
  private logger = Logger.getInstance('HourEstimator');

  /**
   * 基于历史数据估算工时
   */
  estimate(tasks: ProjectTask[]): {
    total: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  } {
    let total = 0;
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    for (const task of tasks) {
      total += (task.estimatedHours ?? 0);

      byType[task.type] = (byType[task.type] || 0) + (task.estimatedHours ?? 0);
      byPriority[task.priority] = (byPriority[task.priority] || 0) + (task.estimatedHours ?? 0);
    }

    return { total, byType, byPriority };
  }
}
