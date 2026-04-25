/**
 * Agent 核心实现
 * 自主任务执行、反思、多 Agent 协作
 */

import {
  Agent,
  AgentTask,
  AgentExecution,
  AgentStep,
  AgentStatus,
  AgentConfig,
  GoalParseResult,
  GoalParser,
  ReflectionResult,
  MemoryItem,
  ExecutionCheckpoint,
} from './types';
import { Logger } from '../../utils/logger';
import { toolRegistry } from '../../mcp/tools/registry';
import { RuleBasedGoalParser } from './parsers/rule-based-goal-parser';

const logger = Logger.getInstance('core/agent/core');

/**
 * Agent 核心类
 */
export class AgentCore {
  private logger: Logger;
  private executions: Map<string, AgentExecution> = new Map();
  private agent: Agent;
  private goalParser: GoalParser;
  private reflectionEnabled: boolean;
  private maxStepsPerGoal: number;

  constructor(config: AgentConfig) {
    this.logger = Logger.getInstance(`Agent:${config.name}`);

    // 从 config 构建内部 Agent 实例
    this.agent = {
      id: config.id,
      name: config.name,
      description: config.description,
      capabilities: config.capabilities,
      status: 'idle',
      model: config.model,
      tools: config.tools,
      memory: {
        shortTerm: [],
        longTerm: [],
        maxShortTerm: config.memory.maxShortTerm,
      },
    };

    // 注入 GoalParser，默认使用 RuleBasedGoalParser
    this.goalParser = config.goalParser || new RuleBasedGoalParser();
    this.reflectionEnabled = config.reflectionEnabled ?? true;
    this.maxStepsPerGoal = config.maxStepsPerGoal ?? 50;
  }

  /**
   * 获取内部 Agent 实例
   */
  getAgent(): Agent {
    return this.agent;
  }

  /**
   * 获取当前 GoalParser
   */
  getGoalParser(): GoalParser {
    return this.goalParser;
  }

  /**
   * 设置 GoalParser
   */
  setGoalParser(parser: GoalParser): void {
    this.goalParser = parser;
  }

  /**
   * 解析目标
   */
  async parseGoal(goal: string): Promise<GoalParseResult> {
    this.logger.info(`解析目标: ${goal}`);
    return this.goalParser.parse(goal);
  }

  /**
   * 执行任务
   */
  async execute(task: AgentTask): Promise<AgentExecution> {
    const execution: AgentExecution = {
      id: `exec-${Date.now()}`,
      agentId: this.agent.id,
      task,
      steps: [],
      currentStep: 0,
      status: 'thinking',
      startedAt: Date.now(),
    };

    this.executions.set(execution.id, execution);
    this.logger.info(`开始执行任务: ${task.description}`);

    try {
      const parsedGoal = await this.parseGoal(task.goal || task.description);

      // 应用解析出的约束
      if (parsedGoal.constraints.length > 0 && !task.constraints) {
        task.constraints = parsedGoal.constraints;
      }

      this.addStep(execution, {
        step: execution.steps.length + 1,
        type: 'thought',
        content: `目标: ${parsedGoal.goal}`,
        reasoning: `分解为 ${parsedGoal.subgoals.length} 个子目标 (confidence: ${parsedGoal.confidence.toFixed(2)})`,
        timestamp: Date.now(),
      });

      if (parsedGoal.reasoning) {
        this.addStep(execution, {
          step: execution.steps.length + 1,
          type: 'thought',
          content: `解析过程: ${parsedGoal.reasoning}`,
          timestamp: Date.now(),
        });
      }

      let subgoalIndex = 0;
      for (const subgoal of parsedGoal.subgoals) {
        if (execution.status === 'failed') break;
        if (subgoalIndex >= this.maxStepsPerGoal) {
          this.logger.warn(`达到最大步数限制 ${this.maxStepsPerGoal}`);
          break;
        }

        await this.executeSubgoal(execution, subgoal);
        subgoalIndex++;
      }

      // 保存断点信息
      execution.checkpoint = {
        stepIndex: execution.steps.length,
        subgoalIndex,
        state: {
          parsedGoal,
          subgoalIndex,
        },
      };

      if (this.reflectionEnabled) {
        const reflection = await this.reflect(execution);

        if (!reflection.success && reflection.shouldRetry) {
          this.logger.info('反思建议重试');
        }
      }

      execution.status = 'completed';
      execution.finishedAt = Date.now();

      task.status = 'completed';
      task.finishedAt = Date.now();
    } catch (error) {
      execution.status = 'failed';
      execution.finishedAt = Date.now();
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);

      this.logger.error('任务执行失败', error);
    }

