import { ExtensionLifecycleManager, ExtensionLifecycle, ExtensionStatus, ExtensionDefinition } from './lifecycle-manager';

describe('ExtensionLifecycleManager', () => {
  let lifecycleManager: ExtensionLifecycleManager;
  const mockDefinition: ExtensionDefinition = {
    type: 'plugin' as any,
    id: 'test-extension',
    name: 'Test Extension',
    version: '1.0.0',
    implementation: {}
  };

  beforeEach(() => {
    lifecycleManager = new ExtensionLifecycleManager();
  });

  it('should register extension', async () => {
    const lifecycle: ExtensionLifecycle = {
      onRegister: jest.fn(),
      onActivate: jest.fn()
    };

    await lifecycleManager.register(mockDefinition, lifecycle);
    const status = lifecycleManager.getStatus('test-extension');

    expect(status).toBe(ExtensionStatus.LOADED);
  });

  it('should activate extension', async () => {
    const lifecycle: ExtensionLifecycle = {
      onRegister: jest.fn(),
      onActivate: jest.fn()
    };

    await lifecycleManager.register(mockDefinition, lifecycle);
    await lifecycleManager.activate('test-extension');

    expect(lifecycle.onActivate).toHaveBeenCalled();
  });

  it('should deactivate extension', async () => {
    const lifecycle: ExtensionLifecycle = {
      onRegister: jest.fn(),
      onActivate: jest.fn(),
      onDeactivate: jest.fn()
    };

    await lifecycleManager.register(mockDefinition, lifecycle);
    await lifecycleManager.activate('test-extension');
    await lifecycleManager.deactivate('test-extension');

    const status = lifecycleManager.getStatus('test-extension');
    expect(status).toBe(ExtensionStatus.INACTIVE);
  });

  it('should handle errors during activation', async () => {
    const lifecycle: ExtensionLifecycle = {
      onRegister: jest.fn(),
      onActivate: jest.fn().mockRejectedValue(new Error('Activation failed')),
      onError: jest.fn()
    };

    await lifecycleManager.register(mockDefinition, lifecycle);
    await lifecycleManager.activate('test-extension');

    expect(lifecycle.onError).toHaveBeenCalled();
  });

  it('should get all extensions', async () => {
    const lifecycle: ExtensionLifecycle = {
      onRegister: jest.fn(),
      onActivate: jest.fn()
    };

    await lifecycleManager.register(mockDefinition, lifecycle);
    const extensions = lifecycleManager.getAllExtensions();

    expect(extensions).toHaveLength(1);
    expect(extensions[0].id).toBe('test-extension');
  });
});
