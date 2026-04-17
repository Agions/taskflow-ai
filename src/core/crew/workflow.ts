/**
 * TaskFlow AI - Workflow 引擎
 * 差异化设计：Workflow-First Agent System
 * 核心概念: Workflow → Stage → Agent → Result
 */

import {
  Workflow,
  Stage,
  WorkflowStatus,
  WorkflowExecutionResult,
  WorkflowHistoryEntry,
  StageExecutionResult,
  WORKFLOW_TEMPLATES,
  WorkflowTemplate,
} from './types';
import { WorkflowContext } from './context';
import { StageExecutor } from './stage';
import { Logger } from '../../utils/logger';

/**
 * Workflow 引擎
 * 负责工作流的执行、状态管理、错误恢复
 */
export class WorkflowEngine {
  private logger: Logger;
  private executor: StageExecutor;

  constructor() {
    this.logger = Logger.getInstance('WorkflowEngine');
    this.executor = new StageExecutor();
  }

  /**
   * 从模板创建 Workflow
   */
  fromTemplate(templateName: string): Workflow | undefined {
    const template = WORKFLOW_TEMPLATES.find(t => t.name === templateName);
    if (!template) {
      this.logger.warn(`模板不存在: ${templateName}`);
      return undefined;
    }
    return this.createFromTemplate(template);
  }

  /**
   * 从模板定义创建 Workflow
   */
  createFromTemplate(template: WorkflowTemplate): Workflow {
    return {
      id: `workflow-${Date.now()}`,
      name: template.name,
      description: template.description,
      stages: [...template.stages],
      entryStage: template.stages[0]?.id || '',
    };
  }

  /**
   * 创建空 Workflow
   */
  createWorkflow(name: string, description?: string): Workflow {
    return {
      id: `workflow-${Date.now()}`,
      name,
      description,
      stages: [],
      entryStage: '',
    };
  }

  /**
   * 添加 Stage 到 Workflow
   */
  addStage(workflow: Workflow, stage: Stage): void {
    workflow.stages.push(stage);
    if (!workflow.entryStage) {
      workflow.entryStage = stage.id;
    }
  }

  /**
   * 执行 Workflow
   */
  async execute(
    workflow: Workflow,
    initialContext?: Record<string, unknown>,
    options?: {
      signal?: AbortSignal;
      verbose?: boolean;
      onStageStart?: (stage: Stage) => void;
      onStageComplete?: (result: StageExecutionResult) => void;
    }
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    const context = new WorkflowContext(initialContext);

    const result: WorkflowExecutionResult = {
      workflowId: workflow.id,
      workflowName: workflow.name,
      status: 'running',
      context: context.getAll(),
      stageResults: [],
      startTime,
    };

    this.logger.info(`=== Workflow 开始: ${workflow.name} ===`);
    this.logger.info(`Stages: ${workflow.stages.map(s => s.name).join(' → ')}`);

    // 构建 Stage 映射
    const stageMap = new Map<string, Stage>();
    for (const stage of workflow.stages) {
      stageMap.set(stage.id, stage);
    }

    // 确定入口 Stage
    let currentStageId = workflow.entryStage;
    const history: WorkflowHistoryEntry[] = [];

    // 主执行循环
    while (currentStageId && !options?.signal?.aborted) {
      const stage = stageMap.get(currentStageId);
      if (!stage) {
        this.logger.error(`Stage 不存在: ${currentStageId}`);
        break;
      }

      this.logger.info(`>> Stage: ${stage.name}`);
      options?.onStageStart?.(stage);

      // 执行 Stage
      const stageResult = await this.executor.execute(stage, context, {
        signal: options?.signal,
      });

      result.stageResults.push(stageResult);

      // 记录历史
      history.push({
        stageId: stage.id,
        stageName: stage.name,
        status: stageResult.status,
        startTime: stageResult.startTime,
        endTime: stageResult.endTime,
        duration: stageResult.duration,
        input: stageResult.input,
        output: stageResult.output,
        error: stageResult.error,
      });

      options?.onStageComplete?.(stageResult);

      // 处理结果
      if (stageResult.status === 'failed') {
        if (stage.required === false) {
          // 可选的 Stage 失败，尝试继续
          this.logger.warn(`[${stage.name}] 可选 Stage 失败，继续执行`);
          currentStageId = stage.onSuccess ?? this.getNextStage(workflow, currentStageId) ?? '';
        } else {
          // 必需的 Stage 失败
          this.logger.error(`[${stage.name}] 必需 Stage 失败，终止 Workflow`);
          result.status = 'failed';
          result.error = `Stage "${stage.name}" 执行失败: ${stageResult.error}`;
          break;
        }
      } else if (stageResult.status === 'skipped') {
        // 跳过的 Stage
        currentStageId = stage.onSuccess ?? this.getNextStage(workflow, currentStageId) ?? '';
      } else {
        // 成功的 Stage
        currentStageId = stage.onSuccess ?? this.getNextStage(workflow, currentStageId) ?? '';
      }

      if (options?.verbose) {
        this.logger.info(`   状态: ${stageResult.status}, 耗时: ${stageResult.duration}ms`);
      }
    }

    // 最终状态
    result.endTime = Date.now();
    result.duration = result.endTime - startTime;

    if (options?.signal?.aborted) {
      result.status = 'cancelled';
      this.logger.warn('Workflow 被取消');
    } else if (result.status === 'running') {
      result.status = 'completed';
      this.logger.info(`=== Workflow 完成 ===`);
    }

    this.logger.info(`总耗时: ${result.duration}ms, 完成 Stages: ${result.stageResults.length}`);

    return result;
  }

