import {
  AgentRuntime,
  AgentConfig,
  AgentTask,
  TaskResult,
  AgentState,
  AgentMessage,
  AgentStatus,
  AgentMemory
} from '../../types/agent';
import { Logger } from '../../utils/logger';

/**
 * Agent Runtime - 统一的 Agent 运行时实现
 * TaskFlow AI v4.0
 */
export class AgentRuntimeImpl implements AgentRuntime {
  id: string;
  private logger: Logger;
  private config: AgentConfig;
  private state: AgentState;
  private memory: AgentMemory;

  constructor(config: AgentConfig) {
    this.id = config.id;
    this.config = config;
    this.logger = Logger.getInstance(`Agent(${config.id})`);
    this.memory = {
      shortTerm: [],
      longTerm: [],
      maxShortTerm: config.memory.maxShortTerm,
      maxLongTerm: config.memory.maxLongTerm
    };

    this.state = {
      status: 'idle',
      messages: [],
      memory: this.memory,
      metrics: {
        tasksCompleted: 0,
        tasksFailed: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0
      }
    };
  }

  async execute(task: AgentTask): Promise<TaskResult> {
    const startTime = Date.now();
    this.state.status = 'executing';
    this.state.currentTask = task;

    this.logger.info(`Executing task: ${task.id} - ${task.description}`);

    try {
      // 模拟任务执行
      await this.simulateExecution(task);

      const duration = Date.now() - startTime;
      const result: TaskResult = {
        taskId: task.id,
        success: true,
        output: `Task ${task.id} completed successfully`,
        duration,
        steps: [
          {
            step: 1,
            type: 'thought',
            content: `Analyzing task: ${task.description}`,
            timestamp: startTime
          },
          {
            step: 2,
            type: 'action',
            content: 'Executing task logic',
            timestamp: startTime + 100
          },
          {
            step: 3,
            type: 'reflection',
            content: 'Task completed',
            timestamp: startTime + 200
          }
        ]
      };

      this.state.metrics.tasksCompleted++;
      this.state.metrics.totalExecutionTime += duration;
      if (this.state.metrics.tasksCompleted > 0) {
        this.state.metrics.averageExecutionTime =
          this.state.metrics.totalExecutionTime / this.state.metrics.tasksCompleted;
      }

      this.state.status = 'idle';
      this.state.currentTask = undefined;

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.state.metrics.tasksFailed++;
      this.state.status = 'failed';

      throw error;
    }
  }

  getState(): AgentState {
    return { ...this.state };
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  async updateConfig(config: Partial<AgentConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    this.logger.info('Agent configuration updated');
  }

  async reset(): Promise<void> {
    this.state.status = 'idle';
    this.state.currentGoal = undefined;
    this.state.currentTask = undefined;
    this.state.messages = [];
    this.memory.shortTerm = [];
    this.memory.longTerm = [];
    this.logger.info('Agent state reset');
  }

  async destroy(): Promise<void> {
    this.state.status = 'destroyed';
    this.logger.info('Agent destroyed');
  }

  addMessage(message: AgentMessage): void {
    this.state.messages.push(message);
    // 限制消息数量
    if (this.state.messages.length > 100) {
      this.state.messages.shift();
    }
  }

  getMessages(limit?: number): AgentMessage[] {
    if (limit) {
      return this.state.messages.slice(-limit);
    }
    return [...this.state.messages];
  }

  private async simulateExecution(task: AgentTask): Promise<void> {
    // 模拟异步任务执行
    return new Promise(resolve => {
      setTimeout(resolve, 100);
    });
  }
}

/**
 * Agent Runtime Factory
 */
export const createAgentRuntime = async (config: AgentConfig): Promise<AgentRuntime> => {
  return new AgentRuntimeImpl(config);
};
