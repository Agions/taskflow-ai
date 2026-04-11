/**
 * 多 Agent 协作系统
 * Agent 注册、消息传递、任务分发
 */

import {
  Agent,
  AgentTask,
  AgentExecution,
  AgentConfig,
  AgentCapability,
  AgentMetrics,
} from './types';
import { AgentCore } from './core';
import { Logger } from '../../utils/logger';

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification' | 'collaboration';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface TaskDistribution {
  taskId: string;
  agents: string[];
  strategy: 'sequential' | 'parallel' | 'hierarchical';
}

/**
 * 多 Agent 协调器
 */
export class MultiAgentCoordinator {
  private logger: Logger;
  private agents: Map<string, AgentCore> = new Map();
  private agentConfigs: Map<string, AgentConfig> = new Map();
  private messageQueue: AgentMessage[] = [];
  private messageBus: Map<string, AgentMessage[]> = new Map();
  private metrics: Map<string, AgentMetrics> = new Map();

  constructor() {
    this.logger = Logger.getInstance('MultiAgentCoordinator');
  }

  /**
   * 注册 Agent（使用 AgentConfig）
   */
  register(config: AgentConfig): AgentCore {
    const core = new AgentCore(config);
    this.agents.set(config.id, core);
    this.agentConfigs.set(config.id, config);
    this.messageBus.set(config.id, []);

    // 初始化指标
    this.metrics.set(config.id, {
      agentId: config.id,
      callCount: 0,
      successCount: 0,
      failureCount: 0,
      totalDuration: 0,
      averageDuration: 0,
    });

    this.logger.info(`Agent 已注册: ${config.name} (id: ${config.id})`);
    return core;
  }

  /**
   * 注册 Agent（使用旧的 Agent 对象，保持向后兼容）
   * @deprecated 请使用 register(config: AgentConfig)
   */
  registerAgent(agent: Agent): AgentCore {
    const config: AgentConfig = {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      capabilities: agent.capabilities,
      model: agent.model,
      tools: agent.tools,
      memory: {
        maxShortTerm: agent.memory.maxShortTerm,
        maxLongTerm: 0,
      },
    };
    return this.register(config);
  }

  /**
   * 注销 Agent
   */
  unregister(agentId: string): boolean {
    const core = this.agents.get(agentId);
    if (!core) return false;

    this.agents.delete(agentId);
    this.agentConfigs.delete(agentId);
    this.messageBus.delete(agentId);
    this.metrics.delete(agentId);
    this.logger.info(`Agent 已注销: ${agentId}`);
    return true;
  }

  /**
   * 获取 Agent
   */
  get(agentId: string): AgentCore | undefined {
    return this.agents.get(agentId);
  }

  /**
   * 获取 Agent 配置
   */
  getConfig(agentId: string): AgentConfig | undefined {
    return this.agentConfigs.get(agentId);
  }

  /**
   * 列出所有 Agent
   */
  list(): Agent[] {
    return Array.from(this.agents.values()).map(a => a.getAgent());
  }

  /**
   * 获取所有 Agent 配置
   */
  listConfigs(): AgentConfig[] {
    return Array.from(this.agentConfigs.values());
  }

  /**
   * 向所有已注册 Agent 广播消息
   */
  broadcast(from: string, content: string, type: AgentMessage['type'] = 'notification'): void {
    let broadcastCount = 0;
    for (const agentId of this.agents.keys()) {
      if (agentId !== from) {
        this.sendMessage({
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          from,
          to: agentId,
          type,
          content,
          timestamp: Date.now(),
        });
        broadcastCount++;
      }
    }
    this.logger.info(`广播消息: ${from} -> ${broadcastCount} 个 Agent`);
  }

  /**
   * 发送消息
   */
  sendMessage(message: AgentMessage): void {
    const queue = this.messageBus.get(message.to);
    if (queue) {
      queue.push(message);
      this.logger.info(`消息发送: ${message.from} -> ${message.to}`);
    }
  }