  /**
   * 获取下一个 Stage
   */
  private getNextStage(workflow: Workflow, currentStageId: string): string | undefined {
    const currentIndex = workflow.stages.findIndex(s => s.id === currentStageId);
    if (currentIndex === -1 || currentIndex >= workflow.stages.length - 1) {
      return undefined;
    }
    return workflow.stages[currentIndex + 1].id;
  }

  /**
   * 验证 Workflow
   */
  validate(workflow: Workflow): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!workflow.name) {
      errors.push('Workflow 名称不能为空');
    }

    if (workflow.stages.length === 0) {
      errors.push('Workflow 至少需要一个 Stage');
    }

    if (!workflow.entryStage) {
      errors.push('Workflow 必须指定入口 Stage');
    }

    // 检查 entryStage 存在
    const entryExists = workflow.stages.some(s => s.id === workflow.entryStage);
    if (!entryExists) {
      errors.push(`入口 Stage "${workflow.entryStage}" 不存在`);
    }

    // 检查 Stage 引用
    for (const stage of workflow.stages) {
      if (stage.onSuccess) {
        const targetExists = workflow.stages.some(s => s.id === stage.onSuccess);
        if (!targetExists) {
          errors.push(`Stage "${stage.name}" 的 onSuccess 指向不存在的 Stage: ${stage.onSuccess}`);
        }
      }
      if (stage.onFailure) {
        const targetExists = workflow.stages.some(s => s.id === stage.onFailure);
        if (!targetExists) {
          errors.push(`Stage "${stage.name}" 的 onFailure 指向不存在的 Stage: ${stage.onFailure}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 序列化 Workflow 为 YAML
   */
  toYAML(workflow: Workflow): string {
    const lines: string[] = [];
    lines.push(`name: ${workflow.name}`);
    if (workflow.description) {
      lines.push(`description: ${workflow.description}`);
    }
    lines.push(`entryStage: ${workflow.entryStage}`);
    lines.push('stages:');

    for (const stage of workflow.stages) {
      lines.push(`  - id: ${stage.id}`);
      lines.push(`    name: ${stage.name}`);
      lines.push(`    agent:`);
      lines.push(`      id: ${stage.agent.id}`);
      lines.push(`      name: ${stage.agent.name}`);
      lines.push(`      specialty: ${stage.agent.specialty}`);
      if (stage.agent.description) {
        lines.push(`      description: ${stage.agent.description}`);
      }
      lines.push(`      tools: [${stage.agent.tools.join(', ')}]`);
      lines.push(`      capabilities: [${stage.agent.capabilities.join(', ')}]`);

      if (stage.input.template) {
        lines.push(`    input:`);
        lines.push(`      template: |`);
        for (const line of stage.input.template.split('\n')) {
          lines.push(`        ${line}`);
        }
      } else if (stage.input.fromContext) {
        lines.push(`    input:`);
        lines.push(`      fromContext: ${stage.input.fromContext}`);
      }

      if (stage.output) {
        lines.push(`    output:`);
        lines.push(`      fields:`);
        for (const field of stage.output.fields) {
          lines.push(`        - name: ${field.name}`);
          lines.push(`          type: ${field.type}`);
          if (field.required) lines.push(`          required: true`);
        }
      }

      if (stage.onSuccess) lines.push(`    onSuccess: ${stage.onSuccess}`);
      if (stage.onFailure) lines.push(`    onFailure: ${stage.onFailure}`);
      if (stage.required === false) lines.push(`    required: false`);
      if (stage.timeout) lines.push(`    timeout: ${stage.timeout}`);
    }

    return lines.join('\n');
  }

  /**
   * 从 YAML 解析 Workflow
   */
  fromYAML(yaml: string): Workflow | undefined {
    try {
      // 简单的 YAML 解析（避免引入额外依赖）
      const lines = yaml.split('\n');
      const workflow: Workflow = {
        id: `workflow-${Date.now()}`,
        name: '',
        stages: [],
        entryStage: '',
      };

      let currentStage: Stage | null = null;
      let inStages = false;
      let inAgent = false;
      let inInput = false;
      let inOutput = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const indent = line.match(/^(\s*)/)?.[1].length || 0;

        if (line.startsWith('name:') && indent === 0) {
          workflow.name = line.split(':')[1].trim();
        } else if (line.startsWith('description:') && indent === 0) {
          workflow.description = line.split(':')[1].trim();
        } else if (line.startsWith('entryStage:')) {
          workflow.entryStage = line.split(':')[1].trim();
        } else if (line.startsWith('stages:')) {
          inStages = true;
        } else if (inStages && line.match(/^\s+-\s+id:/)) {
          if (currentStage) workflow.stages.push(currentStage);
          currentStage = this.createEmptyStage(line.split(':')[1].trim());
        } else if (currentStage) {
          if (line.match(/^\s+name:/) && !inAgent && !inInput && !inOutput) {
            currentStage.name = line.split(':')[1].trim();
          } else if (
            line.match(/^\s+agent:/) ||
            (inAgent && indent === 3 && line.match(/^\s+\w/))
          ) {
            if (line.match(/^\s+agent:/)) inAgent = true;
            else if (!line.startsWith('      ') && line.match(/^\s+\w/)) inAgent = false;
          } else if (inAgent && line.match(/^\s+id:/)) {
            currentStage.agent.id = line.split(':')[1].trim();
          } else if (inAgent && line.match(/^\s+name:/)) {
            currentStage.agent.name = line.split(':')[1].trim();
          } else if (inAgent && line.match(/^\s+specialty:/)) {
            currentStage.agent.specialty = line.split(':')[1].trim() as any;
          } else if (inAgent && line.match(/^\s+description:/)) {
            currentStage.agent.description = line.split(':')[1].trim();
          } else if (inAgent && line.match(/^\s+tools:/)) {
            const toolsStr = line.split(':')[1].trim();
            if (toolsStr.startsWith('[')) {
              currentStage.agent.tools = toolsStr
                .slice(1, -1)
                .split(',')
                .map(t => t.trim());
            }
          } else if (inAgent && line.match(/^\s+capabilities:/)) {
            const capsStr = line.split(':')[1].trim();
            if (capsStr.startsWith('[')) {
              currentStage.agent.capabilities = capsStr
                .slice(1, -1)
                .split(',')
                .map(t => t.trim()) as any[];
            }
          } else if (line.match(/^\s+input:/)) {
            inInput = true;
            inOutput = false;
          } else if (
            line.match(/^\s+output:/) ||
            (inOutput && indent <= 3 && line.match(/^\s+\w/))
          ) {
            inInput = false;
            if (line.match(/^\s+output:/)) inOutput = true;
            else if (!line.startsWith('      ') && line.match(/^\s+\w/)) inOutput = false;
          } else if (inInput && line.match(/^\s+fromContext:/)) {
            currentStage.input.fromContext = line.split(':')[1].trim();
          } else if (inInput && line.match(/^\s+template:/)) {
            currentStage.input.template = '';
          } else if (inInput && line.match(/^\s+defaultValue:/)) {
            currentStage.input.defaultValue = line.split(':')[1].trim();
          } else if (line.match(/^\s+onSuccess:/)) {
            currentStage.onSuccess = line.split(':')[1].trim();
          } else if (line.match(/^\s+onFailure:/)) {
            currentStage.onFailure = line.split(':')[1].trim();
          } else if (line.match(/^\s+required: false/)) {
            currentStage.required = false;
          } else if (line.match(/^\s+timeout:/)) {
            currentStage.timeout = parseInt(line.split(':')[1].trim());
          }
        }
      }

      if (currentStage) workflow.stages.push(currentStage);

      return workflow;
    } catch (error) {
      this.logger.error(`YAML 解析失败: ${error}`);
      return undefined;
    }
  }

  /**
   * 创建空 Stage
   */
  private createEmptyStage(id: string): Stage {
    return {
      id,
      name: '',
      agent: {
        id,
        name: '',
        specialty: 'researcher',
        tools: [],
        capabilities: [],
      },
      input: {},
    };
  }

  /**
   * 获取可用模板列表
   */
  getTemplates(): WorkflowTemplate[] {
    return [...WORKFLOW_TEMPLATES];
  }
}
