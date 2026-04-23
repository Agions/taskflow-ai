/**
 * Agent Registry - Agent 注册表
 * TaskFlow AI v4.0
 */

import {
  AgentRuntime,
  AgentDefinition,
  AgentConfig
} from '../../types/agent';
import { Logger } from '../../utils/logger';

/**
 * Agent 注册表
 */
export class AgentRegistry {
  private logger: Logger;
  private agents: Map<string, AgentRuntime> = new Map();
  private definitions: Map<string, AgentDefinition> = new Map();

  constructor() {
    this.logger = Logger.getInstance('AgentRegistry');
  }

  /**
   * 注册 Agent 定义
   */
  registerDefinition(definition: AgentDefinition): void {
    this.definitions.set(definition.type, definition);
    this.logger.info(`Registered agent definition: ${definition.type} - ${definition.name}`);
  }

  /**
   * 创建 Agent 实例
   */
  async create(agentType: string, config: Partial<AgentConfig> = {}): Promise<AgentRuntime> {
    const definition = this.definitions.get(agentType);
    if (!definition) {
      throw new Error(`Agent definition not found: ${agentType}`);
    }

    const fullConfig: AgentConfig = {
      ...definition.defaultConfig,
      ...config,
      id: config.id || `${agentType}-${Date.now()}`,
      capabilities: config.capabilities || definition.capabilities,
      tools: config.tools || [],
      memory: config.memory || {
        maxShortTerm: 10,
        maxLongTerm: 100
      }
    };

    const runtime = await definition.factory(fullConfig);
    this.agents.set(runtime.id, runtime);

    this.logger.info(`Created agent instance: ${runtime.id} of type ${agentType}`);
    return runtime;
  }

  /**
   * 获取 Agent 实例
   */
  get(agentId: string): AgentRuntime | undefined {
    return this.agents.get(agentId);
  }

  /**
   * 获取所有 Agent 实例
   */
  getAll(): AgentRuntime[] {
    return Array.from(this.agents.values());
  }

  /**
   * 销毁 Agent 实例
   */
  async destroy(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    await agent.destroy();
    this.agents.delete(agentId);

    this.logger.info(`Destroyed agent: ${agentId}`);
    return true;
  }

  /**
   * 销毁所有 Agent
   */
  async destroyAll(): Promise<void> {
    const agentIds = Array.from(this.agents.keys());
    await Promise.all(agentIds.map(id => this.destroy(id)));
    this.logger.info('All agents destroyed');
  }
}