  /**
   * 接收消息
   */
  receiveMessage(agentId: string): AgentMessage[] {
    const queue = this.messageBus.get(agentId) || [];
    const messages = [...queue];
    this.messageBus.set(agentId, []);
    return messages;
  }

  /**
   * 根据能力匹配最合适的 Agent
   */
  matchAgents(requiredCapabilities: AgentCapability[]): string[] {
    const matches: Array<{ agentId: string; score: number; config: AgentConfig }> = [];

    for (const [agentId, config] of this.agentConfigs.entries()) {
      let score = 0;
      for (const required of requiredCapabilities) {
        if (config.capabilities.includes(required)) {
          score += 1;
        }
      }
      if (score > 0) {
        matches.push({ agentId, score, config });
      }
    }

    // 按匹配分数降序排序
    matches.sort((a, b) => b.score - a.score);

    return matches.map(m => m.agentId);
  }

  /**
   * 分发任务
   */
  async distributeTask(
    task: AgentTask,
    agentIds: string[],
    strategy: TaskDistribution['strategy'] = 'parallel'
  ): Promise<AgentExecution[]> {
    this.logger.info(`分发任务到 ${agentIds.length} 个 Agent (策略: ${strategy})`);

    const executions: AgentExecution[] = [];

    switch (strategy) {
      case 'sequential':
        for (const agentId of agentIds) {
          const agent = this.agents.get(agentId);
          if (agent) {
            const startTime = Date.now();
            const exec = await agent.execute(task);
            const duration = Date.now() - startTime;
            this.updateMetrics(agentId, exec, duration);
            executions.push(exec);

            if (exec.status === 'failed') break;
          }
        }
        break;

      case 'parallel': {
        const promises = agentIds.map(async agentId => {
          const agent = this.agents.get(agentId);
          if (agent) {
            const startTime = Date.now();
            const exec = await agent.execute(task);
            const duration = Date.now() - startTime;
            this.updateMetrics(agentId, exec, duration);
            return exec;
          }
          return undefined;
        });
        const results = await Promise.all(promises);
        executions.push(...results.filter((r): r is AgentExecution => r !== undefined));
        break;
      }

      case 'hierarchical': {
        const mainAgent = this.agents.get(agentIds[0]);
        if (mainAgent) {
          const startTime = Date.now();
          const exec = await mainAgent.execute(task);
          const duration = Date.now() - startTime;
          this.updateMetrics(agentIds[0], exec, duration);
          executions.push(exec);
        }
        break;
      }
    }

    return executions;
  }

