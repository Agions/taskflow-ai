/**
 * YAML 工作流解析器
 */

import { WorkflowSpec } from './types';

/**
 * 解析 YAML 格式的工作流
 */
export function parseYAML(content: string): WorkflowSpec {
  const lines = content.split('\n');
  const result: any = { steps: [] };
  let currentStep: any = null;
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
      if (trimmed.match(/^-\s+\w+:/)) {
        if (currentStep) {
          result.steps.push(currentStep);
        }
        const stepName = trimmed.match(/^-\s+(\w+):/)?.[1];
        currentStep = { id: stepName, type: 'task' };
        stepIndent = indent;
        continue;
      }

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
