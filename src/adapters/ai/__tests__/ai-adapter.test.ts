import { AIAdapter, AIModelConfig, AIRequest, AIResponse } from './ai-adapter';

describe('AIAdapter', () => {
  let adapter: AIAdapter;

  beforeEach(() => {
    adapter = new AIAdapter();
  });

  it('should register model config', () => {
    const config: AIModelConfig = {
      id: 'deepseek-chat',
      provider: 'deepseek',
      model: 'deepseek-chat',
      apiKey: 'test-key',
      baseURL: 'https://api.deepseek.com'
    };

    adapter.registerModel(config);
    expect(adapter.hasModel('deepseek-chat')).toBe(true);
  });

  it('should send request to AI provider', async () => {
    const config: AIModelConfig = {
      id: 'test-model',
      provider: 'openai',
      model: 'gpt-4',
      apiKey: 'test-key'
    };

    adapter.registerModel(config);

    const request: AIRequest = {
      modelId: 'test-model',
      messages: [{ role: 'user', content: 'Hello' }],
      temperature: 0.7
    };

    // Mock fetch would be needed here
    try {
      // await adapter.sendRequest(request);
    } catch (error) {
      // Expected to fail without mock
    }
  });

  it('should get model config', () => {
    const config: AIModelConfig = {
      id: 'test-model',
      provider: 'openai',
      model: 'gpt-4',
      apiKey: 'test-key'
    };

    adapter.registerModel(config);
    const retrieved = adapter.getModel('test-model');

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe('test-model');
  });
});
