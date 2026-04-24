// @ts-nocheck
import { TaskFlowConfig, ModelConfig } from '../config';

describe('Config Types', () => {
  it('should create a valid config', () => {
    const config: TaskFlowConfig = {
      version: '4.0.0',
      workspace: '/workspace',
      environment: 'development',
      models: [],
      cache: {
        enabled: true,
        l1: { enabled: true, maxSize: 100, ttl: 600 },
        l2: { enabled: true, ttl: 86400 }
      },
      logging: {
        level: 'info',
        console: true,
        format: 'text'
      },
      plugins: {
        enabled: [],
        directory: './plugins',
        autoLoad: true
      },
      extensions: {
        agents: { directory: './extensions/agents', autoDiscover: true },
        tools: { directory: './extensions/tools', autoDiscover: true },
        workflows: { directory: './extensions/workflows', autoDiscover: true }
      },
      security: {
        enableCommandWhitelist: true,
        enablePrivateIPRestriction: true,
        enablePathTraversalProtection: true,
        enableCredentialMasking: true
      }
    };

    expect(config.version).toBe('4.0.0');
  });

  it('should create model config', () => {
    const model: ModelConfig = {
      id: 'deepseek-chat',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      enabled: true,
      priority: 1,
      capabilities: ['chat', 'reasoning']
    };

    expect(model.provider).toBe('deepseek');
    expect(model.capabilities).toContain('chat');
  });
});
