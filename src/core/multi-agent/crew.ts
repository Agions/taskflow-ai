/**
 * Agent Crew - 多 Agent 团队管理
 */

import { getLogger } from '../../utils/logger';
import { getEventBus, TaskFlowEvent } from '../events';
import {
  CrewConfig,
  Crew,
  CrewResult,
  CrewStatus,
  AgentRole,
  Agent,
  AgentStatus,
  AgentMessage,
  StreamEvent,
  CoordinationMode,
  SharingStrategy,
} from './types';
import { MessageHistory, createAgentMessage, buildSystemPrompt, toChatMessages } from './message';

const logger = getLogger('multi-agent/crew');

/**
 * Agent Crew - 多 Agent 协作团队
 */
export class AgentCrew {
  private crews: Map<string, Crew> = new Map();
  private eventBus = getEventBus();

  /**
   * 创建团队
   */
  async create(config: CrewConfig): Promise<string> {
    const crewId = `crew-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const agents = new Map<string, Agent>();

    // 创建 Agent 实例
    for (const role of config.roles) {
      const agent: Agent = {
        id: role.id,
        role,
        status: 'idle',
        messages: [],
        context: {},
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      };
      agents.set(role.id, agent);
    }

    const crew: Crew = {
      id: crewId,
      name: config.roles.map(r => r.name).join(' + '),
      config,
      agents,
      status: 'created',
      createdAt: Date.now(),
      sharedContext: {},
    };

    this.crews.set(crewId, crew);

    logger.info(`Crew created: ${crewId} with ${agents.size} agents`);
    this.emitEvent(crewId, 'crew_created', { agentCount: agents.size });

    return crewId;
  }

  /**
   * 执行任务
   */
  async execute(task: string, crewId: string): Promise<CrewResult> {
    const crew = this.crews.get(crewId);
    if (!crew) {
      throw new Error(`Crew ${crewId} not found`);
    }

    const startTime = Date.now();
    crew.status = 'running';
    crew.startedAt = Date.now();

    let allMessages: AgentMessage[] = [];
    let iterations = 0;
    const errors: string[] = [];

    try {
      // 根据协调模式执行
      let execResult: { messages: AgentMessage[]; iterations: number };
      switch (crew.config.coordination) {
        case 'sequential':
          execResult = await this.executeSequential(crew, task);
          break;
        case 'hierarchical':
          execResult = await this.executeHierarchical(crew, task);
          break;
        case 'parallel':
          execResult = await this.executeParallel(crew, task);
          break;
        default:
          execResult = await this.executeSequential(crew, task);
      }
      allMessages = execResult.messages;
      iterations = execResult.iterations;

      crew.status = 'completed';
      crew.completedAt = Date.now();

      const result: CrewResult = {
        crewId,
        success: true,
        finalMessage: allMessages[allMessages.length - 1],
        allMessages,
        iterations,
        duration: Date.now() - startTime,
        errors,
      };

      this.emitEvent(crewId, 'crew_completed', result as unknown as Record<string, unknown>);
      return result;
    } catch (error) {
      crew.status = 'failed';
      errors.push(error instanceof Error ? error.message : String(error));

      const result: CrewResult = {
        crewId,
        success: false,
        allMessages,
        iterations,
        duration: Date.now() - startTime,
        errors,
      };

      this.emitEvent(crewId, 'crew_failed', { error: errors[0] });
      return result;
    }
  }

  /**
   * 流式执行任务
   */
  async *executeStream(task: string, crewId: string): AsyncGenerator<StreamEvent> {
    const crew = this.crews.get(crewId);
    if (!crew) {
      throw new Error(`Crew ${crewId} not found`);
    }

    crew.status = 'running';
    crew.startedAt = Date.now();

    yield {
      type: 'status',
      status: 'idle',
      content: 'Crew started',
      timestamp: Date.now(),
    };

    // 根据协调模式流式执行
    switch (crew.config.coordination) {
      case 'sequential':
        yield* this.executeSequentialStream(crew, task);
        break;
      case 'hierarchical':
        yield* this.executeHierarchicalStream(crew, task);
        break;
      case 'parallel':
        yield* this.executeParallelStream(crew, task);
        break;
    }

    yield {
      type: 'complete',
      content: 'Crew execution completed',
      timestamp: Date.now(),
    };
  }

  /**
   * 顺序执行
   */
  private async executeSequential(
    crew: Crew,
    task: string
  ): Promise<{ messages: AgentMessage[]; iterations: number }> {
    const allMessages: AgentMessage[] = [];
    let iterations = 0;
    const maxIterations = crew.config.maxIterations || 10;

    // 添加初始任务
    const initialMessage = createAgentMessage('user', task);
    allMessages.push(initialMessage);

    for (const [agentId, agent] of crew.agents) {
      if (iterations >= maxIterations) break;

      agent.status = 'thinking';
      this.emitAgentStatus(agent);

      // 模拟 Agent 执行
      const response = await this.simulateAgentExecution(
        agent,
        allMessages,
        crew.config.sharingStrategy || 'minimal'
      );

      agent.status = 'completed';
      agent.lastActiveAt = Date.now();
      agent.messages.push(response);
      allMessages.push(response);

      iterations++;
      this.emitAgentStatus(agent);
    }

    return { messages: allMessages, iterations };
  }

  /**
   * 层级执行 (按优先级)
   */
  private async executeHierarchical(
    crew: Crew,
    task: string
  ): Promise<{ messages: AgentMessage[]; iterations: number }> {
    const allMessages: AgentMessage[] = [];
    let iterations = 0;
    const maxIterations = crew.config.maxIterations || 10;

    // 按优先级排序 Agent
    const sortedAgents = Array.from(crew.agents.values()).sort(
      (a, b) => (a.role.priority || 0) - (b.role.priority || 0)
    );

    // 初始任务
    allMessages.push(createAgentMessage('user', task));

    // 首先由最高优先级 Agent 规划
    const planner = sortedAgents[0];
    planner.status = 'thinking';
    this.emitAgentStatus(planner);

    const planResponse = await this.simulateAgentExecution(planner, allMessages, 'full');
    planner.status = 'completed';
    planner.messages.push(planResponse);
    allMessages.push(planResponse);
    iterations++;

    // 然后分配给其他 Agent 执行
    for (let i = 1; i < sortedAgents.length && iterations < maxIterations; i++) {
      const executor = sortedAgents[i];
      executor.status = 'executing';
      this.emitAgentStatus(executor);

      const execResponse = await this.simulateAgentExecution(executor, allMessages, 'full');
      executor.status = 'completed';
      executor.messages.push(execResponse);
      allMessages.push(execResponse);
      iterations++;
    }

    return { messages: allMessages, iterations };
  }

  /**
   * 并行执行
   */
  private async executeParallel(
    crew: Crew,
    task: string
  ): Promise<{ messages: AgentMessage[]; iterations: number }> {
    const allMessages: AgentMessage[] = [];
    const maxIterations = crew.config.maxIterations || 10;

    allMessages.push(createAgentMessage('user', task));

    // 并行执行所有 Agent
    const agentPromises = Array.from(crew.agents.values()).map(async agent => {
      agent.status = 'executing';
      this.emitAgentStatus(agent);

      const response = await this.simulateAgentExecution(
        agent,
        allMessages,
        crew.config.sharingStrategy || 'minimal'
      );

      agent.status = 'completed';
      agent.lastActiveAt = Date.now();
      agent.messages.push(response);

      return response;
    });

    const responses = await Promise.all(agentPromises);
    allMessages.push(...responses);

    return { messages: allMessages, iterations: responses.length };
  }

  /**
   * 流式顺序执行
   */
  private async *executeSequentialStream(crew: Crew, task: string): AsyncGenerator<StreamEvent> {
    const maxIterations = crew.config.maxIterations || 10;
    let iterations = 0;

    yield {
      type: 'message',
      content: task,
      role: 'user',
      timestamp: Date.now(),
    };

    for (const [agentId, agent] of crew.agents) {
      if (iterations >= maxIterations) break;

      yield {
        type: 'status',
        agentId,
        agentName: agent.role.name,
        status: 'thinking',
        timestamp: Date.now(),
      };

      // 模拟流式输出
      const response = await this.simulateAgentStream(
        agent,
        agent.role.instructions,
        crew.config.sharingStrategy || 'minimal'
      );

      for await (const chunk of response) {
        yield chunk;
      }

      agent.status = 'completed';
      agent.lastActiveAt = Date.now();
      iterations++;
    }
  }

  /**
   * 流式层级执行
   */
  private async *executeHierarchicalStream(crew: Crew, task: string): AsyncGenerator<StreamEvent> {
    const sortedAgents = Array.from(crew.agents.values()).sort(
      (a, b) => (a.role.priority || 0) - (b.role.priority || 0)
    );

    yield {
      type: 'message',
      content: task,
      role: 'user',
      timestamp: Date.now(),
    };

    // 规划阶段
    const planner = sortedAgents[0];
    yield {
      type: 'status',
      agentId: planner.id,
      agentName: planner.role.name,
      status: 'thinking',
      content: 'Planning...',
      timestamp: Date.now(),
    };

    const planResponse = await this.simulateAgentStream(planner, `规划任务: ${task}`);
    for await (const chunk of planResponse) {
      yield chunk;
    }

    // 执行阶段
    for (let i = 1; i < sortedAgents.length; i++) {
      const executor = sortedAgents[i];
      yield {
        type: 'status',
        agentId: executor.id,
        agentName: executor.role.name,
        status: 'executing',
        content: 'Executing...',
        timestamp: Date.now(),
      };

      const execResponse = await this.simulateAgentStream(executor, executor.role.instructions);
      for await (const chunk of execResponse) {
        yield chunk;
      }
    }
  }

  /**
   * 流式并行执行
   */
  private async *executeParallelStream(crew: Crew, task: string): AsyncGenerator<StreamEvent> {
    yield {
      type: 'message',
      content: task,
      role: 'user',
      timestamp: Date.now(),
    };

    // 并行执行所有 Agent
    const agentPromises = Array.from(crew.agents.values()).map(async agent => {
      agent.status = 'executing';
      this.emitAgentStatus(agent);

      const chunks: StreamEvent[] = [];
      const stream = this.simulateAgentStream(agent, agent.role.instructions);

      for await (const chunk of stream) {
        chunks.push({ ...chunk, agentId: agent.id, agentName: agent.role.name });
      }

      agent.status = 'completed';
      agent.lastActiveAt = Date.now();

      return chunks;
    });

    // 等待所有 Agent 完成并 yield 结果
    const results = await Promise.all(agentPromises);
    for (const chunks of results) {
      for (const chunk of chunks) {
        yield chunk;
      }
    }
  }

  /**
   * 模拟 Agent 执行 (简单实现，后续会连接 ModelGateway)
   */
  private async simulateAgentExecution(
    agent: Agent,
    context: AgentMessage[],
    sharingStrategy: SharingStrategy
  ): Promise<AgentMessage> {
    // 简化实现：生成模拟响应
    const systemPrompt = buildSystemPrompt(
      agent.role.name,
      agent.role.description,
      agent.role.instructions,
      agent.role.tools
    );

    // 根据共享策略选择上下文
    let contextMessages: AgentMessage[] = [];
    switch (sharingStrategy) {
      case 'full':
        contextMessages = context;
        break;
      case 'minimal':
        contextMessages = context.slice(-2);
        break;
      case 'contextual':
        contextMessages = this.filterContextualMessages(context, agent.role);
        break;
    }

    const response = createAgentMessage(
      'agent',
      `[${agent.role.name}] 已处理任务。角色指令: ${agent.role.instructions.slice(0, 50)}...`,
      { agentId: agent.id, agentName: agent.role.name }
    );

    return response;
  }

  /**
   * 模拟流式输出
   */
  private async *simulateAgentStream(
    agent: Agent,
    instructions: string,
    _sharingStrategy: SharingStrategy = 'minimal'
  ): AsyncGenerator<StreamEvent> {
    const words = `[${agent.role.name}] 执行中: ${instructions.slice(0, 30)}...`.split(' ');

    for (const word of words) {
      yield {
        type: 'message',
        agentId: agent.id,
        agentName: agent.role.name,
        content: word + ' ',
        timestamp: Date.now(),
      };
      await this.sleep(50);
    }
  }

  /**
   * 过滤上下文相关消息
   */
  private filterContextualMessages(messages: AgentMessage[], role: AgentRole): AgentMessage[] {
    // 简单实现：返回最后一条消息
    return messages.slice(-1);
  }

  /**
   * 睡眠辅助
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 发送 Agent 状态事件
   */
  private emitAgentStatus(agent: Agent): void {
    this.emitEvent(agent.id, 'agent_status_changed', {
      agentId: agent.id,
      agentName: agent.role.name,
      status: agent.status,
    });
  }

  /**
   * 发送团队事件
   */
  private emitEvent(crewId: string, type: string, data: Record<string, unknown>): void {
    this.eventBus.emit({
      type: TaskFlowEvent.WORKFLOW_COMPLETE, // 复用工作流事件
      payload: { crewId, type, ...data },
      timestamp: Date.now(),
      source: 'AgentCrew',
    });

    if (crewId.startsWith('crew-')) {
      logger.debug(`Crew ${crewId} event: ${type}`, data);
    }
  }

  /**
   * 获取团队状态
   */
  getCrewStatus(crewId: string): Crew | undefined {
    return this.crews.get(crewId);
  }

  /**
   * 暂停团队
   */
  pauseCrew(crewId: string): void {
    const crew = this.crews.get(crewId);
    if (crew && crew.status === 'running') {
      crew.status = 'paused';
    }
  }

  /**
   * 恢复团队
   */
  resumeCrew(crewId: string): void {
    const crew = this.crews.get(crewId);
    if (crew && crew.status === 'paused') {
      crew.status = 'running';
    }
  }

  /**
   * 停止团队
   */
  stopCrew(crewId: string): void {
    const crew = this.crews.get(crewId);
    if (crew) {
      crew.status = 'stopped';
      crew.completedAt = Date.now();
    }
  }

  /**
   * 获取所有团队
   */
  listCrews(): Crew[] {
    return Array.from(this.crews.values());
  }
}

// 默认实例
let defaultCrew: AgentCrew | null = null;

export function getAgentCrew(): AgentCrew {
  if (!defaultCrew) {
    defaultCrew = new AgentCrew();
  }
  return defaultCrew;
}

export default AgentCrew;
