/**
 * Thought Chain Types Tests
 * TaskFlow AI v4.0
 */

import type {
  ThoughtType,
  ThoughtNode,
  ToolCall,
  ThoughtChain,
  ReasoningStep,
  ThoughtChainOptions,
  ThoughtParseResult,
} from '../types';

describe('Thought Types', () => {
  describe('ThoughtType', () => {
    const validTypes: ThoughtType[] = [
      'requirement', 'analysis', 'decomposition', 'task',
      'action', 'reflection', 'synthesis',
    ];

    it('should have exactly 7 thought types', () => {
      expect(validTypes).toHaveLength(7);
    });

    it.each(validTypes)('should accept valid ThoughtType: %s', (type) => {
      expect(typeof type).toBe('string');
      expect(type.length).toBeGreaterThan(0);
    });

    it('should not accept invalid ThoughtType', () => {
      const invalidValue = 'invalid_type' as unknown as ThoughtType;
      expect(validTypes).not.toContain(invalidValue);
    });
  });

  describe('ToolCall', () => {
    it('should create a valid ToolCall', () => {
      const toolCall: ToolCall = {
        id: 'tc-1',
        name: 'file_read',
        arguments: { path: '/test.txt' },
      };
      expect(toolCall.id).toBe('tc-1');
      expect(toolCall.name).toBe('file_read');
      expect(toolCall.arguments).toEqual({ path: '/test.txt' });
    });

    it('should support optional result and error', () => {
      const toolCall: ToolCall = {
        id: 'tc-2',
        name: 'shell_exec',
        arguments: { command: 'ls' },
        result: 'file1.txt\nfile2.txt',
      };
      expect(toolCall.result).toBe('file1.txt\nfile2.txt');
      expect(toolCall.error).toBeUndefined();
    });

    it('should support error case', () => {
      const toolCall: ToolCall = {
        id: 'tc-3',
        name: 'invalid_tool',
        arguments: {},
        error: 'Tool not found',
      };
      expect(toolCall.error).toBe('Tool not found');
    });
  });

  describe('ThoughtNode', () => {
    it('should create a valid ThoughtNode', () => {
      const node: ThoughtNode = {
        id: 'node-1',
        type: 'requirement',
        content: 'Understand user requirements',
        confidence: 0.95,
        reasoning: 'Based on initial analysis',
        children: [],
        timestamp: Date.now(),
      };
      expect(node.id).toBe('node-1');
      expect(node.type).toBe('requirement');
      expect(node.confidence).toBeGreaterThanOrEqual(0);
      expect(node.confidence).toBeLessThanOrEqual(1);
      expect(node.children).toEqual([]);
    });

    it('should support nested ThoughtNode children', () => {
      const childNode: ThoughtNode = {
        id: 'child-1',
        type: 'task',
        content: 'Create test cases',
        confidence: 0.85,
        reasoning: 'Test coverage needed',
        children: [],
        timestamp: Date.now(),
      };

      const parentNode: ThoughtNode = {
        id: 'parent-1',
        type: 'decomposition',
        content: 'Break down requirements',
        confidence: 0.9,
        reasoning: 'Requirements need splitting',
        children: [childNode],
        timestamp: Date.now(),
      };

      expect(parentNode.children).toHaveLength(1);
      expect(parentNode.children[0].id).toBe('child-1');
    });

    it('should support optional metadata and toolCalls', () => {
      const node: ThoughtNode = {
        id: 'node-2',
        type: 'action',
        content: 'Execute tool',
        confidence: 0.8,
        reasoning: 'Need to read file',
        children: [],
        timestamp: Date.now(),
        model: 'gpt-4',
        metadata: { source: 'user-input' },
        toolCalls: [{ id: 'tc-1', name: 'file_read', arguments: {} }],
      };

      expect(node.model).toBe('gpt-4');
      expect(node.metadata).toEqual({ source: 'user-input' });
      expect(node.toolCalls).toHaveLength(1);
    });
  });

  describe('ThoughtChain', () => {
    it('should create a valid ThoughtChain', () => {
      const root: ThoughtNode = {
        id: 'root',
        type: 'requirement',
        content: 'Initial requirement',
        confidence: 1.0,
        reasoning: 'Start',
        children: [],
        timestamp: Date.now(),
      };

      const chain: ThoughtChain = {
        id: 'chain-1',
        root,
        nodes: new Map([['root', root]]),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {},
      };

      expect(chain.id).toBe('chain-1');
      expect(chain.root.id).toBe('root');
      expect(chain.nodes.size).toBe(1);
      expect(chain.nodes.get('root')).toBe(root);
    });

    it('should support metadata fields', () => {
      const chain: ThoughtChain = {
        id: 'chain-2',
        root: {
          id: 'r', type: 'analysis', content: 'Test',
          confidence: 0.5, reasoning: 'Test', children: [], timestamp: Date.now(),
        },
        nodes: new Map(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {
          input: 'user input text',
          output: 'analysis result',
          duration: 1500,
          model: 'gpt-4',
        },
      };

      expect(chain.metadata.input).toBe('user input text');
      expect(chain.metadata.duration).toBe(1500);
    });
  });

  describe('ReasoningStep', () => {
    it('should create a valid ReasoningStep', () => {
      const step: ReasoningStep = {
        step: 1,
        type: 'analysis',
        title: 'Analyze requirements',
        description: 'Break down the requirements',
        confidence: 0.9,
      };

      expect(step.step).toBe(1);
      expect(step.type).toBe('analysis');
      expect(step.children).toBeUndefined();
    });

    it('should support optional fields', () => {
      const step: ReasoningStep = {
        step: 2,
        type: 'task',
        title: 'Create implementation plan',
        description: 'Plan the implementation',
        reasoning: 'Need to plan before coding',
        output: 'Implementation plan created',
        confidence: 0.85,
        duration: 500,
        children: [{
          step: 3,
          type: 'action',
          title: 'Write code',
          description: 'Implement feature',
          confidence: 0.8,
        }],
      };

      expect(step.reasoning).toBeDefined();
      expect(step.output).toBeDefined();
      expect(step.duration).toBe(500);
      expect(step.children).toHaveLength(1);
    });
  });

  describe('ThoughtChainOptions', () => {
    it('should create default options', () => {
      const options: ThoughtChainOptions = {};
      expect(options.verbose).toBeUndefined();
      expect(options.maxDepth).toBeUndefined();
      expect(options.maxNodes).toBeUndefined();
    });

    it('should create full options', () => {
      const options: ThoughtChainOptions = {
        verbose: true,
        maxDepth: 10,
        maxNodes: 100,
        enableReflection: true,
        outputFormat: 'json',
      };
      expect(options.verbose).toBe(true);
      expect(options.maxDepth).toBe(10);
      expect(options.outputFormat).toBe('json');
    });

    it('should accept all output formats', () => {
      const formats: Array<ThoughtChainOptions['outputFormat']> = ['text', 'markdown', 'json'];
      expect(formats).toHaveLength(3);
    });
  });

  describe('ThoughtParseResult', () => {
    it('should create a valid parse result', () => {
      const result: ThoughtParseResult = {
        chain: {
          id: 'chain-1',
          root: {
            id: 'root', type: 'requirement', content: 'Test',
            confidence: 0.9, reasoning: 'Test', children: [], timestamp: Date.now(),
          },
          nodes: new Map(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          metadata: {},
        },
        steps: [],
        summary: 'Test summary',
      };

      expect(result.chain).toBeDefined();
      expect(result.summary).toBe('Test summary');
      expect(result.tasks).toBeUndefined();
      expect(result.risks).toBeUndefined();
    });

    it('should support tasks and risks', () => {
      const result: ThoughtParseResult = {
        chain: {
          id: 'chain-2',
          root: {
            id: 'root', type: 'analysis', content: 'Test',
            confidence: 0.9, reasoning: 'Test', children: [], timestamp: Date.now(),
          },
          nodes: new Map(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          metadata: {},
        },
        steps: [],
        summary: 'Analysis complete',
        tasks: ['Task 1', 'Task 2'],
        risks: ['Risk 1'],
      };

      expect(result.tasks).toHaveLength(2);
      expect(result.risks).toHaveLength(1);
    });
  });
});
