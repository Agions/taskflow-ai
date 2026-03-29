/**
 * YAML 工作流解析器
 */

import { WorkflowSpec, WorkflowStep } from './types';

interface ParsedStep {
  id: string;
  type: string;
  condition?: string;
  retry?: { max_attempts: number };
  [key: string]: unknown;
}

/**
 * 解析 YAML 格式的工作流（简化版）
 */
export function parseYAML(content: string): WorkflowSpec {
  const lines = content.split('\n');
  const result: WorkflowSpec = { steps: [] };
  let currentStep: ParsedStep | null = null;
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
          result.steps.push(currentStep as WorkflowStep);
        }
        const stepName = trimmed.match(/^-\s+(\w+):/)?.[1] || 'unknown';
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
          // 处理分支 - 存储在额外字段
          currentStep[key] = value;
        } else if (key === 'retry') {
          currentStep.retry = { max_attempts: 1 };
        } else if (value === '' || value === 'true') {
          currentStep[key] = true;
        } else {
          currentStep[key] = value;
        }
      }
    } else {
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();

      if (key && value !== '') {
        (result as WorkflowSpec)[key as keyof WorkflowSpec] = value as any;
      }
    }
  }

  if (currentStep) {
    result.steps.push(currentStep as WorkflowStep);
  }

  return result;
}
