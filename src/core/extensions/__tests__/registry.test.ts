/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { ExtensionRegistry, ExtensionType, ExtensionDefinition } from '../registry';

import { ExtensionTypes } from '@/types/extensions';

describe('ExtensionRegistry', () => {
  let registry: ExtensionRegistry;

  beforeEach(() => {
    registry = new ExtensionRegistry();
  });

  it('should register an extension', () => {
    const definition: ExtensionDefinition = {
      type: ExtensionTypes.AGENT,
      id: 'test-agent',
      version: '1.0.0',
      name: 'Test Agent',
      implementation: {}
    };

    registry.register(definition);
    expect(registry.has('test-agent')).toBe(true);
  });

  it('should get an extension', () => {
    const definition: ExtensionDefinition = {
      type: ExtensionTypes.AGENT,
      id: 'test-agent',
      version: '1.0.0',
      name: 'Test Agent',
      implementation: {}
    };

    registry.register(definition);
    const retrieved = registry.get('test-agent');

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe('test-agent');
  });

  it('should unregister an extension', () => {
    const definition: ExtensionDefinition = {
      type: ExtensionTypes.AGENT,
      id: 'test-agent',
      version: '1.0.0',
      name: 'Test Agent',
      implementation: {}
    };

    registry.register(definition);
    expect(registry.has('test-agent')).toBe(true);

    registry.unregister('test-agent');
    expect(registry.has('test-agent')).toBe(false);
  });

  it('should get all extensions of a type', () => {
    const agentDef: ExtensionDefinition = {
      type: ExtensionTypes.AGENT,
      id: 'test-agent',
      version: '1.0.0',
      name: 'Test Agent',
      implementation: {}
    };

    const toolDef: ExtensionDefinition = {
      type: ExtensionTypes.TOOL,
      id: 'test-tool',
      version: '1.0.0',
      name: 'Test Tool',
      implementation: {}
    };

    registry.register(agentDef);
    registry.register(toolDef);

    const agents = registry.getAll(ExtensionTypes.AGENT);
    const tools = registry.getAll(ExtensionTypes.TOOL);

    expect(agents.length).toBe(1);
    expect(tools.length).toBe(1);
  });

  it('should clear all extensions', () => {
    const definition: ExtensionDefinition = {
      type: ExtensionTypes.AGENT,
      id: 'test-agent',
      version: '1.0.0',
      name: 'Test Agent',
      implementation: {}
    };

    registry.register(definition);
    expect(registry.getAll().length).toBe(1);

    registry.clear();
    expect(registry.getAll().length).toBe(0);
  });
});
