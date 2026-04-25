/**
 * Plugin Types Tests
 * TaskFlow AI v4.0
 */

import type {
  PluginRegistry,
  Plugin,
  PluginHooks,
  PluginCommand,
  PluginVisualization,
  PluginContext,
  PluginMetadata,
} from '../types';

describe('Plugin Types', () => {
  describe('Plugin', () => {
    it('should create a valid plugin', () => {
      const plugin: Plugin = {
        id: 'plugin-1',
        name: 'Test Plugin',
        version: '1.0.0',
        main: './index.js',
      };
      expect(plugin.id).toBe('plugin-1');
      expect(plugin.version).toBe('1.0.0');
    });

    it('should support all optional fields', () => {
      const plugin: Plugin = {
        id: 'plugin-2',
        name: 'Full Plugin',
        version: '2.0.0',
        description: 'A comprehensive plugin',
        author: 'Agions',
        main: './dist/index.js',
        dependencies: { lodash: '^4.0.0' },
        hooks: {
          onInit: async () => {},
          onTaskCreate: (task) => task,
        },
        commands: [{ name: 'test', description: 'Test cmd', action: async () => {} }],
        visualizations: [{ name: 'chart', type: 'bar', renderer: () => '<svg/>' }],
        configSchema: { type: 'object' },
      };
      expect(plugin.author).toBe('Agions');
      expect(plugin.dependencies).toBeDefined();
      expect(plugin.commands).toHaveLength(1);
    });
  });

  describe('PluginHooks', () => {
    it('should define all lifecycle hooks', () => {
      const hooks: PluginHooks = {
        onInit: async (ctx) => { ctx.appRoot; },
        onLoad: async (plugin) => { plugin.id; },
        onUnload: async (plugin) => { plugin.name; },
        onTaskCreate: (task) => task,
        onTaskUpdate: (task) => task,
        onTaskComplete: async (task) => { task.id; },
        onWorkflowExecute: async (wf, ctx) => { ctx.appRoot; },
        onCommand: (cmd, args) => `${cmd}: ${args.join(',')}`,
      };
      expect(hooks.onInit).toBeDefined();
      expect(hooks.onCommand).toBeDefined();
    });
  });

  describe('PluginCommand', () => {
    it('should create a valid command', () => {
      const cmd: PluginCommand = {
        name: 'generate',
        description: 'Generate code',
        action: async (args) => { console.log(args); },
      };
      expect(cmd.name).toBe('generate');
    });
  });

  describe('PluginVisualization', () => {
    it('should create a valid visualization', () => {
      const viz: PluginVisualization = {
        name: 'Gantt Chart',
        type: 'gantt',
        renderer: (data) => `<chart>${JSON.stringify(data)}</chart>`,
      };
      expect(viz.name).toBe('Gantt Chart');
      expect(typeof viz.renderer).toBe('function');
    });
  });

  describe('PluginMetadata', () => {
    it('should create valid metadata', () => {
      const meta: PluginMetadata = {
        id: 'meta-1',
        name: 'My Plugin',
        version: '1.0.0',
        description: 'Desc',
        author: 'Agions',
        repository: 'https://github.com/test/plugin',
        keywords: ['test', 'plugin'],
        license: 'MIT',
      };
      expect(meta.keywords).toHaveLength(2);
      expect(meta.license).toBe('MIT');
    });
  });

  describe('PluginRegistry interface', () => {
    it('should define registry methods', () => {
      const registry: PluginRegistry = {
        register: (p) => { p.id; },
        unregister: (id) => { id; },
        get: (id) => undefined,
        getAll: () => [],
      };
      expect(typeof registry.register).toBe('function');
      expect(typeof registry.get).toBe('function');
    });
  });
});
