/**
 * 工作流步骤转换器
 */

import { Workflow, WorkflowStep, StepSpec, BranchConfig } from './types';

/**
 * 转换步骤
 */
export function convertStep(spec: StepSpec, allSpecs: StepSpec[]): WorkflowStep {
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

  if (spec.depends_on) {
    step.config = step.config || {};
    (step.config as any).dependsOn = spec.depends_on;
  }

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
export function resolveDependencies(workflow: Workflow): void {
  const stepMap = new Map(workflow.steps.map(s => [s.id, s]));

  for (const step of workflow.steps) {
    if (step.type === 'condition' && step.branches) {
      continue;
    }

    const config = step.config as any;
    if (config?.dependsOn) {
      const deps = Array.isArray(config.dependsOn) ? config.dependsOn : [config.dependsOn];

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

  for (let i = 0; i < workflow.steps.length - 1; i++) {
    const step = workflow.steps[i];
    if (!step.next || step.next.length === 0) {
      step.next = [workflow.steps[i + 1].id];
    }
  }
}

/**
 * 检查循环引用
 */
export function hasCycle(workflow: Workflow): boolean {
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