  /**
   * 协作任务执行（多 Agent 协作完成复杂任务）
   */
  async executeCollaborative(
    task: AgentTask,
    agentIds?: AgentCapability[]
  ): Promise<AgentExecution[]> {
    this.logger.info('启动协作任务');

    let selectedAgentIds: string[];

    if (agentIds && agentIds.length > 0) {
      // 如果指定了能力要求，使用能力匹配
      const capabilityList = agentIds as AgentCapability[];
      selectedAgentIds = this.matchAgents(capabilityList);

      if (selectedAgentIds.length === 0) {
        this.logger.warn(`没有找到匹配 ${capabilityList.join(', ')} 能力的 Agent`);
        // fallback 到所有 Agent
        selectedAgentIds = Array.from(this.agents.keys());
      }
    } else {
      // 使用所有 Agent
      selectedAgentIds = Array.from(this.agents.keys());
    }

    this.logger.info(`协作任务使用 ${selectedAgentIds.length} 个 Agent`);

    // 分解任务
    const subtasks = this.decomposeTask(task);

    // 分配子任务
    const distributions: TaskDistribution[] = [];

    for (let i = 0; i < selectedAgentIds.length; i++) {
      const subtask = subtasks[i % subtasks.length];
      distributions.push({
        taskId: subtask.id,
        agents: [selectedAgentIds[i]],
        strategy: 'sequential',
      });
    }

    const executions: AgentExecution[] = [];

    // 按顺序执行子任务，每个 Agent 负责一个
    for (let i = 0; i < distributions.length; i++) {
      const dist = distributions[i];
      const agentId = selectedAgentIds[i % selectedAgentIds.length];
      const agent = this.agents.get(agentId);

      if (agent) {
        const subtask = subtasks[i % subtasks.length];
        const startTime = Date.now();

        // 为每个子任务创建新的 task 副本
        const subtaskCopy: AgentTask = {
          ...task,
          id: `${task.id}-sub${i}`,
          description: subtask.description,
          status: 'in_progress',
        };

        const exec = await agent.execute(subtaskCopy);
        const duration = Date.now() - startTime;
        this.updateMetrics(agentId, exec, duration);
        executions.push(exec);

        // 如果某个子任务失败，通知所有 Agent
        if (exec.status === 'failed') {
          this.broadcast('coordinator', `协作任务子任务 ${i + 1} 失败: ${exec.task.error}`, 'notification');
          break;
        }

        // 将执行结果通知其他 Agent
        if (exec.status === 'completed') {
          this.broadcast('coordinator', `协作任务子任务 ${i + 1} 完成`, 'notification');
        }
      }
    }

    const aggregated = this.aggregateResults(executions);
    this.broadcast('coordinator', `协作任务完成: ${aggregated}`, 'notification');

    this.logger.info(`协作任务完成: ${aggregated}`);

    return executions;
  }

  /**
   * 协作任务（保持向后兼容）
   * @deprecated 请使用 executeCollaborative
   */
  async collaborate(task: AgentTask, agentIds: string[]): Promise<AgentExecution[]> {
    this.logger.info(`启动协作任务 (legacy)`);

    const subtasks = this.decomposeTask(task);

    const distributions: TaskDistribution[] = [];

    for (let i = 0; i < agentIds.length; i++) {
      const subtask = subtasks[i % subtasks.length];
      distributions.push({
        taskId: subtask.id,
        agents: [agentIds[i]],
        strategy: 'sequential',
      });
    }

    const executions: AgentExecution[] = [];

    for (const dist of distributions) {
      const agent = this.agents.get(dist.agents[0]);
      if (agent) {
        const startTime = Date.now();
        const exec = await agent.execute({
          ...task,
          id: dist.taskId,
          description: subtasks.find(s => s.id === dist.taskId)?.description || '',
        });
        const duration = Date.now() - startTime;
        this.updateMetrics(dist.agents[0], exec, duration);
        executions.push(exec);
      }
    }

    const aggregated = this.aggregateResults(executions);

    this.broadcast('coordinator', `任务完成: ${aggregated}`);

    return executions;
  }

  /**
   * 获取 Agent 指标
   */
  getMetrics(agentId: string): AgentMetrics | undefined {
    return this.metrics.get(agentId);
  }

  /**
   * 获取所有 Agent 指标
   */
  listMetrics(): AgentMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * 更新 Agent 指标
   */
  private updateMetrics(agentId: string, execution: AgentExecution, duration: number): void {
    const metric = this.metrics.get(agentId);
    if (!metric) return;

    metric.callCount += 1;
    metric.totalDuration += duration;
    metric.averageDuration = Math.round(metric.totalDuration / metric.callCount);
    metric.lastCallAt = Date.now();

    if (execution.status === 'completed') {
      metric.successCount += 1;
    } else if (execution.status === 'failed') {
      metric.failureCount += 1;
    }
  }

  /**
   * 重置 Agent 指标
   */
  resetMetrics(agentId: string): void {
    const metric = this.metrics.get(agentId);
    if (metric) {
      metric.callCount = 0;
      metric.successCount = 0;
      metric.failureCount = 0;
      metric.totalDuration = 0;
      metric.averageDuration = 0;
      metric.lastCallAt = undefined;
    }
  }

