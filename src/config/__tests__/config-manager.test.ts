// @ts-nocheck


describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  it('should load default config', () => {
    const config = configManager.getConfig();

    expect(config).toBeDefined();
    expect(config.version).toBeDefined();
    expect(config.workspace).toBeDefined();
  });

  it('should update config', () => {
    configManager.updateConfig({ workspace: '/new-workspace' });

    const config = configManager.getConfig();
    expect(config.workspace).toBe('/new-workspace');
  });

  it('should get specific model', () => {
    configManager.updateConfig({
      models: [
        {
          id: 'test-model',
          provider: 'custom' as const,
          modelName: 'test',
          enabled: true,
          priority: 1,
          capabilities: ['chat' as const]
        }
      ]
    });

    const model = configManager.getModel('test-model');
    expect(model).toBeDefined();
    expect(model?.id).toBe('test-model');
  });

  it('should cache config', () => {
    configManager.updateConfig({ workspace: '/test' });
    configManager.setCache(true);

    const config1 = configManager.getConfig();
    const config2 = configManager.getConfig();

    expect(config1).toBe(config2); // Same reference
  });

  it('should validate config', () => {
    const result = configManager.validateConfig({ workspace: '/test' } as any);
    expect(result.valid).toBe(false); // Missing required fields
  });
});
