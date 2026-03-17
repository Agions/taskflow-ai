/**
 * 工作流验证器
 */

import { Workflow } from './types';
import { hasCycle } from './step-converter';

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 验证工作流
 */
export function validateWorkflow(workflow: Workflow): ValidationResult {
  const errors: string[] = [];

  const stepIds = new Set(workflow.steps.map(s => s.id));

  for (const step of workflow.steps) {
    if (step.next) {
      for (const nextId of step.next) {
        if (!stepIds.has(nextId)) {
          errors.push(`步骤 ${step.id} 引用了不存在的下一步: ${nextId}`);
        }
      }
    }

    if (step.branches) {
      for (const branch of step.branches) {
        if (!stepIds.has(branch.stepId)) {
          errors.push(`步骤 ${step.id} 的分支引用了不存在的步骤: ${branch.stepId}`);
        }
      }
    }
  }

  if (hasCycle(workflow)) {
    errors.push('工作流存在循环引用');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 验证步骤ID是否存在
 */
export function validateStepId(workflow: Workflow, stepId: string): boolean {
  return workflow.steps.some(s => s.id === stepId);
}

/**
 * 验证步骤依赖
 */
export function validateDependencies(workflow: Workflow, stepId: string): string[] {
  const errors: string[] = [];
  const step = workflow.steps.find(s => s.id === stepId);

  if (!step) {
    errors.push(`步骤不存在: ${stepId}`);
    return errors;
  }

  const config = step.config as any;
  if (config?.dependsOn) {
    const deps = Array.isArray(config.dependsOn) ? config.dependsOn : [config.dependsOn];

    for (const dep of deps) {
      if (!validateStepId(workflow, dep)) {
        errors.push(`依赖的步骤不存在: ${dep}`);
      }
    }
  }

  return errors;
}
