/**
 * 工作流导出器
 */

import { Workflow, WorkflowSpec } from './types';

/**
 * 导出为 JSON
 */
export function toJSON(workflow: Workflow): string {
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
export function toYAML(workflow: Workflow): string {
  // 简化实现：先转为 JSON
  return toJSON(workflow);
}

/**
 * 导出为对象
 */
export function toObject(workflow: Workflow): WorkflowSpec {
  return {
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
}
