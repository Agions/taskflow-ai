/**
 * 多 Agent 协作系统
 * Agent 注册、消息传递、任务分发
 */

import { Agent, AgentTask, AgentExecution } from './types';
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
  private messageQueue: AgentMessage[] = [];
  private messageBus: Map<string, AgentMessage[]> = new Map();

  constructor() {
    this.logger = Logger.getInstance('MultiAgentCoordinator');
  }

  /**
   * 注册 Agent
   */
  register(agent: Agent): AgentCore {
    const core = new AgentCore(agent);
    this.agents.set(agent.id, core);
    this.messageBus.set(agent.id, []);
    this.logger.info(`Agent 已注册: ${agent.name}`);
    return core;
  }

  /**
   * 注销 Agent
   */
  unregister(agentId: string): boolean {
    const core = this.agents.get(agentId);
    if (!core) return false;

    this.agents.delete(agentId);
    this.messageBus.delete(agentId);
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
   * 列出所有 Agent
   */
  list(): Agent[] {
    return Array.from(this.agents.values()).map(a => {
      const agent = a as any;
      return agent.agent;
    });
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
   * 广播消息
   */
  broadcast(from: string, content: string): void {
    for (const agentId of this.agents.keys()) {
      if (agentId !== from) {
        this.sendMessage({
          id: `msg-${Date.now()}`,
          from,
          to: agentId,
          type: 'notification',
          content,
          timestamp: Date.now(),
        });
      }
    }
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
        // 顺序执行
        for (const agentId of agentIds) {
          const agent = this.agents.get(agentId);
          if (agent) {
            const exec = await agent.execute(task);
            executions.push(exec);
            
            if (exec.status === 'failed') break;
          }
        }
        break;

      case 'parallel':
        // 并行执行
        const promises = agentIds.map(async (agentId) => {
          const agent = this.agents.get(agentId);
          if (agent) {
            return agent.execute(task);
          }
        });
        const results = await Promise.all(promises);
        executions.push(...results.filter(Boolean));
        break;

      case 'hierarchical':
        // 层级执行 - 主 Agent 协调
        const mainAgent = this.agents.get(agentIds[0]);
        if (mainAgent) {
          const exec = await mainAgent.execute(task);
          executions.push(exec);
        }
        break;
    }

    return executions;
  }

  /**
   * 协作任务
   */
  async collaborate(
    task: AgentTask,
    agentIds: string[]
  ): Promise<AgentExecution[]> {
    this.logger.info(`启动协作任务`);

    // 1. 分解任务
    const subtasks = this.decomposeTask(task);
    
    // 2. 分发给不同 Agent
    const distributions: TaskDistribution[] = [];
    
    for (let i = 0; i < agentIds.length; i++) {
      const subtask = subtasks[i % subtasks.length];
      distributions.push({
        taskId: subtask.id,
        agents: [agentIds[i]],
        strategy: 'sequential',
      });
    }

    // 3. 执行
    const executions: AgentExecution[] = [];
    
    for (const dist of distributions) {
      const agent = this.agents.get(dist.agents[0]);
      if (agent) {
        const exec = await agent.execute({
          ...task,
          id: dist.taskId,
          description: subtasks.find(s => s.id === dist.taskId)?.description || '',
        });
        executions.push(exec);
      }
    }

    // 4. 聚合结果
    const aggregated = this.aggregateResults(executions);
    
    // 5. 通知所有 Agent
    this.broadcast('coordinator', `任务完成: ${aggregated}`);

    return executions;
  }

  /**
   * 分解任务
   */
  private decomposeTask(task: AgentTask): AgentTask[] {
    // 简单实现 - 实际应该使用 AI
    const parts = task.description.split(/[;.；]/).filter(s => s.trim());
    
    return parts.map((part, index) => ({
      ...task,
      id: `${task.id}-sub${index}`,
      description: part.trim(),
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
   * 创建分析 Agent
   */
  static createAnalyzer(name: string = 'analyzer'): Agent {
    return {
      id: `agent-${name}-${Date.now()}`,
      name,
      description: '分析型 Agent，擅长理解需求和问题分析',
      capabilities: ['reasoning'],
      status: 'idle',
      tools: ['project_analyze'],
      memory: {
        shortTerm: [],
        longTerm: [],
        maxShortTerm: 100,
      },
    };
  }

  /**
   * 创建执行 Agent
   */
  static createExecutor(name: string = 'executor'): Agent {
    return {
      id: `agent-${name}-${Date.now()}`,
      name,
      description: '执行型 Agent，擅长工具调用和任务执行',
      capabilities: ['tool_use', 'code'],
      status: 'idle',
      tools: ['shell_exec', 'file_write', 'file_read'],
      memory: {
        shortTerm: [],
        longTerm: [],
        maxShortTerm: 50,
      },
    };
  }

  /**
   * 创建审查 Agent
   */
  static createReviewer(name: string = 'reviewer'): Agent {
    return {
      id: `agent-${name}-${Date.now()}`,
      name,
      description: '审查型 Agent，擅长代码和结果审查',
      capabilities: ['reasoning', 'code'],
      status: 'idle',
      tools: ['file_read', 'project_analyze'],
      memory: {
        shortTerm: [],
        longTerm: [],
        maxShortTerm: 100,
      },
    };
  }
}

// 导出单例
export const agentCoordinator = new MultiAgentCoordinator();
