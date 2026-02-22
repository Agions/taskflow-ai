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
  GoalParserResult,
  ReflectionResult,
  MemoryItem 
} from './types';
import { Logger } from '../../utils/logger';
import { toolRegistry } from '../../mcp/tools/registry';

/**
 * Agent 核心类
 */
export class AgentCore {
  private logger: Logger;
  private executions: Map<string, AgentExecution> = new Map();

  constructor(private agent: Agent) {
    this.logger = Logger.getInstance(`Agent:${agent.name}`);
  }

  /**
   * 解析目标
   */
  async parseGoal(goal: string): Promise<GoalParserResult> {
    this.logger.info(`解析目标: ${goal}`);

    // TODO: 集成 AI 进行目标解析
    // 简单实现
    const result: GoalParserResult = {
      goal,
      subgoals: this.extractSubgoals(goal),
      constraints: [],
      successCriteria: this.extractSuccessCriteria(goal),
      estimatedSteps: 5,
    };

    return result;
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
      // 解析目标
      const parsedGoal = await this.parseGoal(task.goal || task.description);
      
      // 添加初始思考步骤
      this.addStep(execution, {
        step: execution.steps.length + 1,
        type: 'thought',
        content: `目标: ${parsedGoal.goal}`,
        reasoning: `分解为 ${parsedGoal.subgoals.length} 个子目标`,
        timestamp: Date.now(),
      });

      // 逐步执行
      for (const subgoal of parsedGoal.subgoals) {
        if (execution.status === 'failed') break;

        await this.executeSubgoal(execution, subgoal);
      }

      // 反思
      const reflection = await this.reflect(execution);
      
      if (!reflection.success && reflection.shouldRetry) {
        // 重试
        this.logger.info('反思建议重试');
      }

      // 完成
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
   * 执行子目标
   */
  private async executeSubgoal(execution: AgentExecution, subgoal: string): Promise<void> {
    execution.status = 'executing';
    
    // 添加思考步骤
    this.addStep(execution, {
      step: execution.steps.length + 1,
      type: 'thought',
      content: `处理子目标: ${subgoal}`,
      timestamp: Date.now(),
    });

    // 决定使用工具还是继续思考
    const shouldAct = this.shouldUseTool(subgoal);
    
    if (shouldAct && this.agent.tools.length > 0) {
      // 使用工具
      const toolName = this.selectTool(subgoal);
      if (toolName) {
        await this.executeTool(execution, toolName, { query: subgoal });
      }
    } else {
      // 继续思考
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

    // 模拟思考延迟
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
      
      // 更新步骤结果
      const lastStep = execution.steps[execution.steps.length - 1];
      lastStep.toolResult = result;
      lastStep.duration = Date.now() - startTime;

      // 添加观察步骤
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

    // 简单实现 - 实际应该使用 AI
    const issues: string[] = [];
    const improvements: string[] = [];
    const learnedLessons: string[] = [];

    // 检查是否有失败的步骤
    const hasFailure = execution.steps.some(s => s.type === 'observation' && 
      s.content.includes('失败'));

    if (hasFailure) {
      issues.push('存在执行失败的步骤');
      improvements.push('考虑使用备选工具');
    }

    // 检查步骤数
    if (execution.steps.length < 3) {
      improvements.push('可能需要更多步骤来完成任务');
    }

    const result: ReflectionResult = {
      success: execution.status === 'completed',
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

    // 修剪短期记忆
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

  // 辅助方法
  private addStep(execution: AgentExecution, step: AgentStep): void {
    execution.steps.push(step);
    execution.currentStep = step.step;
  }

  private shouldUseTool(context: string): boolean {
    const toolKeywords = ['查找', '搜索', '获取', '创建', '修改', '删除', '执行', 'run', 'get', 'create'];
    return toolKeywords.some(k => context.toLowerCase().includes(k));
  }

  private selectTool(context: string): string | null {
    // 简单的工具选择逻辑
    if (context.includes('搜索') || context.includes('search')) {
      return 'project_analyze';
    }
    if (context.includes('创建') || context.includes('create')) {
      return 'task_create';
    }
    return this.agent.tools[0] || null;
  }

  private extractSubgoals(goal: string): string[] {
    // 简单实现 - 实际应该使用 NLP
    return goal.split(/[,，]/).map(s => s.trim()).filter(s => s);
  }

  private extractSuccessCriteria(goal: string): string[] {
    return ['任务完成', '无错误'];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default AgentCore;
