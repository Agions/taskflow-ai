import {
  PluginExtension,
  ExtensionPoint,
  PluginHooks,
  PluginContext as PluginContextType
} from '../plugin';

describe('Plugin Types', () => {
  it('should create a valid plugin extension', () => {
    const plugin: PluginExtension = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      extensionPoints: [],
      hooks: {}
    };

    expect(plugin.id).toBe('test-plugin');
  });

  it('should define plugin hooks', () => {
    const hooks: PluginHooks = {
      onInit: async (context) => {
        console.log('Initialized');
      },
      onLoad: async () => {
        console.log('Loaded');
      }
    };

    expect(typeof hooks.onInit).toBe('function');
  });

  it('should create extension point', () => {
    const point: ExtensionPoint = {
      type: 'agent',
      id: 'custom-agent',
      implementation: {}
    };

    expect(point.type).toBe('agent');
  });
});
