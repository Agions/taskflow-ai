import { TaskFlowConfig } from './types';

export class TaskFlowAI {
  private static validateConfig(config: any): config is TaskFlowConfig {
    return (
      config &&
      typeof config === 'object' &&
      typeof config.apiKey === 'string' &&
      typeof config.model === 'string'
    );
  }

  static createConfig(apiKey: string, model: string, options?: Partial<TaskFlowConfig>): TaskFlowConfig {
    const config: TaskFlowConfig = {
      apiKey,
      model,
      timeout: options?.timeout || 30000,
      maxRetries: options?.maxRetries || 3,
    };

    if (!this.validateConfig(config)) {
      throw new Error('Invalid configuration provided');
    }

    return config;
  }
}