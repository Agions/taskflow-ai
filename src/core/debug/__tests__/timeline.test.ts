/**
 * 思维链时间线测试
 */

import { ThoughtChainTimeline } from '../timeline';
import { ThoughtChain, ThoughtNode, ThoughtType } from '../../thought/types';

describe('ThoughtChainTimeline', () => {
  let timeline: ThoughtChainTimeline;

  const createMockNode = (
    id: string,
    type: ThoughtType,
    content: string,
    children: ThoughtNode[] = []
  ): ThoughtNode => ({
    id,
    type,
    content,
    confidence: 0.9,
    reasoning: 'Mock reasoning',
    children,
    timestamp: Date.now(),
    metadata: {},
  });

  const createMockChain = (): ThoughtChain => ({
    id: 'chain-1',
    root: createMockNode('1', 'requirement', 'Main requirement', [
      createMockNode('2', 'analysis', 'Analysis result'),
      createMockNode('3', 'decomposition', 'Task breakdown', [
        createMockNode('4', 'task', 'Subtask 1'),
        createMockNode('5', 'task', 'Subtask 2'),
      ]),
    ]),
    nodes: new Map(),
    createdAt: Date.now() - 10000,
    updatedAt: Date.now(),
    metadata: { input: 'test input' },
  });

  beforeEach(() => {
    timeline = new ThoughtChainTimeline();
  });

  describe('fromChain', () => {
    it('should build timeline from thought chain', () => {
      const chain = createMockChain();
      const events = timeline.fromChain(chain);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('requirement');
    });

    it('should include all node types', () => {
      const chain = createMockChain();
      const events = timeline.fromChain(chain);

      const types = new Set(events.map(e => e.type));
      expect(types.has('requirement')).toBe(true);
    });

    it('should respect maxDepth option', () => {
      const deepChain: ThoughtChain = {
        id: 'deep',
        root: createMockNode('r', 'requirement', 'root', [
          createMockNode('c1', 'analysis', 'c1', [
            createMockNode('c2', 'analysis', 'c2', [
              createMockNode('c3', 'analysis', 'c3', [createMockNode('c4', 'analysis', 'c4')]),
            ]),
          ]),
        ]),
        nodes: new Map(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {},
      };

      const shallowTimeline = new ThoughtChainTimeline({ maxDepth: 2 });
      const events = shallowTimeline.fromChain(deepChain);

      // Should not include deeply nested nodes
      expect(events.length).toBeLessThanOrEqual(3);
    });
  });

  describe('toText', () => {
    it('should render timeline as text', () => {
      const chain = createMockChain();
      timeline.fromChain(chain);

      const text = timeline.toText();

      expect(text).toContain('🧠 思维链时间线');
      expect(text).toContain('📝 需求理解');
    });

    it('should show confidence stars', () => {
      const chain = createMockChain();
      timeline.fromChain(chain);

      const text = timeline.toText();

      expect(text).toMatch(/[★☆]{5}/);
    });
  });

  describe('toJSON', () => {
    it('should export timeline as JSON', () => {
      const chain = createMockChain();
      timeline.fromChain(chain);

      const json = timeline.toJSON();
      const data = JSON.parse(json);

      expect(Array.isArray(data)).toBe(true);
      expect(data[0].id).toBeDefined();
    });
  });

  describe('toProgressBar', () => {
    it('should render progress bar', () => {
      const chain = createMockChain();
      timeline.fromChain(chain);

      const bar = timeline.toProgressBar();

      expect(bar).toContain('🧠');
      expect(bar).toContain('/');
    });
  });

  describe('getStats', () => {
    it('should calculate statistics', () => {
      const chain = createMockChain();
      timeline.fromChain(chain);

      const stats = timeline.getStats();

      expect(stats.totalSteps).toBeGreaterThan(0);
      expect(stats.avgConfidence).toBeGreaterThan(0);
      expect(stats.byType).toBeDefined();
    });

    it('should count errors', () => {
      const chainWithError: ThoughtChain = {
        id: 'error-chain',
        root: createMockNode('1', 'task', 'Task with error'),
        nodes: new Map(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {},
      };
      // Add error to root node
      chainWithError.root.toolCalls = [
        { id: 'tc1', name: 'test', arguments: {}, error: 'Something failed' },
      ];

      timeline.fromChain(chainWithError);
      const stats = timeline.getStats();

      expect(stats.errorCount).toBe(1);
    });

    it('should aggregate by type', () => {
      const chain = createMockChain();
      timeline.fromChain(chain);

      const stats = timeline.getStats();

      expect(stats.byType['requirement']).toBe(1);
      expect(stats.byType['task']).toBe(2);
    });
  });

  describe('options', () => {
    it('should hide reasoning when disabled', () => {
      const chain = createMockChain();
      const noReasoningTimeline = new ThoughtChainTimeline({ showReasoning: false });
      noReasoningTimeline.fromChain(chain);

      const text = noReasoningTimeline.toText();

      expect(text).not.toContain('💭');
    });

    it('should use absolute time format', () => {
      const chain = createMockChain();
      const absTimeline = new ThoughtChainTimeline({ timeFormat: 'absolute' });
      absTimeline.fromChain(chain);

      const text = absTimeline.toText();

      // Should contain time like 11:05:00
      expect(text).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it('should use duration time format', () => {
      const chain = createMockChain();
      const durTimeline = new ThoughtChainTimeline({ timeFormat: 'duration' });
      durTimeline.fromChain(chain);

      const text = durTimeline.toText();

      expect(text).toMatch(/\+\d+ms/);
    });
  });
});