  /**
   * 重置所有 Agent 指标
   */
  resetAllMetrics(): void {
    for (const agentId of this.metrics.keys()) {
      this.resetMetrics(agentId);
    }
  }

  /**
   * 分解任务
   */
  private decomposeTask(task: AgentTask): AgentTask[] {
    const separators = /[;；.。]/;
    const parts = task.description
      .split(separators)
      .map(s => s.trim())
      .filter(s => s);

    return parts.map((part, index) => ({
      ...task,
      id: `${task.id}-sub${index}`,
      description: part,
    }));
  }

  /**
   * 聚合结果
   */
  private aggregateResults(executions: AgentExecution[]): string {
    const successCount = executions.filter(e => e.status === 'completed').length;
    return `${successCount}/${executions.length} 子任务完成`;
  }
}

/**
 * Agent 工厂
 */
export class AgentFactory {
  /**
   * 创建 Agent 配置
   */
  static createConfig(
    name: string,
    capabilities: AgentCapability[],
    tools: string[] = []
  ): AgentConfig {
    return {
      id: `agent-${name}-${Date.now()}`,
      name,
      capabilities,
      tools,
      memory: {
        maxShortTerm: 100,
        maxLongTerm: 50,
      },
    };
  }

  /**
   * 创建分析 Agent
   */
  static createAnalyzer(name: string = 'analyzer'): AgentConfig {
    return {
      id: `agent-${name}-${Date.now()}`,
      name,
      description: '分析型 Agent，擅长理解需求和问题分析',
      capabilities: ['reasoning'],
      tools: ['project_analyze'],
      memory: {
        maxShortTerm: 100,
        maxLongTerm: 50,
      },
    };
  }

  /**
   * 创建执行 Agent
   */
  static createExecutor(name: string = 'executor'): AgentConfig {
    return {
      id: `agent-${name}-${Date.now()}`,
      name,
      description: '执行型 Agent，擅长工具调用和任务执行',
      capabilities: ['tool_use', 'code'],
      tools: ['shell_exec', 'file_write', 'file_read'],
      memory: {
        maxShortTerm: 50,
        maxLongTerm: 20,
      },
    };
  }

  /**
   * 创建审查 Agent
   */
  static createReviewer(name: string = 'reviewer'): AgentConfig {
    return {
      id: `agent-${name}-${Date.now()}`,
      name,
      description: '审查型 Agent，擅长代码和结果审查',
      capabilities: ['reasoning', 'code'],
      tools: ['file_read', 'project_analyze'],
      memory: {
        maxShortTerm: 100,
        maxLongTerm: 50,
      },
    };
  }

  /**
   * 创建搜索 Agent
   */
  static createSearcher(name: string = 'searcher'): AgentConfig {
    return {
      id: `agent-${name}-${Date.now()}`,
      name,
      description: '搜索型 Agent，擅长信息检索',
      capabilities: ['search', 'reasoning'],
      tools: ['web_search', 'project_analyze'],
      memory: {
        maxShortTerm: 100,
        maxLongTerm: 100,
      },
    };
  }

  /**
   * 创建协作 Agent
   */
  static createCollaborator(name: string = 'collaborator'): AgentConfig {
    return {
      id: `agent-${name}-${Date.now()}`,
      name,
      description: '协作型 Agent，擅长多 Agent 协调',
      capabilities: ['collaboration', 'reasoning'],
      tools: [],
      memory: {
        maxShortTerm: 150,
        maxLongTerm: 100,
      },
    };
  }

  /**
   * 从旧的 Agent 对象创建配置（向后兼容）
   */
  static fromAgent(agent: Agent): AgentConfig {
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      capabilities: agent.capabilities,
      model: agent.model,
      tools: agent.tools,
      memory: {
        maxShortTerm: agent.memory.maxShortTerm,
        maxLongTerm: 0,
      },
    };
  }
}

export const agentCoordinator = new MultiAgentCoordinator();
