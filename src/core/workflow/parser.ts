/**
 * 工作流解析器
 * 支持 YAML 和 JSON 格式
 */

import { Workflow, WorkflowSpec, WorkflowStep, StepSpec, BranchConfig } from './types';
import { Logger } from '../../utils/logger';

export class WorkflowParser {
  private logger = Logger.getInstance('WorkflowParser');

  /**
   * 解析工作流规范
   */
  parse(content: string, format: 'yaml' | 'json'): Workflow {
    this.logger.info(`解析工作流: ${format}`);

    try {
      let spec: WorkflowSpec;
      
      if (format === 'yaml') {
        spec = this.parseYAML(content);
      } else {
        spec = this.parseJSON(content);
      }

      return this.convertToWorkflow(spec);
    } catch (error) {
      this.logger.error('工作流解析失败:', error);
      throw error;
    }
  }

  /**
   * 解析 YAML
   */
  private parseYAML(content: string): WorkflowSpec {
    // 简单 YAML 解析 - 实际可以使用 yaml 库
    // 这里实现一个基础解析器
    const lines = content.split('\n');
    const result: any = { steps: [] };
    let currentStep: any = null;
    let currentKey = '';
    let stepIndent = 0;
    let inSteps = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const indent = line.search(/\S/);

      if (trimmed.startsWith('steps:')) {
        inSteps = true;
        continue;
      }

      if (inSteps) {
        // 检查是否是新的步骤
        if (trimmed.match(/^-\s+\w+:/)) {
          if (currentStep) {
            result.steps.push(currentStep);
          }
          const stepName = trimmed.match(/^-\s+(\w+):/)?.[1];
          currentStep = { id: stepName, type: 'task' };
          stepIndent = indent;
          continue;
        }

        // 步骤内的属性
        if (currentStep && indent > stepIndent) {
          const [key, ...valueParts] = trimmed.split(':');
          const value = valueParts.join(':').trim();

          if (key === 'if') {
            currentStep.condition = value;
          } else if (key === 'on_true' || key === 'on_false') {
            // 处理分支
          } else if (key === 'retry') {
            currentStep.retry = { max_attempts: 1 };
          } else {
            (currentStep as any)[key] = value || true;
          }
        }
      } else {
        // 顶层属性
        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim();

        if (key && value !== '') {
          (result as any)[key] = value || true;
        }
      }
    }

    if (currentStep) {
      result.steps.push(currentStep);
    }