    return execution;
  }

  /**
   * 从断点恢复执行
   */
  async resume(executionId: string): Promise<AgentExecution | undefined> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      this.logger.warn(`执行 ${executionId} 不存在`);
      return undefined;
    }

    if (!execution.checkpoint) {
      this.logger.warn(`执行 ${executionId} 没有断点信息`);
      return execution;
    }

    const checkpoint = execution.checkpoint;
    const state = checkpoint.state as { parsedGoal: GoalParseResult; subgoalIndex: number };
    const parsedGoal = state.parsedGoal;
    const remainingSubgoals = parsedGoal.subgoals.slice(checkpoint.subgoalIndex);

    this.logger.info(
      `从断点恢复执行: 剩余 ${remainingSubgoals.length} 个子目标 (step ${checkpoint.stepIndex})`
    );

    execution.status = 'executing';

    this.addStep(execution, {
      step: execution.steps.length + 1,
      type: 'thought',
      content: `从断点恢复，剩余 ${remainingSubgoals.length} 个子目标`,
      timestamp: Date.now(),
    });

    for (const subgoal of remainingSubgoals) {
      if ((execution.status as AgentStatus) === 'failed') break;
      await this.executeSubgoal(execution, subgoal);
    }

    execution.status = 'completed';
    execution.finishedAt = Date.now();
    execution.checkpoint = undefined; // 清除断点

    return execution;
  }

  /**
   * 基于反思结果重新规划子目标
   */
  async replan(
    executionId: string,
    reflection?: ReflectionResult
  ): Promise<GoalParseResult | undefined> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      this.logger.warn(`执行 ${executionId} 不存在`);
      return undefined;
    }

    const reflectionResult = reflection || (await this.reflect(execution));

    this.addStep(execution, {
      step: execution.steps.length + 1,
      type: 'reflection',
      content: '基于反思重新规划',
      reasoning: `问题: ${reflectionResult.issues.join(', ') || '无'}`,
      timestamp: Date.now(),
    });

    // 重新解析原始目标
    const originalGoal = execution.task.goal || execution.task.description;
    const newParsedGoal = await this.parseGoal(originalGoal);

    // 根据反思结果调整子目标
    if (reflectionResult.issues.length > 0) {
      this.addStep(execution, {
        step: execution.steps.length + 1,
        type: 'thought',
        content: `根据反思调整计划: ${reflectionResult.improvements.join('; ')}`,
        timestamp: Date.now(),
      });
    }

    // 更新断点信息
    execution.checkpoint = {
      stepIndex: execution.steps.length,
      subgoalIndex: 0,
      state: {
        parsedGoal: newParsedGoal,
        subgoalIndex: 0,
      },
    };

    this.logger.info('重新规划完成');

    return newParsedGoal;
  }

  /**
   * 执行子目标
   */
  private async executeSubgoal(execution: AgentExecution, subgoal: string): Promise<void> {
    execution.status = 'executing';

    this.addStep(execution, {
      step: execution.steps.length + 1,
      type: 'thought',
      content: `处理子目标: ${subgoal}`,
      timestamp: Date.now(),
    });

    const shouldAct = this.shouldUseTool(subgoal);

    if (shouldAct && this.agent.tools.length > 0) {
      const toolName = this.selectTool(subgoal);
      if (toolName) {
        await this.executeTool(execution, toolName, { query: subgoal });
      }
    } else {
      await this.think(execution, subgoal);
    }
  }

  /**
   * 思考
   */
  private async think(execution: AgentExecution, context: string): Promise<void> {
    this.addStep(execution, {
      step: execution.steps.length + 1,
      type: 'thought',
      content: `分析: ${context}`,
      reasoning: '需要更多思考来解决问题',
      timestamp: Date.now(),
    });

    await this.sleep(100);
  }

  /**
   * 执行工具
   */
  private async executeTool(
    execution: AgentExecution,
    toolName: string,
    input: Record<string, unknown>
  ): Promise<void> {
    const startTime = Date.now();

    this.addStep(execution, {
      step: execution.steps.length + 1,
      type: 'action',
      content: `执行工具: ${toolName}`,
      tool: toolName,
      toolInput: input,
      timestamp: Date.now(),
    });

    try {
      const result = await toolRegistry.execute(toolName, input);

      const lastStep = execution.steps[execution.steps.length - 1];
      lastStep.toolResult = result;
      lastStep.duration = Date.now() - startTime;

      this.addStep(execution, {
        step: execution.steps.length + 1,
        type: 'observation',
        content: `工具返回结果: ${JSON.stringify(result).substring(0, 100)}...`,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.addStep(execution, {
        step: execution.steps.length + 1,
        type: 'observation',
        content: `工具执行失败: ${error}`,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 反思
   */
  async reflect(execution: AgentExecution): Promise<ReflectionResult> {
    this.logger.info('执行反思...');
    execution.status = 'reflecting';

    this.addStep(execution, {
      step: execution.steps.length + 1,
      type: 'reflection',
      content: '反思执行过程',
      reasoning: '检查结果是否符合预期',
      timestamp: Date.now(),
    });

    const issues: string[] = [];
    const improvements: string[] = [];
    const learnedLessons: string[] = [];

    const hasFailure = execution.steps.some(
      s => s.type === 'observation' && s.content.includes('失败')
    );

    if (hasFailure) {
      issues.push('存在执行失败的步骤');
      improvements.push('考虑使用备选工具');
    }

    if (execution.steps.length < 3) {
      improvements.push('可能需要更多步骤来完成任务');
    }

    // 检查是否有未完成的子目标
    if (execution.checkpoint) {
      const state = execution.checkpoint.state as {
        parsedGoal: GoalParseResult;
        subgoalIndex: number;
      };
      const remaining = state.parsedGoal.subgoals.length - state.subgoalIndex;
      if (remaining > 0) {
        issues.push(`有 ${remaining} 个子目标未完成`);
        improvements.push('恢复执行以完成剩余子目标');
      }
    }

    const result: ReflectionResult = {
      success: (execution.status as AgentStatus) === 'completed',
      issues,
      improvements,
      learnedLessons,
      shouldRetry: issues.length > 0 && issues.length < 3,
    };

    return result;
  }

  /**
   * 添加记忆
   */
  addMemory(type: MemoryItem['type'], content: string, importance: number = 0.5): void {
    const item: MemoryItem = {
      id: `mem-${Date.now()}`,
      type,
      content,
      timestamp: Date.now(),
      importance,
    };

    this.agent.memory.shortTerm.push(item);

    if (this.agent.memory.shortTerm.length > this.agent.memory.maxShortTerm) {
      this.agent.memory.shortTerm.shift();
    }
  }

  /**
   * 获取执行
   */
  getExecution(executionId: string): AgentExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * 获取所有执行
   */
  listExecutions(): AgentExecution[] {
    return Array.from(this.executions.values());
  }

  private addStep(execution: AgentExecution, step: AgentStep): void {
    execution.steps.push(step);
    execution.currentStep = step.step;
  }

  private shouldUseTool(context: string): boolean {
    const toolKeywords = [
      '查找',
      '搜索',
      '获取',
      '创建',
      '修改',
      '删除',
      '执行',
      'run',
      'get',
      'create',
    ];
    return toolKeywords.some(k => context.toLowerCase().includes(k.toLowerCase()));
  }

  private selectTool(context: string): string | null {
    if (context.includes('搜索') || context.includes('search')) {
      return 'project_analyze';
    }
    if (context.includes('创建') || context.includes('create')) {
      return 'task_create';
    }
    return this.agent.tools[0] || null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default AgentCore;
