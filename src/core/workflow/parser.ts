import { getLogger } from '../../utils/logger';
/**
 * 工作流解析器
 * 支持 YAML 和 JSON 格式
 */

import { Workflow, WorkflowSpec } from './types';
import { Logger } from '../../utils/logger';
import { parseYAML } from './yaml-parser';
import { convertStep, resolveDependencies } from './step-converter';
import { validateWorkflow } from './validator';
import { toJSON, toYAML } from './exporter';

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
        spec = parseYAML(content);
      } else {
        spec = JSON.parse(content) as WorkflowSpec;
      }

      return this.convertToWorkflow(spec);
    } catch (error) {
      this.logger.error('工作流解析失败:', error);
      throw error;
    }
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
      metadata: { createdAt: Date.now() },
    };

    for (const stepSpec of spec.steps) {
      const step = convertStep(stepSpec, spec.steps);
      workflow.steps.push(step);
    }

    resolveDependencies(workflow);
    return workflow;
  }

  /**
   * 验证工作流
   */
  validate(workflow: Workflow): { valid: boolean; errors: string[] } {
    return validateWorkflow(workflow);
  }

  /**
   * 导出为 JSON
   */
  toJSON(workflow: Workflow): string {
    return toJSON(workflow);
  }

  /**
   * 导出为 YAML
   */
  toYAML(workflow: Workflow): string {
    return toYAML(workflow);
  }
}

export default WorkflowParser;
export * from './types';
export { parseYAML } from './yaml-parser';
export { convertStep, resolveDependencies, hasCycle } from './step-converter';
export { validateWorkflow, validateStepId, validateDependencies } from './validator';
export { toJSON, toYAML, toObject } from './exporter';
const logger = getLogger('core/workflow/parser');