    return result as WorkflowSpec;
  }

  /**
   * 解析 JSON
   */
  private parseJSON(content: string): WorkflowSpec {
    return JSON.parse(content) as WorkflowSpec;
  }

  /**
   * 转换为工作流对象
   */
  private convertToWorkflow(spec: WorkflowSpec): Workflow {
    const workflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: spec.name,
      version: spec.version || '1.0.0',
      description: spec.description,
      triggers: spec.triggers || [{ type: 'manual' }],
      variables: spec.variables || {},
      steps: [],
      metadata: {
        createdAt: Date.now(),
      },
    };

    // 转换步骤
    for (const stepSpec of spec.steps) {
      const step = this.convertStep(stepSpec, spec.steps);
      workflow.steps.push(step);
    }

    // 设置步骤关系
    this.resolveDependencies(workflow);

    return workflow;
  }

  /**
   * 转换步骤
   */
  private convertStep(spec: StepSpec, allSpecs: StepSpec[]): WorkflowStep {
    const step: WorkflowStep = {
      id: spec.id,
      name: spec.name || spec.id,
      type: spec.type || 'task',
      config: {
        prompt: spec.prompt,
        tool: spec.tool,
        toolInput: spec.tool_input,
        outputKey: spec.output_key,
        timeout: spec.timeout,
        retries: spec.retry?.max_attempts,
      },
    };

    // 处理条件
    if (spec.if) {
      step.type = 'condition';
      step.condition = spec.if;
      step.branches = [];

      if (spec.on_true) {
        step.branches.push({
          id: 'true',
          condition: spec.if,
          stepId: spec.on_true[0],
        });
      }
      if (spec.on_false && spec.on_false[0]) {
        step.branches.push({
          id: 'false',
          condition: `!(${spec.if})`,
          stepId: spec.on_false[0],
        });
      }
    }

    // 处理依赖
    if (spec.depends_on) {
      step.config = step.config || {};
      (step.config as any).dependsOn = spec.depends_on;
    }

    // 错误处理
    if (spec.retry) {
      step.errorHandling = {
        maxRetries: spec.retry.max_attempts,
        retryDelay: spec.retry.delay,
      };
    }

    return step;
  }

  /**
   * 解析依赖关系
   */
  private resolveDependencies(workflow: Workflow): void {
    const stepMap = new Map(workflow.steps.map(s => [s.id, s]));

    for (const step of workflow.steps) {
      if (step.type === 'condition' && step.branches) {
        // 条件分支 - 不需要设置 next
        continue;
      }

      // 从 dependsOn 设置依赖
      const config = step.config as any;
      if (config?.dependsOn) {
        const deps = Array.isArray(config.dependsOn) 
          ? config.dependsOn 
          : [config.dependsOn];
        
        // 设置上一个步骤的 next
        for (const dep of deps) {
          const depStep = stepMap.get(dep);
          if (depStep) {
            depStep.next = depStep.next || [];
            if (!depStep.next.includes(step.id)) {
              depStep.next.push(step.id);
            }
          }
        }
      }
    }

    // 设置默认的步骤顺序
    for (let i = 0; i < workflow.steps.length - 1; i++) {
      const step = workflow.steps[i];
      if (!step.next || step.next.length === 0) {
        step.next = [workflow.steps[i + 1].id];
      }
    }
  }

  /**
   * 验证工作流
   */
  validate(workflow: Workflow): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查步骤是否存在
    const stepIds = new Set(workflow.steps.map(s => s.id));

    for (const step of workflow.steps) {
      if (step.next) {
        for (const nextId of step.next) {
          if (!stepIds.has(nextId)) {
            errors.push(`步骤 ${step.id} 引用了不存在的下一步: ${nextId}`);
          }
        }
      }

      // 检查条件分支
      if (step.branches) {
        for (const branch of step.branches) {
          if (!stepIds.has(branch.stepId)) {
            errors.push(`步骤 ${step.id} 的分支引用了不存在的步骤: ${branch.stepId}`);
          }
        }
      }
    }

    // 检查循环引用
    if (this.hasCycle(workflow)) {
      errors.push('工作流存在循环引用');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 检查循环引用
   */
  private hasCycle(workflow: Workflow): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (stepId: string): boolean => {
      visited.add(stepId);
      recursionStack.add(stepId);

      const step = workflow.steps.find(s => s.id === stepId);
      if (step?.next) {
        for (const nextId of step.next) {
          if (!visited.has(nextId)) {
            if (dfs(nextId)) return true;
          } else if (recursionStack.has(nextId)) {
            return true;
          }
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    for (const step of workflow.steps) {
      if (!visited.has(step.id)) {
        if (dfs(step.id)) return true;
      }
    }

    return false;
  }

  /**
   * 导出为 JSON
   */
  toJSON(workflow: Workflow): string {
    const spec: WorkflowSpec = {
      name: workflow.name,
      version: workflow.version,
      description: workflow.description,
      triggers: workflow.triggers,
      variables: workflow.variables,
      steps: workflow.steps.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        prompt: s.config.prompt,
        tool: s.config.tool,
        tool_input: s.config.toolInput,
        output_key: s.config.outputKey,
        depends_on: s.next,
        if: s.condition,
        timeout: s.config.timeout,
      })),
    };

    return JSON.stringify(spec, null, 2);
  }

  /**
   * 导出为 YAML
   */
  toYAML(workflow: Workflow): string {
    // 简单实现 - 实际可以使用 yaml 库
    return this.toJSON(workflow);
  }
}

export default WorkflowParser;
