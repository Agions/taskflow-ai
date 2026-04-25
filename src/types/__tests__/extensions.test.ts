// @ts-nocheck
import {
  ExtensionRegistry,
  ExtensionLifecycle,
  ExtensionLoader,
  ExtensionType
} from '../extensions';

describe('Extensions Types', () => {
  it('should define extension registry', () => {
    const registry: ExtensionRegistry = {
      register: jest.fn(),
      unregister: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      has: jest.fn(),
      clear: jest.fn()
    };

    expect(typeof registry.register).toBe('function');
  });

  it('should define extension lifecycle', () => {
    const lifecycle: ExtensionLifecycle = {
      onRegister: jest.fn(),
      onActivate: jest.fn(),
      onDeactivate: jest.fn(),
      onUnregister: jest.fn(),
      onError: jest.fn()
    };

    expect(typeof lifecycle.onRegister).toBe('function');
  });

  it('should define extension loader', () => {
    const loader: ExtensionLoader = {
      load: jest.fn(),
      loadFromFile: jest.fn(),
      loadFromDirectory: jest.fn(),
      unload: jest.fn(),
      reload: jest.fn()
    };

    expect(typeof loader.load).toBe('function');
  });

  it('should have correct extension types', () => {
    expect(ExtensionTypes.PLUGIN).toBe('plugin');
    expect(ExtensionTypes.AGENT).toBe('agent');
    expect(ExtensionTypes.TOOL).toBe('tool');
    expect(ExtensionTypes.WORKFLOW).toBe('workflow');
  });
});
