
/**
 * Plugins Types Tests
 * TaskFlow AI v4.0
 */

import type {
  PluginManifest,
  HookHandler,
  HookContext,
  HookResult,
  PluginStatus,
  PluginInfo,
  TaskFlowPlugin,
  BuiltinPluginName,
  PluginStorage,
  PluginContext
} from '../types';
import { BUILTIN_PLUGINS } from '../types';

describe('Plugins Types', () => {
  describe('PluginManifest', () => {
    it('should create complete plugin manifest', () => {
      const manifest: PluginManifest = {
        name: 'example-plugin',
        version: '1.0.0',
        description: 'An example plugin for TaskFlow AI',
        author: 'Agions',
        main: './index.js',
        dependencies: {
          'lodash': '^4.0.0'
        },
        hooks: ['beforeWorkflowExecute', 'afterWorkflowComplete'],
        permissions: ['read:workspace', 'write:logs'],
        tags: ['example', 'demo']
      };

      expect(manifest.name).toBe('example-plugin');
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.hooks).toContain('beforeWorkflowExecute');
      expect(manifest.permissions).toContain('read:workspace');
    });
  });

  describe('HookContext', () => {
    it('should create hook context', () => {
      const context: HookContext = {
        event: 'task.start',
        data: {
          taskId: 'task-123',
          taskName: 'Build'
        },
        timestamp: Date.now(),
        source: 'workflow-engine'
      };

      expect(context.event).toBe('task.start');
      expect(context.data.taskName).toBe('Build');
      expect(context.source).toBe('workflow-engine');
    });
  });

  describe('HookResult', () => {
    it('should create successful hook result', () => {
      const result: HookResult = {
        continue: true,
        data: {
          modifiedTask: 'task-123'
        }
      };

      expect(result.continue).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should create failed hook result', () => {
      const result: HookResult = {
        continue: false,
        error: 'Plugin execution failed',
        data: undefined
      };

      expect(result.continue).toBe(false);
      expect(result.error).toBe('Plugin execution failed');
    });
  });

  describe('PluginStatus', () => {
    it('should support all plugin statuses', () => {
      const statuses: PluginStatus[] = ['loaded', 'enabled', 'disabled', 'error'];

      expect(statuses).toContain('loaded');
      expect(statuses).toContain('enabled');
      expect(statuses).toContain('disabled');
      expect(statuses).toContain('error');
    });
  });

  describe('PluginInfo', () => {
    it('should create enabled plugin info', () => {
      const pluginInfo: PluginInfo = {
        manifest: {
          name: 'enabled-plugin',
          version: '1.0.0',
          description: 'An enabled plugin',
          author: 'Agions',
          main: './index.js'
        },
        status: 'enabled',
        enabledAt: Date.now()
      };

      expect(pluginInfo.status).toBe('enabled');
      expect(pluginInfo.enabledAt).toBeDefined();
    });
  });

  describe('TaskFlowPlugin', () => {
    it('should create complete plugin interface', () => {
      const plugin: TaskFlowPlugin = {
        manifest: {
          name: 'complete-plugin',
          version: '1.0.0',
          description: 'Complete plugin example',
          author: 'Agions',
          main: './index.js'
        },
        onLoad: async () => {
          // Load logic here
        },
        onEnable: async () => {
          // Enable logic here
        },
        onDisable: async () => {
          // Disable logic here
        },
        onUnload: async () => {
          // Unload logic here
        },
        hooks: {
          beforeWorkflowExecute: async (context) => ({
            continue: true,
            data: { preProcessDone: true }
          }),
          afterWorkflowComplete: async (context) => ({
            continue: true,
            data: { postProcessDone: true }
          })
        }
      };

      expect(plugin.manifest.name).toBe('complete-plugin');
      expect(plugin.hooks).toBeDefined();
      expect(plugin.hooks!.beforeWorkflowExecute).toBeDefined();
    });
  });

  describe('BuiltinPluginName', () => {
    it('should have CACHE builtin plugin', () => {
      expect(BUILTIN_PLUGINS.CACHE).toBe('@taskflow/cache');
    });

    it('should have STORAGE builtin plugin', () => {
      expect(BUILTIN_PLUGINS.STORAGE).toBe('@taskflow/storage');
    });

    it('should have all builtin plugins', () => {
      expect(BUILTIN_PLUGINS.TELEMETRY).toBe('@taskflow/telemetry');
      expect(BUILTIN_PLUGINS.NOTIFIER).toBe('@taskflow/notifier');
    });

    it('should type builtin plugin names', () => {
      const pluginName: BuiltinPluginName = '@taskflow/cache';
      expect(pluginName).toBe('@taskflow/cache');
    });
  });

  describe('HookHandler', () => {
    it('should create synchronous hook handler', () => {
      const syncHandler: HookHandler = (context) => ({
        continue: true,
        data: { syncProcessed: true }
      });

      const result = syncHandler({
        event: 'test',
        data: {},
        timestamp: Date.now(),
        source: 'test'
      });

      if (result !== undefined && 'continue' in result) {
        expect(result.continue).toBe(true);
        expect(result.data).toBeDefined();
      }
    });

    it('should create asynchronous hook handler', async () => {
      const asyncHandler: HookHandler = async (context) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          continue: true,
          data: { asyncProcessed: true }
        };
      };

      const resultPromise = asyncHandler({
        event: 'test',
        data: {},
        timestamp: Date.now(),
        source: 'test'
      });

      const result = await resultPromise;
      expect(result.continue).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should create hook handler that stops execution', () => {
      const stopHandler: HookHandler = (context) => ({
        continue: false,
        error: 'Stopping execution',
        data: undefined
      });

      const result = stopHandler({
        event: 'test',
        data: {},
        timestamp: Date.now(),
        source: 'test'
      });

      if (result !== undefined && 'continue' in result) {
        expect(result.continue).toBe(false);
        expect(result.error).toBeDefined();
      }
    });
  });
});
